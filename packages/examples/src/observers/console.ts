import type { RunnerObserver } from "@agent-functions/runner";

export const consoleObserver: RunnerObserver = {
  onRunStart: ({ runId, call }) => {
    console.log(`[observe] start ${runId} agent=${call.id}`);
  },
  onFunctionResult: ({ functionId, result }) => {
    console.log(
      `[observe] result ${functionId} ok=${result.ok} skipped=${result.skipped} durationMs=${result.durationMs}`,
      result.output
    );
  }
};
