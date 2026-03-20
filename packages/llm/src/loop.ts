import type { LlmMessage, LlmProvider, LlmToolDefinition } from "./types.js";

export type RunAgentLoopOptions = {
  provider: LlmProvider;
  model: string;
  messages: LlmMessage[];
  tools?: LlmToolDefinition[];
  maxSteps?: number;
  temperature?: number;
};

export type RunAgentLoopResult = {
  finalText: string;
  steps: number;
  stopReason: "completed" | "max-steps";
  messages: LlmMessage[];
  toolCalls: Array<{
    callId: string;
    toolName: string;
    args: unknown;
  }>;
  toolResults: Array<{
    callId: string;
    toolName: string;
    result: unknown;
    isError: boolean;
  }>;
};

type ToolResultRecord = {
  callId: string;
  toolName: string;
  result: unknown;
  isError: boolean;
};

function buildAssistantMessage(text: string | undefined, toolCalls: RunAgentLoopResult["toolCalls"]): LlmMessage {
  const content = [];

  if (text) {
    content.push({ type: "text" as const, text });
  }

  for (const call of toolCalls) {
    content.push({
      type: "tool-call" as const,
      callId: call.callId,
      toolName: call.toolName,
      args: call.args
    });
  }

  return {
    role: "assistant",
    content
  };
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown tool execution error.";
}

export async function runAgentLoop(options: RunAgentLoopOptions): Promise<RunAgentLoopResult> {
  const maxSteps = options.maxSteps ?? 8;
  const tools = options.tools ?? [];
  const toolByName = new Map<string, LlmToolDefinition>(tools.map((tool) => [tool.name, tool]));
  const history: LlmMessage[] = [...options.messages];
  const toolCalls: RunAgentLoopResult["toolCalls"] = [];
  const toolResults: ToolResultRecord[] = [];
  let finalText = "";

  for (let step = 1; step <= maxSteps; step += 1) {
    const generation = await options.provider.generate({
      model: options.model,
      messages: history,
      tools,
      temperature: options.temperature
    });

    const stepToolCalls = generation.toolCalls.map((call) => ({
      callId: call.callId,
      toolName: call.toolName,
      args: call.args
    }));

    if (generation.text) {
      finalText = generation.text;
    }

    history.push(buildAssistantMessage(generation.text, stepToolCalls));
    toolCalls.push(...stepToolCalls);

    if (stepToolCalls.length === 0) {
      return {
        finalText,
        steps: step,
        stopReason: "completed",
        messages: history,
        toolCalls,
        toolResults
      };
    }

    for (const call of stepToolCalls) {
      const tool = toolByName.get(call.toolName);
      let toolResult: ToolResultRecord;

      if (!tool) {
        toolResult = {
          callId: call.callId,
          toolName: call.toolName,
          result: `Unknown tool "${call.toolName}".`,
          isError: true
        };
      } else {
        try {
          const result = await tool.execute(call.args);
          toolResult = {
            callId: call.callId,
            toolName: call.toolName,
            result,
            isError: false
          };
        } catch (error) {
          toolResult = {
            callId: call.callId,
            toolName: call.toolName,
            result: stringifyError(error),
            isError: true
          };
        }
      }

      toolResults.push(toolResult);
      history.push({
        role: "tool",
        content: [
          {
            type: "tool-result",
            callId: toolResult.callId,
            toolName: toolResult.toolName,
            result: toolResult.result,
            isError: toolResult.isError
          }
        ]
      });
    }
  }

  return {
    finalText,
    steps: maxSteps,
    stopReason: "max-steps",
    messages: history,
    toolCalls,
    toolResults
  };
}
