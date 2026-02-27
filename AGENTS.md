# AGENTS.md

## Purpose

This is a monorepo for **agent-functions**: typed, code-first automation units with explicit triggers and declared tools.

## Repo conventions

- Runtime: Node.js
- Package manager: pnpm workspaces
- Language: TypeScript (ESM, `NodeNext`)

## Workspace layout

- `packages/core`: shared contracts/types for agent-functions
- `packages/examples`: tiny runnable examples that consume `core`
- `packages/runner`: runtime (`createRunner`) that registers and dispatches trigger events

## Useful commands

- `pnpm install --no-frozen-lockfile` (first install in fresh environments)
- `pnpm typecheck`
- `pnpm build`
- `pnpm dev`

## Implementation defaults

- Keep contracts in `core` and executable demos in `examples`.
- Prefer small, composable function signatures with explicit input/output types.
- Add dependencies per-package unless they are truly root-level tooling.

## Maintenance rule

- Keep this file updated as the repo evolves, but only add non-obvious, generic guidance that helps across tasks.
- Do not duplicate obvious facts from code/config, and do not put task-specific procedures here when they belong in skills.
