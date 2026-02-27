import type { AgentFunction } from "@agent-functions/core";

type HelloInput = {
  name: string;
};

export const helloAgentFunction: AgentFunction<HelloInput> = {
  id: "hello-world",
  description: "Logs a greeting for the provided name",
  trigger: {
    event: "example.hello.requested"
  },
  tools: [{ name: "console.log", description: "Print output during local development" }],
  run: async (input) => {
    console.log(`Hello ${input.name}, this is your first agent-function prototype.`);
  }
};
