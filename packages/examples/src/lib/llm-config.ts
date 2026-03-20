import { createProvider, type VercelProviderConfig } from "@agent-functions/llm";

export function getProviderConfig(): VercelProviderConfig {
  const provider = (process.env.AGENT_LLM_PROVIDER ?? "openrouter") as VercelProviderConfig["provider"];

  if (provider === "anthropic") {
    return {
      provider,
      apiKey: process.env.ANTHROPIC_API_KEY
    };
  }

  if (provider === "openai") {
    return {
      provider,
      apiKey: process.env.OPENAI_API_KEY
    };
  }

  return {
    provider: "openrouter",
    apiKey: process.env.OPENROUTER_API_KEY
  };
}

export function resolveDefaultModel(provider: VercelProviderConfig["provider"]): string {
  if (provider === "anthropic") {
    return "claude-3-5-haiku-latest";
  }

  if (provider === "openai") {
    return "gpt-4.1-mini";
  }

  return "openai/gpt-4.1-mini";
}

export function getConfiguredProvider(): ReturnType<typeof createProvider> | null {
  const config = getProviderConfig();
  const key =
    config.apiKey ??
    process.env.OPENROUTER_API_KEY ??
    process.env.OPENAI_API_KEY ??
    process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return createProvider(config);
}

export function getModel(): string {
  const config = getProviderConfig();
  return process.env.AGENT_LLM_MODEL ?? resolveDefaultModel(config.provider);
}

export function getModelInstructions(): string {
  const config = getProviderConfig();

  if (config.provider === "openrouter") {
    return [
      "Model selection:",
      '- Set model per agent with `model: "provider/model-name"` (example: `model: "minimax/minimax-m2.5"`).',
      '- OpenRouter examples: `openai/gpt-4.1-mini`, `anthropic/claude-3.5-haiku`, `minimax/minimax-m2.5`.',
      "- You can also set runner default with `createRunner({ model: ... })`."
    ].join("\n");
  }

  if (config.provider === "openai") {
    return [
      "Model selection:",
      '- Set model per agent with `model: "..."` (example: `model: "gpt-4.1-mini"`).',
      "- OpenAI examples: `gpt-4.1-mini`, `gpt-4.1`, `gpt-4o-mini`.",
      "- You can also set runner default with `createRunner({ model: ... })`."
    ].join("\n");
  }

  return [
    "Model selection:",
    '- Set model per agent with `model: "..."` (example: `model: "claude-3-5-haiku-latest"`).',
    "- Anthropic examples: `claude-3-5-haiku-latest`, `claude-3-7-sonnet-latest`.",
    "- You can also set runner default with `createRunner({ model: ... })`."
  ].join("\n");
}

export function hasLlmApiKey(): boolean {
  const config = getProviderConfig();
  const key =
    config.apiKey ??
    process.env.OPENROUTER_API_KEY ??
    process.env.OPENAI_API_KEY ??
    process.env.ANTHROPIC_API_KEY;
  return Boolean(key);
}
