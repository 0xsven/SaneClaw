import { createRunner } from "@agent-functions/runner";
import { helloAgentFunction } from "./functions/hello.js";

export async function example(): Promise<void> {

  // Create a runner
  const runner = createRunner();

  // Register functions
  runner.register([helloAgentFunction]);

  // Trigger the function
  await runner.emit({
    event: "example.hello.requested",
    payload: { name: "builder" }
  });
}
