export type LlmMessageRole = "system" | "user" | "assistant" | "tool";

export type LlmTextPart = {
  type: "text";
  text: string;
};

export type LlmToolCallPart = {
  type: "tool-call";
  callId: string;
  toolName: string;
  args: unknown;
};

export type LlmToolResultPart = {
  type: "tool-result";
  callId: string;
  toolName: string;
  result: unknown;
  isError?: boolean;
};

export type LlmMessagePart = LlmTextPart | LlmToolCallPart | LlmToolResultPart;

export type LlmMessage = {
  role: LlmMessageRole;
  content: LlmMessagePart[];
};

export type LlmToolDefinition = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  execute: (args: unknown) => Promise<unknown> | unknown;
};

export type LlmGenerationRequest = {
  model: string;
  messages: LlmMessage[];
  temperature?: number;
  tools?: LlmToolDefinition[];
};

export type LlmGenerationResult = {
  text?: string;
  toolCalls: LlmToolCallPart[];
  finishReason?: string;
};

export type LlmProvider = {
  generate: (request: LlmGenerationRequest) => Promise<LlmGenerationResult>;
};
