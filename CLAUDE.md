# Lumo (Free Agent)

UnleashWP Lumo is the public free layer: a Claude Code plugin, local MCP/CLI, and
GitHub Action runner that catch stale AI-written WordPress code against a shipped
snapshot. Paid depth lives in the private `lumo-pro` repo and hosted MCP.

## Working here

- Customer-facing copy is English. Commits and PR text are English, concise, and
  human. No `Co-Authored-By` trailers from assistants.
- Do not commit secrets, hook logs, or scratch planning docs.
- Before a PR: `npm test`, `npm run typecheck`, `npm run build`, and
  `node scripts/check-vocabulary.mjs`.
- Product rules that outrank convenience are in `AGENTS.md`.

## Layout

- `src/detection/`, `src/mcp/`, `src/action/` — catch engine and surfaces
- `data/snapshot.json` — generated free knowledge (never hand-edit)
- `agents/`, `commands/`, `skills/` — what ships in the npm tarball
- `.claude/hooks/wp-enforce.cjs` — PreToolUse catch hook for Claude Code
- `docs/` — install and packaging docs for humans

## Spec

Canonical product spec: [unleash-wp/lumo-pro#1](https://github.com/unleash-wp/lumo-pro/issues/1).
