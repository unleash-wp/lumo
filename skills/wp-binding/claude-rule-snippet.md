# Lumo WordPress binding — CLAUDE.md rule snippet

Drop this block into any project's `CLAUDE.md` (or `.claude/rules/lumo-wp-binding.md`)
to get the same advisory binding without installing the full skill.

---

## Snippet (copy-paste ready)

```markdown
## WordPress / WooCommerce — consult Lumo before writing code

WordPress ships monthly. Training data does not. Before writing or editing any
WordPress or WooCommerce PHP/JS, use the Lumo MCP tools to check the current
standard:

**Before suggesting code:** call `lumo_check_code` with the code blob.
- LOUD catch (starts `> ⚠️`): do not present the original; present Lumo's
  correct form, cite the source and version fact verbatim.
- SOFT catch (starts `> 🔍`): surface the risk alongside the code, cite source.
- No issues: proceed; note "Lumo: no known issues" at the end of your answer.

**Before answering a WordPress API question:** call `lumo_lookup` first.
- If it returns a result, lead with it and cite the `_Knowledge current as of_`
  date.
- If it returns "No curated entry found", answer from training but flag it:
  "Lumo has no curated entry for this — verify against current WordPress docs."

**First touch on an unfamiliar WooCommerce project:** call `lumo_audit` once per
session before writing any code.

**Always:** propose and cite, never auto-apply. Present Lumo's wrong/correct
contrast and source verbatim. Let the developer decide and apply.
If a Lumo call fails, say so — do not silently fall back to training data.
```

---

## Prerequisite

Lumo's MCP tools (`lumo_check_code`, `lumo_lookup`, `lumo_audit`) must be
reachable. Add the server to the project's `.mcp.json`:

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

Or use the Pro endpoint if you have a license:

```json
{
  "mcpServers": {
    "lumo-pro": { "type": "http", "url": "https://mcp.unleashwp.de/mcp" }
  }
}
```

Without a reachable MCP server the rule is a no-op — the model has nothing to
call.
