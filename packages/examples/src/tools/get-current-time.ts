import type { LlmToolDefinition } from "@agent-functions/llm";

export const getCurrentTimeTool: LlmToolDefinition = {
  name: "get_current_time",
  description: "Returns current local ISO timestamp",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {}
  },
  execute: async () => ({
    iso: new Date().toISOString()
  })
};
