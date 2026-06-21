# Install Options

The core value of Lumo is local — the HPOS knowledge runs entirely inside Claude Code from the bundled skill and snapshot. The MCP path is a fallback for teams that need the Pro endpoint or want to pin a shared config; it is not on the critical path for the Free agent.

---

## (a) Self-hosted marketplace — primary

```
/plugin marketplace add unleash-wp/lumo
/plugin install lumo@lumo
```

This is the recommended path. It resolves directly against the public `unleash-wp/lumo` GitHub repo (no separate hosting). The two commands are all you need.

---

## (b) MCP add — for Lumo Pro or shared team config

Use this when you have a Lumo Pro license and want to connect the Pro knowledge endpoint, or when you need to pin the MCP config for a shared project.

**macOS / Linux (bash or zsh):**

```
claude mcp add --transport http lumo-pro https://mcp.unleashwp.de/mcp --scope project
```

**Windows — PowerShell:**

```
claude mcp add --transport http lumo-pro https://mcp.unleashwp.de/mcp --scope project
```

(No special quoting needed for these arguments in PowerShell. If a value you pass ever contains `&` or spaces, wrap that value in double quotes.)

**Windows — cmd.exe:**

```
claude mcp add --transport http lumo-pro "https://mcp.unleashwp.de/mcp" --scope project
```

(The URL has no special characters, so the bare and quoted forms are equivalent here. The quoted form is shown as the safe default. Quote any argument value containing `&`, `|`, `^`, or spaces.)

`--scope project` writes `.mcp.json` in the current project directory. The `lumo` repo already ships that file pointing at the same endpoint.

> **Windows quoting note:** The quoting difference between PowerShell and cmd.exe matters when values contain shell-special characters. For this URL it makes no practical difference — the byte-level verification on a real Windows box is the definitive check.

---

## (c) Manual — copy the skill directly

If the marketplace or MCP path is not available, copy the skill into your project manually.

1. Copy `skills/wp-knowledge/SKILL.md` from the `unleash-wp/lumo` repo into `skills/wp-knowledge/SKILL.md` in your project.
2. Add the MCP server entry to your project's `.mcp.json` (create it if it doesn't exist):

```json
{
  "mcpServers": {
    "lumo-pro": { "type": "http", "url": "https://mcp.unleashwp.de/mcp" }
  }
}
```

The skill loads automatically the next time Claude Code starts in that project.

---

## Choosing a path

| | Marketplace | MCP add | Manual |
|---|---|---|---|
| Free agent | Yes (primary) | Fallback | Fallback |
| Lumo Pro endpoint | No | Yes | Yes (`.mcp.json` only) |
| Shared team config | Via repo | Yes (`--scope project`) | Yes |
| No internet at install | No | No | Yes |
