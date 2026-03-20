import { createRunner } from "@agent-functions/runner";
import { complexLoopAgentFunction } from "./functions/complex-loop.js";
import { helloAgentFunction } from "./functions/hello.js";
import { llmLoopAgentFunction } from "./functions/llm-loop.js";
import { getConfiguredProvider, getModel, getModelInstructions, hasLlmApiKey } from "./lib/llm-config.js";
import { consoleObserver } from "./observers/console.js";
import { observeWithLangfuse } from "./observers/langfuse.js";

export async function example(): Promise<void> {
  if (!hasLlmApiKey()) {
    console.log(
      "Skipping examples. Set OPENROUTER_API_KEY (or OPENAI_API_KEY / ANTHROPIC_API_KEY) to run LLM agents."
    );
    return;
  }

  const provider = getConfiguredProvider();
  if (!provider) {
    console.log("Provider could not be configured.");
    return;
  }

  console.log(getModelInstructions());

  const runner = createRunner({
    provider,
    model: getModel()
  });
  runner.observe(consoleObserver);
  await observeWithLangfuse(runner);

  runner.register([helloAgentFunction, llmLoopAgentFunction, complexLoopAgentFunction]);

  // await runner.run({
  //   id: "hello-world",
  //   input: { name: "builder" }
  // });

  // await runner.run({
  //   id: "llm-loop-demo",
  //   input: {
  //     question: "What time is it now? Use the get_current_time tool before answering."
  //   }
  // });

  await runner.run({
    id: "complex-loop-demo",
    input: {
      objective:
        "Recommend the best implementation direction for scaling this project while keeping complexity low."
    }
  });
}
