# Install Options

**Paid door (hosted):** one UnleashWP Lemon Squeezy license → hosted MCP in
Cursor/Claude for **Solo Hosted / Pro / Team 20**. See [packages.md](./packages.md).

**Free door (local):** Lumo as an **AI Forge plugin** + `@unleashwp/lumo` catch engine. Free never receives
hosted MCP bytes from `mcp.unleash-wp.com`. Starter / Agent Team are file zips only.

Brand: Lumo owl (`assets/lumo-owl-*.png`).

---

## (0a) Free — AI Forge plugin (primary path)

1. Install AI Forge: `npm install -g @unleashwp/ai-forge`
2. Run `uwp-ai-forge serve` → **Plugins** → paste `github:unleash-wp/lumo` → Install
3. Install the live catch engine: `npm install -g @unleashwp/lumo`
4. Connect `uwp mcp` to Claude Code / Cursor (see [AI Forge install docs](https://unleash-wp.github.io/ai-forge/))

Tools on `uwp mcp`: `lumo_lookup`, `lumo_check_code` (Free snapshot; not Pro depth).

Updates: AI Forge → Plugins → Check for updates.

---

## (0b) Hosted MCP — Solo Hosted / Pro / Team 20 (Cursor, Claude, Codex)

1. Buy Solo Hosted, Pro, or Team 20 (Lemon Squeezy). Starter / Agent Team keys do **not** unlock hosted MCP.
2. Open https://mcp.unleash-wp.com/connect — paste the MCP JSON and download `lumo.mdc`.
3. Add the server in Cursor **Settings → MCP**:

```json
{
  "mcpServers": {
    "lumo": {
      "url": "https://mcp.unleash-wp.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_LICENSE_KEY"
      }
    }
  }
}
```

4. Copy [`.cursor/rules/lumo.mdc`](../.cursor/rules/lumo.mdc) and
   [`lumo-wordpress.mdc`](../.cursor/rules/lumo-wordpress.mdc) into the
   WordPress project so the agent **must** call `lumo_check_code` /
   `lumo_audit` / `lumo_lookup` on PHP/JS work. MCP alone does not force tool
   use.

Send `X-Lumo-Instance` from clients that support seat accounting when available.

Claude Code HTTP form:

```
claude mcp add --transport http lumo https://mcp.unleash-wp.com/mcp --scope project
```

(Then set the Authorization header / env as documented for your Claude version.)

---

## (a) Claude Code marketplace plugin

```
/plugin marketplace add unleash-wp/lumo
/plugin install lumo@unleashwp-lumo
```

Resolves against the public `unleash-wp/lumo` GitHub repo.

---

## (b) Local MCP: offline Free snapshot via stdio (Claude Code, Cursor)

Power-user / air-gap. The `lumo` repo ships a local MCP server
(`lumo_audit` + `lumo_lookup` + `lumo_check_code`) on your machine with no
license and no network call.

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

### Cursor (local stdio fallback)

Prefer section **(0)** hosted MCP. For offline:

```json
{
  "mcpServers": {
    "lumo-free": {
      "type": "stdio",
      "command": "lumo-mcp",
      "args": []
    }
  }
}
```

Also install the project rules under `.cursor/rules/` so tool calls are
mandatory. Cursor does not get the Claude Code onboarding walk-through; the
upgrade path is the account portal + hints in answers.

---

## (c) Hosted MCP / shared team config (same as §0 with paid token)

Use when the account is Solo Hosted / Pro / Team 20 or you pin a shared `.mcp.json`.

**macOS / Linux (bash or zsh):**

```
claude mcp add --transport http lumo-pro https://mcp.unleash-wp.com/mcp --scope project
```

**Windows: PowerShell**

```
claude mcp add --transport http lumo-pro https://mcp.unleash-wp.com/mcp --scope project
```

(No special quoting needed for these arguments in PowerShell. If a value you pass ever contains `&` or spaces, wrap that value in double quotes.)

**Windows: cmd.exe**

```
claude mcp add --transport http lumo-pro "https://mcp.unleash-wp.com/mcp" --scope project
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
    "lumo-pro": { "type": "http", "url": "https://mcp.unleash-wp.com/mcp" }
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
