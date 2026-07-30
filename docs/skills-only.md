# Skills only — install just the files

For people who want Lumo's skills in their assistant without the MCP server.
Four paths, all free:

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

**Claude on web and desktop (claude.ai):** claude.ai takes each skill as a ZIP
upload. Build the zips from a checkout:

```bash
npm run package:skills
```

This writes `dist-skills/wp-binding.zip`, `dist-skills/wp-knowledge.zip` and
`dist-skills/wp-pro.zip`, each with the skill folder at the zip root. In
claude.ai, open Settings > Capabilities > Skills and upload the zips you want.
If you downloaded prebuilt zips instead of building them, the upload step is
the same.

The zips carry the same three skills as the other paths, byte for byte —
nothing is trimmed or rewritten for claude.ai. Without the MCP server,
`wp-binding` degrades honestly exactly as the table below says: it announces
that the live catch is not connected and answers from the bundled knowledge.

## What works without the MCP

| Piece | Standalone? |
|---|---|
| `wp-pro` (senior persona + 1000 lines of stable references) | yes |
| `wp-knowledge` (honest HPOS answer: names the Pro coverage, refuses to improvise WooCommerce version facts from memory) | yes |
| `wp-binding` (routes code through the live catch) | degrades honestly — it says the live catch is not connected and answers from the bundled knowledge instead of pretending a check ran |
| `/wp-check`, `/wp-onboard`, the upgrade-auditor agent | need the MCP tools |

The live layer — the actual code catch — is the free local MCP server:

```bash
claude mcp add lumo -- npx -y -p @unleashwp/lumo lumo-mcp
```

The paid layer is a different server: Lumo Pro is hosted, licensed per seat,
and every request is validated against your licence key. Skills and the local
watcher are free; the daily-tended knowledge behind them is the product.
