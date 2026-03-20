export type AgentTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  execute: (args: unknown) => Promise<unknown> | unknown;
};

export type AgentInput = {
  systemMessage: string;
  userMessage: string;
};

export type AgentBeforeRunContext = {
  agentId: string;
  meta?: Record<string, unknown>;
};

export type AgentFunction<TBeforeInput = AgentInput> = {
  id: string;
  description?: string;
  model?: string;
  maxSteps?: number;
  tools: AgentTool[];
  beforeRun?: (
    input: TBeforeInput,
    context: AgentBeforeRunContext
  ) => Promise<AgentInput | false> | AgentInput | false;
};
