import type { LlmToolDefinition } from "@agent-functions/llm";

export const getProjectGoalsTool: LlmToolDefinition = {
  name: "get_project_goals",
  description: "Returns canonical project goals",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {}
  },
  execute: async () => ({
    goals: [
      "Keep architecture simple and composable",
      "Support multiple LLM providers via one interface",
      "Add observability with minimal runtime coupling"
    ]
  })
};

export const listConstraintsTool: LlmToolDefinition = {
  name: "list_constraints",
  description: "Returns key constraints",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {}
  },
  execute: async () => ({
    constraints: [
      "Small codebase and low complexity preferred",
      "Must work in TypeScript NodeNext ESM",
      "Favor deterministic behavior in examples"
    ]
  })
};

export const generateOptionsTool: LlmToolDefinition = {
  name: "generate_options",
  description: "Generates candidate implementation options",
  inputSchema: {
    type: "object",
    additionalProperties: true,
    properties: {
      goals: { type: "array" },
      constraints: { type: "array" }
    }
  },
  execute: async () => ({
    options: [
      {
        id: "A",
        title: "Single-package integration",
        pros: ["Fast implementation"],
        cons: ["Couples concerns"]
      },
      {
        id: "B",
        title: "Adapter package with runner hooks",
        pros: ["Clear boundaries", "Good extensibility"],
        cons: ["Slightly more code"]
      },
      {
        id: "C",
        title: "External orchestration service",
        pros: ["Highly scalable"],
        cons: ["Overkill for current stage"]
      }
    ]
  })
};

export const scoreOptionsTool: LlmToolDefinition = {
  name: "score_options",
  description: "Scores options against weighted criteria",
  inputSchema: {
    type: "object",
    additionalProperties: true,
    properties: {
      options: { type: "array" }
    }
  },
  execute: async () => ({
    scores: [
      { id: "A", score: 6.8, rationale: "Fast but less maintainable" },
      { id: "B", score: 9.1, rationale: "Best trade-off for current project size" },
      { id: "C", score: 5.4, rationale: "Too complex right now" }
    ]
  })
};

export const decideBestOptionTool: LlmToolDefinition = {
  name: "decide_best_option",
  description: "Selects the final recommended option",
  inputSchema: {
    type: "object",
    additionalProperties: true,
    properties: {
      scores: { type: "array" }
    }
  },
  execute: async (args) => {
    const scores =
      typeof args === "object" && args !== null && "scores" in args
        ? (args as { scores?: Array<{ id: string; score: number }> }).scores
        : undefined;
    const best = scores?.slice().sort((a, b) => b.score - a.score)[0] ?? { id: "B", score: 9.1 };
    return {
      selected: best.id,
      confidence: "high",
      reason: "Best balance of extensibility, simplicity, and implementation speed."
    };
  }
};

export const planningTools: LlmToolDefinition[] = [
  getProjectGoalsTool,
  listConstraintsTool,
  generateOptionsTool,
  scoreOptionsTool,
  decideBestOptionTool
];
