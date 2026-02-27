# agent-functions

TypeScript monorepo for building **agent-functions**: programmatic functions with explicit triggers and allowed tools.

## What is an agent-function?

An agent-function is a typed unit of automation with:

- a clear `trigger` (when it should run),
- an explicit `tools` list (what it is allowed to use),
- a `run` handler (the actual logic).

This keeps behavior easy to reason about and version in code while preserving the decision-making and reasoning capabilities that LLMs provide, rather than driving everything through chat sessions.


## High-level architecture

This prototype has three layers:

1. **Contracts layer (`core`)**
   - Defines the stable types every function follows (`trigger`, `tools`, `run`).
   - Keeps execution model consistent across all packages.

2. **Function layer (`examples` now, more packages later)**
   - Implements concrete agent-functions using `core` contracts.
   - Registers function(s) into the runner and emits trigger events.

3. **Execution layer (`runner`)**
   - Exposes `createRunner()` to create an in-memory runtime.
   - Provides `register()` to add function(s) to the execution registry.
   - Provides `emit({ event, payload })` to run matching function(s) and return execution metadata.

Request flow:

```text
examples boot
        -> createRunner()
        -> register(exampleAgentFunctions)
        -> emit({ event, payload })
        -> matching function executes with typed input/context
        -> function performs side effects (for example logging)
```

Design intent:

- `core` stays small and stable.
- function packages evolve independently.
- `runner` remains transport/execution glue, not business logic.

## Quickstart

### 1) Requirements

- Node.js 20+
- pnpm 9+ (or use Corepack)

### 2) Install

```bash
corepack enable
pnpm install
```

### 3) Run checks

```bash
pnpm typecheck
pnpm build
```

### 4) Run the example

```bash
pnpm dev
```

Expected output:

```text
Hello builder, this is your first agent-function prototype.
```

## First extension ideas

1. Add test coverage once 2-3 functions exist.
2. Introduce stricter tool schemas and input/output validation.
3. Support multiple function registries and pluggable tool adapters.
