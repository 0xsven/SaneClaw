import { config } from "dotenv";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { example } from "./index.js";

const envPaths = [
  fileURLToPath(new URL("../.env", import.meta.url)),
  fileURLToPath(new URL("../../../.env", import.meta.url))
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    config({
      path: envPath,
      quiet: true
    });
  }
}

void example();
