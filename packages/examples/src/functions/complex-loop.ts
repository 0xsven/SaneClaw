import type { AgentFunction } from "@agent-functions/core";
import { planningTools } from "../tools/planning.js";

type ComplexLoopInput = {
  objective: string;
};

export const complexLoopAgentFunction: AgentFunction<ComplexLoopInput> = {
  id: "complex-loop-demo",
  description: "Runs a multi-step planning loop with several tool calls",
  model: "openai/gpt-4.1-mini",
  maxSteps: 8,
  tools: planningTools,
  beforeRun: async (input) => ({
    systemMessage:
      "You are a staff engineer. You must call at least 3 tools before giving a final answer. " +
      "Always call score_options before decide_best_option. " +
      "After using tools, return a clean final recommendation in markdown with no raw tool transcript.",
    userMessage:
      `Objective: ${input.objective}\n` +
      "Use the tools to gather goals and constraints, generate options, score them, then choose one."
  })
};
