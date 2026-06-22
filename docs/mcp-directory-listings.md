# MCP Directory Listings

Three directories: PulseMCP, Glama, Smithery. Submission paths differ per directory.

Conventions used below:
- **[TEAM DONE]** — committed in this branch; no founder action needed.
- **[FOUNDER]** — requires founder account / action; cannot be automated.

---

## 1. Official MCP Registry (prerequisite for PulseMCP)

PulseMCP ingests from the official Anthropic/MCP Registry (registry.modelcontextprotocol.io), so the registry is the primary submission target. PulseMCP auto-indexes from there within ~24 h.

### What is required

- `mcpName` field in `package.json` — **[TEAM DONE]**: set to `"io.github.unleash-wp/lumo"`.
- `server.json` in the repo root — **[TEAM DONE]**: created at `server.json`, schema `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`.
- Package published to npm as `@unleashwp/lumo`.
- `mcp-publisher` CLI to authenticate and push the registry entry.

### Founder steps — MCP Registry

1. Verify `@unleashwp/lumo` is published to npm and the version matches `server.json` (`0.2.0`).
2. Install the publisher CLI: `brew install mcp-publisher`
3. In the repo root: `mcp-publisher init` — review the generated `server.json` and compare against the one committed here; the committed file should already be correct.
4. Authenticate: `mcp-publisher login github` (device flow, uses the `unleash-wp` GitHub org account).
5. Publish: `mcp-publisher publish` — this pushes the entry to `registry.modelcontextprotocol.io`.
6. Confirm at https://registry.modelcontextprotocol.io — search for `io.github.unleash-wp/lumo`.

Source: https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx

---

## 2. PulseMCP

**Indexing:** PulseMCP pulls from the official MCP Registry daily; it also has a direct submission form as a fallback (GitHub repo URL, one field).

**Artifacts needed:** none beyond what the MCP Registry entry covers (README, package.json keywords, server.json).

### Founder steps — PulseMCP

1. Complete the MCP Registry submission above — PulseMCP auto-indexes within ~24 h of the registry entry being live.
2. *(Fallback / faster)* Go to https://www.pulsemcp.com/submit → select "MCP Server" → paste `https://github.com/unleash-wp/lumo` → submit.
3. If a week passes with no listing, email hello@pulsemcp.com with the GitHub URL.

Source: https://www.pulsemcp.com/submit

---

## 3. Glama

**Indexing:** Glama indexes ~47k servers; community submissions via "Add Server" form (GitHub URL). No manifest file required.

**Artifacts needed:** accurate README and package.json keywords — **[TEAM DONE]**.

### Founder steps — Glama

1. Go to https://glama.ai/mcp/servers → click "Add Server".
2. Paste `https://github.com/unleash-wp/lumo` when the form asks for a repository or URL.
3. Complete any account/verification step the form requests.
4. After submission, search Glama for "lumo" or "unleashwp" to confirm indexing.

Source: https://glama.ai/mcp/servers (observed "Add Server" link; exact form fields require a logged-in session)

---

## 4. Smithery

**Indexing:** Smithery does NOT auto-crawl GitHub repos. For stdio servers (like Lumo) it requires either:
  - **(a) MCPB bundle** — a compiled `.mcpb` bundle uploaded via `smithery.ai/new`.
  - **(b) HTTP endpoint** — only applicable to remote/hosted servers; Lumo Free is stdio-only so this does not apply.

Smithery scans the running server for tool metadata after submission; no extra manifest file is needed.

**Artifacts needed:** none committed (no `smithery.yaml` schema exists for stdio servers per current docs).

### Founder steps — Smithery

1. Build the MCPB bundle locally (requires Smithery's `mcpb` toolchain — check https://smithery.ai/docs for the build command; as of June 2026 the toolchain is separate from npm).
2. Go to https://smithery.ai/new — create or log in to a Smithery account.
3. Select "Local / stdio" as the server type.
4. Upload the `.mcpb` bundle.
5. Smithery will scan the bundle for tool metadata (`lumo_audit`, `lumo_lookup`, `lumo_check_code`) and populate the listing.
6. Fill in display name ("UnleashWP Lumo"), description, and GitHub repo URL (`https://github.com/unleash-wp/lumo`) in the listing form.

Source: https://smithery.ai/docs/build/publish.md (API reference; UI flow at smithery.ai/new returned 429 during research — verify current UI live).

---

## Team-done checklist

- [x] `package.json` — added `mcpName`, expanded keywords (`mcp`, `mcp-server`, `woocommerce-deprecation`, `wordpress-audit`)
- [x] `server.json` — MCP Registry manifest (root of repo), schema-validated structure
- [x] `README.md` — added MCP tools line with freshness note, npm/global install block for non-Claude Code clients

---

## Unresolved questions

1. **npm publish status**: `@unleashwp/lumo` must be public on npm before `mcp-publisher publish` will work. Confirm the package is published or add this to the release checklist.
2. **Smithery MCPB toolchain**: the build command for `.mcpb` bundles is not documented in the public docs fetched; verify at https://smithery.ai/docs before attempting the Smithery submission.
3. **`unleash-wp` GitHub org ownership**: `mcp-publisher login github` ties the `mcpName` namespace `io.github.unleash-wp/*` to the authenticated GitHub account. The account used must be a member (or owner) of the `unleash-wp` org; confirm before running publish.
4. **Glama submission form fields**: the exact fields were behind a login wall during research. If the form asks for more than a GitHub URL (e.g. category, description), use: category = "Developer Tools", description = first sentence of README.
