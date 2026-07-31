# MCP Directory Listings: ready-to-paste submissions

Final submission texts for six directories. Copy the block, paste into the form.
Markers: **[after npm publish]** requires `@unleashwp/lumo` live on npm first.
**[FOUNDER]** needs the founder's account; cannot be automated.

## Canonical copy (single source: reuse everywhere)

- **Name:** UnleashWP Lumo: WordPress Code Quality
- **One-liner:** Catches stale AI-written WordPress code: Core deprecations, Gutenberg/block.json, and WooCommerce HPOS, with the wrong-vs-correct fix and a dated source.
- **Description:** Lumo is a local stdio MCP server for WordPress code review. It checks PHP and JavaScript against 42 curated, source-verified entries covering WordPress Core deprecations, Gutenberg block development (block.json, apiVersion, theme.json), and security fundamentals. Where it touches WooCommerce/HPOS, it says so instead of going quiet (that coverage is Lumo Pro), and it returns the wrong pattern, the correct replacement, the affected version range, and a dated source URL. Tools: `lumo_check_code` (review a snippet or diff), `lumo_audit` (audit a project), `lumo_lookup` (query the knowledge base).
- **Category:** Developer Tools (variant: Code Review / Code Quality where offered)
- **Tags:** `wordpress` `woocommerce` `hpos` `gutenberg` `block-json` `code-review` `code-quality` `deprecations` `php` `mcp-server`
- **Homepage / repo:** https://github.com/unleash-wp/lumo
- **Install (standard MCP config):**

```json
{
  "mcpServers": {
    "lumo": {
      "command": "npx",
      "args": ["-y", "-p", "@unleashwp/lumo", "lumo-mcp"]
    }
  }
}
```

*(The explicit `-p … lumo-mcp` form is required: the package exposes the bins `lumo-mcp` and `lumo-scan`, so a bare `npx @unleashwp/lumo` cannot resolve a default binary.)*

---

## 1. Official MCP Registry (registry.modelcontextprotocol.io): [after npm publish]

Server metadata comes from the committed `server.json` (name `io.github.unleash-wp/lumo`); there is no free-text form. What you submit IS `server.json`. The description field already carries the canonical copy.

**[FOUNDER] steps:**
1. Publish `@unleashwp/lumo@0.3.0` to npm (registry validates the `mcpName` field in the published package.json).
2. `brew install mcp-publisher`
3. Repo root: `mcp-publisher login github` (account must be a member of the `unleash-wp` org; the namespace `io.github.unleash-wp/*` binds to it).
4. `mcp-publisher publish`
5. Verify: search `io.github.unleash-wp/lumo` at https://registry.modelcontextprotocol.io

---

## 2. PulseMCP: https://www.pulsemcp.com/submit

Auto-indexes from the official registry within ~24 h. Completing #1 covers PulseMCP. Fallback: the direct form (one field).

**Paste block (fallback form):**
> **URL:** https://github.com/unleash-wp/lumo
> **Type:** MCP Server

Name, description, and tags are read from the repo README and package.json, already aligned with the canonical copy. **[FOUNDER]** If not listed after a week: hello@pulsemcp.com with the repo URL.

---

## 3. Glama: https://glama.ai/mcp/servers → "Add Server"

Indexes from the GitHub repo; submission works before npm publish.

**Paste block:**
> **Repository:** https://github.com/unleash-wp/lumo
> **Name:** UnleashWP Lumo: WordPress Code Quality
> **Description:** Catches stale AI-written WordPress code: Core deprecations, Gutenberg/block.json, and WooCommerce HPOS, with the wrong-vs-correct fix and a dated source. Local stdio server; tools: lumo_check_code, lumo_audit, lumo_lookup.
> **Category:** Developer Tools

**[FOUNDER]** Log in, submit, then search "lumo" / "unleashwp" to confirm indexing.

---

## 4. Smithery: https://smithery.ai/new [FOUNDER]

No GitHub auto-crawl for stdio servers: requires an MCPB bundle upload (Smithery's `mcpb` toolchain. Verify the current build command at https://smithery.ai/docs; it is separate from npm). Smithery scans the running server and auto-populates the tool list (`lumo_audit`, `lumo_lookup`, `lumo_check_code`).

**Paste block (listing form):**
> **Display name:** UnleashWP Lumo: WordPress Code Quality
> **Description:** Local WordPress code-review server: checks PHP/JS against 42 source-verified entries for Core deprecations, Gutenberg/block.json changes, and security fundamentals. WooCommerce/HPOS coverage is Lumo Pro, and the free tier names that gap instead of going quiet. Returns wrong vs. correct pattern, affected version range, and a dated source URL.
> **Repository:** https://github.com/unleash-wp/lumo
> **Server type:** Local / stdio

---

## 5. Cursor Directory: https://cursor.directory (MCP section) [after npm publish]

The install command runs through npx, so the listing is only functional once the package is live.

**Paste block:**
> **Name:** UnleashWP Lumo: WordPress Code Quality
> **One-liner:** Catches stale AI-written WordPress code: Core deprecations, Gutenberg/block.json, and WooCommerce HPOS, with the wrong-vs-correct fix and a dated source.
> **Description:** Local stdio MCP server for WordPress code review: 42 curated, source-verified entries covering WordPress Core deprecations, Gutenberg block development (block.json, apiVersion, theme.json), and security fundamentals. WooCommerce/HPOS is Lumo Pro and the gap is named, never silent. The bundled `.cursor/rules/lumo.mdc` makes Cursor consult it before writing WordPress code.
> **Repository:** https://github.com/unleash-wp/lumo
> **Install (`.cursor/mcp.json`):**
> ```json
> { "mcpServers": { "lumo": { "command": "npx", "args": ["-y", "-p", "@unleashwp/lumo", "lumo-mcp"] } } }
> ```

**[FOUNDER]** Submission flow is on the site (community-run); verify the current form live.

---

## 6. VS Code MCP list: https://code.visualstudio.com/mcp [after npm publish]

VS Code's curated list sources from the official MCP Registry. #1 is the prerequisite. The page links its submission/contribution path; verify live at submission time.

**Paste block (if a form/PR asks for fields):**
> **Name:** UnleashWP Lumo: WordPress Code Quality
> **Description:** WordPress code review for AI-assisted development: flags Core deprecations, Gutenberg/block.json changes, and WooCommerce HPOS breakage in PHP/JS, with the correct replacement, affected version range, and dated source.
> **Repository:** https://github.com/unleash-wp/lumo
> **Install (`.vscode/mcp.json`):**
> ```json
> { "servers": { "lumo": { "type": "stdio", "command": "npx", "args": ["-y", "-p", "@unleashwp/lumo", "lumo-mcp"] } } }
> ```

---

## Open items before submitting anywhere

1. **npm publish:** `@unleashwp/lumo@0.3.0` must be public on npm for #1, #5, #6 and for every `npx` install command above.
2. **npx ergonomics:** resolved. package.json ships the `lumo` bin (release.yml verifies `lumo --version` from the packed tarball), so `npx -y -p @unleashwp/lumo lumo-mcp` and the `lumo` CLI both work.
3. **`unleash-wp` org membership:** the registry namespace binds to the GitHub account used in `mcp-publisher login github`.
4. **Smithery MCPB toolchain:** build command undocumented at research time; verify at smithery.ai/docs.
