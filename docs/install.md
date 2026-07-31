# Install Options

The core value of Lumo is local. The HPOS knowledge runs entirely inside Claude Code from the bundled skill and snapshot. The MCP path is a fallback for teams that need the Pro endpoint or want to pin a shared config; it is not on the critical path for the Free agent.

---

## (a) Self-hosted marketplace: primary

```
/plugin marketplace add unleash-wp/lumo
/plugin install lumo@unleashwp-lumo
```

This is the recommended path. It resolves directly against the public `unleash-wp/lumo` GitHub repo (no separate hosting). The two commands are all you need.

---

## (b) Local MCP: Free agent via stdio (Claude Code, Cursor)

The `lumo` repo ships a local MCP server (`lumo_audit` + `lumo_lookup`) that runs entirely on your machine, with no license and no network call.

### Build the bin once

```
git clone https://github.com/unleash-wp/lumo.git
cd lumo
npm install
npm run build
# produces dist/mcp.mjs
```

Or install globally from the repo root so `lumo-mcp` is on your PATH:

```
npm install -g .
```

### Claude Code

Add the server to your project's `.mcp.json` (created automatically by `claude mcp add`):

```
claude mcp add --transport stdio --scope project lumo-free -- node /absolute/path/to/lumo/dist/mcp.mjs
```

Or write `.mcp.json` by hand:

```json
{
  "mcpServers": {
    "lumo-free": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/lumo/dist/mcp.mjs"]
    }
  }
}
```

If you installed globally (`npm install -g .`), use `"command": "lumo-mcp"` and `"args": []`.

### Cursor

Open **Settings → MCP** and add a new server entry:

```json
{
  "mcpServers": {
    "lumo-free": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/lumo/dist/mcp.mjs"]
    }
  }
}
```

Cursor picks up the server on next restart. Both `lumo_audit` and `lumo_lookup` will appear in the tool list. The bundled `.cursor/rules/lumo.mdc` nudges the agent to reach for them on WordPress/WooCommerce code.

Cursor gets the full knowledge + audit experience with the evidence layer and the per-answer upgrade hint. The Claude Code plugin additionally ships the onboarding walk-through, the local risk scoreboard, and the dampened upgrade prompt; those are Claude-Code-specific and do not run in Cursor. Cursor converts through the upgrade hint carried in each answer.

---

## (c) MCP add: for Lumo Pro or shared team config

Use this when you have a Lumo Pro license and want to connect the Pro knowledge endpoint, or when you need to pin the MCP config for a shared project.

**macOS / Linux (bash or zsh):**

```
claude mcp add --transport http lumo-pro https://mcp.unleashwp.de/mcp --scope project
```

**Windows: PowerShell**

```
claude mcp add --transport http lumo-pro https://mcp.unleashwp.de/mcp --scope project
```

(No special quoting needed for these arguments in PowerShell. If a value you pass ever contains `&` or spaces, wrap that value in double quotes.)

**Windows: cmd.exe**

```
claude mcp add --transport http lumo-pro "https://mcp.unleashwp.de/mcp" --scope project
```

(The URL has no special characters, so the bare and quoted forms are equivalent here. The quoted form is shown as the safe default. Quote any argument value containing `&`, `|`, `^`, or spaces.)

`--scope project` writes `.mcp.json` in the current project directory. The `lumo` repo already ships that file pointing at the same endpoint.

> **Windows quoting note:** The quoting difference between PowerShell and cmd.exe matters when values contain shell-special characters. For this URL it makes no practical difference. The byte-level verification on a real Windows box is the definitive check.

---

## (d) Manual: copy the skill directly

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

## (e) Advisory binding: consult Lumo before writing WordPress code

The binding adds an instruction layer on top of the MCP tools: Claude checks
every WordPress/WooCommerce code suggestion through `lumo_check_code` before
presenting it, and leads every API question with `lumo_lookup`. It is the
`wp-binding` skill that makes this happen automatically.

**Plugin install (primary path):** the skill ships with the plugin and activates
when the plugin loads, with no extra step.

**Manual install (if you copy the skill directly):**

Copy `skills/wp-binding/SKILL.md` from this repo into the same path in your
project:

```
your-project/
  skills/
    wp-binding/
      SKILL.md
```

Claude Code picks it up on next start.

**CLAUDE.md rule (no-plugin fallback):** for projects that cannot use the plugin
or the skill directory, copy the ready-to-paste block from
`skills/wp-binding/claude-rule-snippet.md` into the project's `CLAUDE.md` or
`.claude/rules/lumo-wp-binding.md`.

**Cursor:** `.cursor/rules/lumo.mdc` (ships in this repo) covers the same
instruction for Cursor users.

In all cases the MCP server must be reachable. The binding is an instruction
layer, not a local offline check. Use path (b) or (c) above to add the server.

---

## Choosing a path

| | Marketplace | Local MCP (stdio) | Pro MCP (HTTP) | Manual |
|---|---|---|---|---|
| Free agent | Yes (primary) | Yes | Fallback | Fallback |
| Lumo Pro endpoint | No | No | Yes | Yes (`.mcp.json` only) |
| Advisory binding | Auto (plugin) | Manual (skill dir) | Manual (skill dir) | CLAUDE.md snippet |
| Shared team config | Via repo | Yes (`.mcp.json`) | Yes (`--scope project`) | Yes |
| No internet at install | No | Yes | No | Yes |
| No license required | Yes | Yes | No | Yes |
