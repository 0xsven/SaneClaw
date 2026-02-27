import type { AgentFunction } from "@agent-functions/core";

export type TriggerEvent = {
  event: string;
  payload?: unknown;
  meta?: Record<string, unknown>;
};

export type RunnerResult = {
  functionId: string;
  ok: boolean;
  durationMs: number;
  error?: string;
};

export type AgentRunner = {
  register: (fn: AgentFunction<any> | AgentFunction<any>[]) => void;
  emit: (trigger: TriggerEvent) => Promise<RunnerResult[]>;
  listRegisteredEvents: () => string[];
};

export function createRunner(): AgentRunner {
  const registry: AgentFunction<any>[] = [];

  function register(fn: AgentFunction<any> | AgentFunction<any>[]): void {
    if (Array.isArray(fn)) {
      registry.push(...fn);
      return;
    }
    registry.push(fn);
  }

  async function emit(trigger: TriggerEvent): Promise<RunnerResult[]> {
    const matching = registry.filter((entry) => entry.trigger.event === trigger.event);

    if (matching.length === 0) {
      const available = registry.map((entry) => entry.trigger.event).join(", ");
      throw new Error(
        `No functions registered for "${trigger.event}". Available triggers: ${available || "(none)"}`
      );
    }

    const results: RunnerResult[] = [];
    for (const entry of matching) {
      const startedAt = Date.now();
      try {
        await entry.run(trigger.payload, { trigger: entry.trigger });
        results.push({
          functionId: entry.id,
          ok: true,
          durationMs: Date.now() - startedAt
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown function error.";
        results.push({
          functionId: entry.id,
          ok: false,
          durationMs: Date.now() - startedAt,
          error: message
        });
      }
    }
    return results;
  }

  function listRegisteredEvents(): string[] {
    return registry.map((entry) => entry.trigger.event);
  }

  return { register, emit, listRegisteredEvents };
}
