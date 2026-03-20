import type { AgentFunction, AgentInput } from "@agent-functions/core";
import { runAgentLoop, type LlmProvider } from "@agent-functions/llm";

export type AgentInvocation = {
  id: string;
  input?: unknown;
  meta?: Record<string, unknown>;
};

export type RunnerResult = {
  functionId: string;
  ok: boolean;
  skipped: boolean;
  durationMs: number;
  output?: unknown;
  error?: string;
};

export type RunnerObserver = {
  onRunStart?: (input: { runId: string; call: AgentInvocation }) => void | Promise<void>;
  onRunEnd?: (input: { runId: string; call: AgentInvocation; result: RunnerResult }) => void | Promise<void>;
  onFunctionStart?: (input: { runId: string; call: AgentInvocation; functionId: string }) => void | Promise<void>;
  onFunctionResult?: (input: {
    runId: string;
    call: AgentInvocation;
    functionId: string;
    result: RunnerResult;
  }) => void | Promise<void>;
};

export type CreateRunnerOptions = {
  provider: LlmProvider;
  model?: string;
  defaultMaxSteps?: number;
  temperature?: number;
};

export type AgentRunner = {
  register: (fn: AgentFunction<any> | AgentFunction<any>[]) => void;
  observe: (observer: RunnerObserver) => () => void;
  run: (call: AgentInvocation) => Promise<RunnerResult>;
  listRegisteredIds: () => string[];
};

function isAgentInput(input: unknown): input is AgentInput {
  return (
    typeof input === "object" &&
    input !== null &&
    "systemMessage" in input &&
    "userMessage" in input &&
    typeof (input as { systemMessage?: unknown }).systemMessage === "string" &&
    typeof (input as { userMessage?: unknown }).userMessage === "string"
  );
}

export function createRunner(options: CreateRunnerOptions): AgentRunner {
  const registry = new Map<string, AgentFunction<any>>();
  const observers = new Set<RunnerObserver>();

  function createRunId(): string {
    const random = Math.random().toString(36).slice(2, 10);
    return `run_${Date.now()}_${random}`;
  }

  async function notifyObservers(handler: (observer: RunnerObserver) => void | Promise<void>): Promise<void> {
    for (const observer of observers) {
      try {
        await handler(observer);
      } catch {
        // Observability should never break execution.
      }
    }
  }

  function register(fn: AgentFunction<any> | AgentFunction<any>[]): void {
    const entries = Array.isArray(fn) ? fn : [fn];
    for (const entry of entries) {
      if (registry.has(entry.id)) {
        throw new Error(`Duplicate agent id "${entry.id}" registered.`);
      }
      registry.set(entry.id, entry);
    }
  }

  function observe(observer: RunnerObserver): () => void {
    observers.add(observer);
    return () => {
      observers.delete(observer);
    };
  }

  async function resolveInput(entry: AgentFunction<any>, call: AgentInvocation): Promise<AgentInput | false> {
    if (entry.beforeRun) {
      return entry.beforeRun(call.input, { agentId: entry.id, meta: call.meta });
    }

    if (!isAgentInput(call.input)) {
      throw new Error(
        `Agent "${entry.id}" requires input { systemMessage, userMessage } when beforeRun is not defined.`
      );
    }

    return call.input;
  }

  async function run(call: AgentInvocation): Promise<RunnerResult> {
    const runId = createRunId();
    const entry = registry.get(call.id);
    if (!entry) {
      const available = [...registry.keys()].join(", ");
      throw new Error(`No agent registered for "${call.id}". Available ids: ${available || "(none)"}`);
    }

    await notifyObservers((observer) => observer.onRunStart?.({ runId, call }));
    await notifyObservers((observer) => observer.onFunctionStart?.({ runId, call, functionId: entry.id }));

    const startedAt = Date.now();
    let result: RunnerResult;
    try {
      const preparedInput = await resolveInput(entry, call);
      if (preparedInput === false) {
        result = {
          functionId: entry.id,
          ok: true,
          skipped: true,
          durationMs: Date.now() - startedAt
        };
      } else {
        const model = entry.model ?? options.model;
        if (!model) {
          throw new Error(
            `Agent "${entry.id}" has no model configured. Set agent.model or pass createRunner({ model: "..." }).`
          );
        }

        const messages = [
          {
            role: "system" as const,
            content: [{ type: "text" as const, text: preparedInput.systemMessage }]
          },
          {
            role: "user" as const,
            content: [{ type: "text" as const, text: preparedInput.userMessage }]
          }
        ];

        const output = await runAgentLoop({
          provider: options.provider,
          model,
          maxSteps: entry.maxSteps ?? options.defaultMaxSteps,
          temperature: options.temperature,
          messages,
          tools: entry.tools
        });

        result = {
          functionId: entry.id,
          ok: true,
          skipped: false,
          durationMs: Date.now() - startedAt,
          output
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown function error.";
      result = {
        functionId: entry.id,
        ok: false,
        skipped: false,
        durationMs: Date.now() - startedAt,
        error: message
      };
    }

    await notifyObservers((observer) => observer.onFunctionResult?.({ runId, call, functionId: entry.id, result }));
    await notifyObservers((observer) => observer.onRunEnd?.({ runId, call, result }));
    return result;
  }

  function listRegisteredIds(): string[] {
    return [...registry.keys()];
  }

  return { register, observe, run, listRegisteredIds };
}
