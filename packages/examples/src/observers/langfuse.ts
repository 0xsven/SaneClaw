import type { AgentRunner } from "@agent-functions/runner";

export async function observeWithLangfuse(runner: AgentRunner): Promise<void> {
  const langfusePublicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const langfuseSecretKey = process.env.LANGFUSE_SECRET_KEY;

  if (!langfusePublicKey || !langfuseSecretKey) {
    return;
  }

  const { Langfuse } = await import("langfuse");
  const langfuseClient = new Langfuse({
    publicKey: langfusePublicKey,
    secretKey: langfuseSecretKey,
    baseUrl: process.env.LANGFUSE_BASE_URL
  });

  const traces = new Map<string, unknown>();
  const spans = new Map<string, unknown>();

  runner.observe({
    onRunStart: ({ runId, call }) => {
      const trace = (langfuseClient as { trace?: (opts: unknown) => unknown }).trace?.({
        id: runId,
        name: call.id,
        input: call.input,
        metadata: {
          agentId: call.id,
          callMeta: call.meta ?? null
        }
      });
      traces.set(runId, trace);
    },
    onFunctionStart: ({ runId, functionId, call }) => {
      const trace = traces.get(runId) as { span?: (opts: unknown) => unknown } | undefined;
      const span = trace?.span?.({
        name: `function:${functionId}`,
        input: call.input,
        metadata: {
          functionId
        }
      });
      spans.set(`${runId}:${functionId}`, span);
    },
    onFunctionResult: ({ runId, functionId, result }) => {
      const spanKey = `${runId}:${functionId}`;
      const span = spans.get(spanKey) as { end?: (opts: unknown) => void } | undefined;
      span?.end?.({
        output: result,
        level: result.ok ? "DEFAULT" : "ERROR",
        statusMessage: result.error
      });
      spans.delete(spanKey);
    },
    onRunEnd: ({ runId, result }) => {
      const trace = traces.get(runId) as { update?: (opts: unknown) => void } | undefined;
      trace?.update?.({
        output: result
      });
      traces.delete(runId);
    }
  });

  process.on("beforeExit", () => {
    void (langfuseClient as { shutdownAsync?: () => Promise<void> }).shutdownAsync?.();
  });
}
