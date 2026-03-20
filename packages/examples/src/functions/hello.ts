import type { AgentFunction } from "@agent-functions/core";

type HelloInput = {
  name: string;
};

export const helloAgentFunction: AgentFunction<HelloInput> = {
  id: "hello-world",
  description: "Produces a greeting for the provided name",
  model: "openai/gpt-4.1-mini",
  tools: [],
  beforeRun: async (input) => ({
    systemMessage: "You are a friendly assistant. Write one warm sentence.",
    userMessage: `Say hello to ${input.name}.`
  })
};
