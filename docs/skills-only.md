# Skills only — install just the files

For people who want Lumo's skills in their assistant without the MCP server.
Three paths, all free:

**Claude Code (plugin — skills, commands and the agent in one step):**

```text
/plugin marketplace add unleash-wp/lumo
/plugin install lumo@unleashwp-lumo
```

**Any repo layout tool (Cursor, Copilot, Codex — via the skills installer):**

```bash
npx skills add unleash-wp/lumo
```

**Manual (no tooling):** copy `skills/<name>/` into `~/.claude/skills/`.

## What works without the MCP

| Piece | Standalone? |
|---|---|
| `wp-pro` (senior persona + 1000 lines of stable references) | yes |
| `wp-knowledge` (inline HPOS contrast answer) | yes |
| `wp-binding` (routes code through the live catch) | degrades honestly — it says the live catch is not connected and answers from the bundled knowledge instead of pretending a check ran |
| `/wp-check`, `/wp-onboard`, the upgrade-auditor agent | need the MCP tools |

The live layer — the actual code catch — is the free local MCP server:

```bash
claude mcp add lumo -- npx -y -p @unleashwp/lumo lumo-mcp
```

The paid layer is a different server: Lumo Pro is hosted, licensed per seat,
and every request is validated against your licence key. Skills and the local
watcher are free; the daily-tended knowledge behind them is the product.
