# Skills / Agent files: install paths

Commercial pack: **[Agent Pack 99 €/yr](./agent-pack.md)** — agents + skills + commands.

| Path | Price | Notes |
| --- | --- | --- |
| **OSS / try** (Free skills in `lumo` repo) | Free | Install from GitHub / marketplace (below) — not the full Agent Pack roster |
| **Agent Pack** | **99 €/yr** | Full kit from `lumo-agent-kit` — see [agent-pack.md](./agent-pack.md) |

Agent Pack does **not** unlock hosted Pro MCP. Freelancer / Pro / Agency include the pack.

**Claude Code (plugin: skills in Free lumo repo):**

```text
/plugin marketplace add unleash-wp/lumo
/plugin install lumo@unleashwp-lumo
```

**Any repo layout tool (Cursor, Copilot, Codex):**

```bash
npx skills add unleash-wp/lumo
```

**Agent Pack (paid):** download zip from portal after purchase, then follow
`INSTALL-CROSS-TOOL.md` in the zip (Claude / Cursor / Codex).

**Claude on web:** build skill zips from Free repo with `npm run package:skills`,
or use Agent Pack `web-skills/` after purchase.
