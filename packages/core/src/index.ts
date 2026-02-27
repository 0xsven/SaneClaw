export type AgentTrigger = {
  event: string;
};

export type AgentTool = {
  name: string;
  description?: string;
};

export type AgentRunContext = {
  trigger: AgentTrigger;
};

export type AgentFunction<TInput = unknown> = {
  id: string;
  description?: string;
  trigger: AgentTrigger;
  tools: AgentTool[];
  run: (input: TInput, context: AgentRunContext) => Promise<void> | void;
};
