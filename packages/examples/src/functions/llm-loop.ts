import type { AgentFunction } from "@agent-functions/core";
import { getCurrentTimeTool } from "../tools/get-current-time.js";

type LlmLoopInput = {
  question: string;
};

export const llmLoopAgentFunction: AgentFunction<LlmLoopInput> = {
  id: "llm-loop-demo",
  description: "Runs an LLM loop with a current-time tool",
  model: "minimax/minimax-m2.5",
  maxSteps: 6,
  tools: [getCurrentTimeTool],
  beforeRun: async (input) => ({
    systemMessage: "You are a concise assistant. Use tools when needed.",
    userMessage: input.question
  })
};
