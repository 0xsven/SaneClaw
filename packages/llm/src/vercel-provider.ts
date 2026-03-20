import { generateText, jsonSchema, tool } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LlmGenerationRequest, LlmMessage, LlmProvider, LlmToolDefinition } from "./types.js";

export type VercelProviderConfig = {
  provider: "openai" | "anthropic" | "openrouter";
  apiKey?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
};

type SdkMessagePart = {
  type: string;
  [key: string]: unknown;
};

type SdkMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | SdkMessagePart[];
};

type SdkToolCall = {
  toolName?: string;
  toolCallId?: string;
  args?: unknown;
};

type SdkGenerateResult = {
  text?: string;
  finishReason?: string;
  toolCalls?: SdkToolCall[];
};

function toPrompt(messages: LlmMessage[]): string {
  return messages
    .map((message) => {
      const body = message.content
        .map((part) => {
          if (part.type === "text") {
            return part.text;
          }

          if (part.type === "tool-call") {
            return `Tool call ${part.toolName}(${JSON.stringify(part.args)})`;
          }

          return `Tool result ${part.toolName}: ${JSON.stringify(part.result)}`;
        })
        .join("\n");

      return `${message.role.toUpperCase()}:\n${body}`;
    })
    .join("\n\n");
}

function mapMessages(messages: LlmMessage[]): SdkMessage[] {
  return messages.map((message) => {
    const textOnlyContent = message.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n");

    if (message.role === "system") {
      return {
        role: "system",
        content: textOnlyContent
      };
    }

    if (message.role === "user") {
      return {
        role: "user",
        content: textOnlyContent
      };
    }

    const parts = message.content.map((part): SdkMessagePart => {
      if (part.type === "text") {
        return { type: "text", text: part.text };
      }

      if (part.type === "tool-call") {
        return {
          type: "tool-call",
          toolCallId: part.callId,
          toolName: part.toolName,
          args: part.args
        };
      }

      return {
        type: "tool-result",
        toolCallId: part.callId,
        toolName: part.toolName,
        result: part.result,
        isError: part.isError
      };
    });

    return {
      role: message.role,
      content: parts
    };
  });
}

function mapTools(tools: LlmToolDefinition[] | undefined): Record<string, unknown> | undefined {
  if (!tools || tools.length === 0) {
    return undefined;
  }

  const mapped = tools.reduce<Record<string, unknown>>((acc, toolDef) => {
    acc[toolDef.name] = tool({
      description: toolDef.description,
      inputSchema: jsonSchema(
        toolDef.inputSchema ?? {
          type: "object",
          additionalProperties: true
        }
      )
    });
    return acc;
  }, {});

  return mapped;
}

function createModel(config: VercelProviderConfig, modelId: string): unknown {
  if (config.provider === "anthropic") {
    const anthropic = createAnthropic({
      apiKey: config.apiKey ?? process.env.ANTHROPIC_API_KEY
    });
    return anthropic(modelId);
  }

  if (config.provider === "openrouter") {
    const openrouterHeaders: Record<string, string> = {
      ...(process.env.OPENROUTER_HTTP_REFERER
        ? { "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER }
        : {}),
      ...(process.env.OPENROUTER_X_TITLE ? { "X-Title": process.env.OPENROUTER_X_TITLE } : {}),
      ...(config.headers ?? {})
    };

    const openrouter = createOpenAI({
      apiKey: config.apiKey ?? process.env.OPENROUTER_API_KEY,
      baseURL: config.baseUrl ?? process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
      headers: openrouterHeaders
    });
    return openrouter(modelId);
  }

  const openai = createOpenAI({
    apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
    baseURL: config.baseUrl,
    headers: config.headers
  });
  return openai(modelId);
}

function toLlmGenerationResult(raw: SdkGenerateResult) {
  const toolCalls =
    raw.toolCalls?.map((call, index) => ({
      type: "tool-call" as const,
      callId: call.toolCallId ?? `tool-call-${index + 1}`,
      toolName: call.toolName ?? "unknown-tool",
      args: call.args ?? {}
    })) ?? [];

  return {
    text: raw.text,
    toolCalls,
    finishReason: raw.finishReason
  };
}

export function createProvider(config: VercelProviderConfig): LlmProvider {
  return {
    async generate(request: LlmGenerationRequest) {
      const model = createModel(config, request.model);
      const prompt = toPrompt(request.messages);
      const tools = mapTools(request.tools);

      const result = (await generateText({
        model: model as never,
        prompt,
        temperature: request.temperature,
        ...(tools ? { tools: tools as never } : {})
      })) as unknown as SdkGenerateResult;

      return toLlmGenerationResult(result);
    }
  };
}
