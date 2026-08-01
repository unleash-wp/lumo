# Website pricing table — final (locked)

English. Canonical for www /connect / checkout. Locked 2026-08-01.
Feature rows are **measured from code**, not marketing guesswork.

**USP (lead sales signal):** Knowledge curated from WordPress Core changes (Make/Core, Trac, handbooks, contributor pipeline), with wrong→correct, source, and version. Not AI training cutoffs. Free = local snapshot. Pro = live curated knowledge that tracks Core. Quiet ≠ clean.

**Psychology:** three hero cards for solos; **middle = Best Value**. Agent Team 99 stays visible but secondary. Team 20 = separate Teams block.

**Founder lock:** **AI Forge Hosted** is included on **Solo Hosted, Pro, and Team 20** (all hosted paid tiers), not Agency-only.

**Forge Hosted (customer line):** Included entitlement. Hosted Forge install not yet available. Self-host Forge remains available to everyone. Do not sell Hosted Forge as live-installable until `ai-forge` unblocks.

**WordPress 7.1 Post Editor iframe (USP in action):** Core landed the always-iframe Post Editor. Lumo curated that change into Catch/reference (wrong→correct + source + version). Blocks that touch `document`/`window` or inject admin-scoped CSS break. Free Catch slice + Pro depth watch it. Coverage expanding; not a full “Ready for WP 7.1” claim.

**WordPress 7.1 readiness:** **Coverage expanding, not complete.** Catalogue has WordPress **7.0** catch/reference entries plus a **growing 7.1 wave** (Free high-signal Catch slice + Pro depth). A full WordPress **7.1** pack and founder briefing remain **open**. Do **not** claim “Ready for WP 7.1.” See §9 and `docs/knowledge-import-agent-skills.md`.

**Money-back:** 14 days on paid SKUs once Lemon Squeezy checkout is live.

**Everyone buys (definition):** Each buying persona has one primary SKU they would pay for, with a clear trigger. CEO is the founder, not a buyer. See §11.

---

## 1. Name glossary (canonical — paste on www + connect)

| Website name | LS / internal name | Price |
| --- | --- | --- |
| **Free** | Lumo Free | 0 € |
| **Starter** | Lumo Agent Core | 39 €/yr |
| **Agent Team** | Lumo Agent Pack | 99 €/yr |
| **Solo Hosted** ★ | Lumo Freelancer | 149 €/yr |
| **Pro** | Lumo Pro | 199 €/seat/yr |
| **Team 20** | Lumo Agency | 599 €/yr |

Invoice may show the LS name. Marketing and `/connect` use the website name.

---

## 2. Page layout (above the fold)

**Hero one-liner (paste above cards):** Knowledge curated from WordPress Core changes (Make/Core, Trac, handbooks, contributor pipeline), with wrong→correct, source, and version. Not AI training cutoffs.

### Block A — Solo (hero, 3 cards)

| Starter 39 | **Solo Hosted 149 ★ Best Value** | Pro 199/seat |
| --- | --- | --- |
| 2 WP specialist agents · files | Live MCP (ACF, Woo, GF, …) + full kit + Forge Hosted entitlement (install not yet available) | Same + **CI gate** (non-negotiable if WordPress PRs merge without a human re-check) |

Under the three cards (one line):

> **Files only?** [Agent Team - 99 €/yr](#agent-team) · full 6-agent roster on disk, **no hosted MCP** (402 on this server). Buying Agent Team when you need live ACF/Woo/GF in Cursor is a dead end: you still need **Solo Hosted 149** (Pack already included — do not buy twice).

### Block B — Free strip

> **Free - 0 €.** Local watcher. `npx @unleashwp/lumo demo`. No hosted MCP. Quiet ≠ clean.
> Until npm catches this release: go-live candidate = `npx -y github:unleash-wp/lumo#release/v1.0.0-go-live` (demo / check / scan).
> **After the Aha:** stay Free only while the local snapshot is enough. Need live plugin catalogue → **Solo Hosted 149**. Need six agents on disk, no live MCP → **Agent Team 99**. Staying Free forever means frozen coverage while Core and plugins move.

### Block C — Teams

> **Team 20 - 599 €/yr · default agency close.** Up to 20 hosted seats · Agent Team included · Vol.1 lookups · CI · Forge Hosted entitlement (install not yet available).
> **Seat helper:** Pro for 1–3 seats with CI; Team 20 from about 4 seats or one shop license (3×199 ≈ 599). Past ~3 Pro seats, Team 20 wins on math.

---

## 3. What Lumo actually watches (coverage domains)

Plain English for a WordPress developer. Numbers from lumo-pro `docs/capability-inventory.md` (2026-08-01): published catalogue **~192**, Free snapshot **~48**, catch-capable **~95+**.

### 3.1 WordPress Core (everyday PHP / admin surface)

What the watcher and agents look for when you write plugin or theme PHP:

| Topic | What it means in practice | Where it lives |
| --- | --- | --- |
| Output escaping | Wrong escape for context (`esc_attr` on URLs, `esc_html` on rich HTML); unescaped echo of variables / superglobals | Free snapshot + Code Reviewer + Security Auditor + Pro depth |
| Capabilities vs roles | `current_user_can('administrator')`, `in_array` on `$user->roles`, `is_admin()` used as auth | Core breadth + Code Reviewer |
| Options / transients | Large `add_option` without `autoload=false`; missing `false === get_transient()` fallback | Core breadth |
| HTTP API | Raw `curl_*` instead of `wp_remote_*`; missing `is_wp_error()` | Core breadth |
| WP-Cron | Time-critical work on WP-Cron; schedule without deactivation unschedule | Core breadth |
| Deprecations | Named Core symbol deprecations with version stamps (e.g. `get_page_by_title`, loading attributes, `addslashes_gpc`, script attribute helpers) | Pro deprecation timeline + Pro depth |
| Plugin standards | Global symbol without prefix, missing `ABSPATH` guard, i18n without text domain, unscoped enqueues, `register_setting` without sanitize, unsafe redirects | Plugin standards + Code Reviewer / Release Engineer |
| Secrets / env | Hardcoded API keys, committed `.env`, secrets in debug output | Security Auditor + env hygiene (hosted depth) |

**Not covered as Catch:** arbitrary PHPUnit style, business logic correctness, full AppSec / pentest.

### 3.2 REST API

| Topic | What it means in practice | Where it lives |
| --- | --- | --- |
| Missing `permission_callback` | `register_rest_route` without auth gate (unauthenticated since WP 5.5) | Free + Code Reviewer (catch) |
| Sanitize without validate | Custom `sanitize_callback` without `validate_callback` / schema pair | Free + Code Reviewer |
| Schema / args | Argument shapes, enums, patterns (guidance + agent review; deeper route design is hosted lookup) | Code Reviewer patterns; hosted REST depth grows with curation |
| Auth modes | Cookie + nonce vs application passwords (agent guidance; not a full OAuth product) | Agent Team Code Reviewer / Security |

**Gap (import wave):** richer REST controller patterns from `WordPress/agent-skills` → `wp-rest-api` (response shaping, `register_rest_field`, CPT `show_in_rest` pitfalls) belong in **Pro catalogue**, not Free teaser.

### 3.3 Block Themes / FSE

| Topic | What it means in practice | Where it lives |
| --- | --- | --- |
| `theme.json` version 3 | Still on `"version": 2` misses WP 6.6+ preset controls | Currency Guard + block-theme currency |
| Default preset opt-out | Custom font/spacing sizes without `defaultFontSizes` / `defaultSpacingSizes: false` → WP defaults merge in | Currency Guard |
| `styles.elements` vs `styles.blocks` | Site-wide button/link styles in the wrong bucket | FSE content |
| Templates / parts | Classic `get_header()` / `get_footer()` no-ops in block themes; wrong `parts/` vs `block-template-parts` | FSE content |
| Patterns | Auto-registration from `patterns/`; synced patterns vs `register_block_type` confusion | FSE + Currency Guard adjacent |
| Style variations / block hooks | `styles/*.json`, block.json auto-insertion (WP 6.5+) | FSE content |
| Site Editor debugging | Hierarchy / overrides (agent guidance; deeper Playground workflows are not Lumo Catch) | Agents + future import |

### 3.4 Blocks / Interactivity / Gutenberg currency

| Topic | What it means in practice | Where it lives |
| --- | --- | --- |
| `block.json` `apiVersion: 3` | AI default `apiVersion: 2` (deprecated WP 6.9; WP 7.0 conditional iframe; **WP 7.1 always iframed**) | Currency Guard + WP 7.0 / 7.1 |
| `render` field | Prefer `"render": "file:./render.php"` over PHP `render_callback` when metadata-driven | Currency Guard |
| `viewScriptModule` vs `viewScript` | Interactivity blocks need ES modules; classic `viewScript` breaks `import` | Currency Guard |
| `__experimental*` supports | Prefixed supports promoted to stable keys (WP 6.5) | Currency Guard |
| Block Bindings | Stable registration; drop experimental guards on WP 6.5+ | Currency Guard |
| Interactivity store | Directives / store patterns; WP 7.0 `watch()` vs `@preact/signals` `effect` | Currency Guard + WP 7.0 |
| Router navigation state | `state.navigation.hasStarted` / `hasFinished` deprecated WP 7.0 (**removal planned WP 7.1**) | WP 7.0 entry (warns ahead; **not** a full 7.1-ready pack) |

### 3.5 Abilities API (WordPress 6.9+ / 7.0+)

| Topic | What it means in practice | Status |
| --- | --- | --- |
| MCP visibility | Ability works in REST/admin but MCP clients see nothing without `meta.mcp.public` | **In catalogue** (`wp-ability-missing-mcp-public`) |
| Mutating + `permission` true | Over-open permission on write abilities | **In catalogue** |
| Missing input schema properties | Incomplete `input_schema` | **In catalogue** |
| Missing permission callback | Ability without permission gate | **In catalogue** |
| Resource missing URI | Resource ability shape incomplete | **In catalogue** |
| Domain vs projection (REST / MCP / Command Palette) | Registration shape ≠ exposure shape | **In catalogue** (reference: `wp-abilities-domain-vs-projection`) |
| Audit / verify rollouts | Produce audit docs; adversarial readonly-but-writes checks | **Gap** (`wp-abilities-audit`, `wp-abilities-verify` skills → Pro reference / tooling, not Free) |

### 3.6 WordPress 7.0 (in catalogue) vs 7.1 (coverage expanding)

> **From WordPress 7.1 the Post Editor canvas runs inside an iframe.** Blocks that touch `document`/`window` or inject admin-scoped CSS break. Lumo watches for those patterns. This is a shipped Catch/reference fact, not a “Ready for WP 7.1” claim.

**WordPress 7.0 — present today (examples):**

| Slug / topic | Lane |
| --- | --- |
| `wp-7-0-block-api-version-3-iframe` | Catch / currency |
| `wp-7-0-interactivity-watch` | Catch |
| `wp-7-0-router-navigation-deprecated` | Catch (points at 7.1 removal) |
| `wp-7-0-php-minimum-7-4` | Catch |
| `wp-7-0-html5-script-theme-support-removed` | Catch |
| `wp-7-0-wp-register-script-module-dependencies` | Catch / depth |
| Related deprecations in Pro depth (`addslashes_gpc`, script attributes, …) | Catch / lookup |

**WordPress 7.1 — coverage expanding; do not claim full “Ready for WP 7.1.”**

| Topic | Catalogue today |
| --- | --- |
| Classic block stays in inserter (June hide plan **reverted** 7 July 2026) | **Catch (Free):** `wp-7-1-classic-block-inserter-reversal` |
| `wp_prepare_json_schema_for_client` — do not mutate stored ability schemas | **Catch (Free):** `wp-7-1-prepare-json-schema-for-client` |
| Ability validation filters vs REST schema callbacks | **Catch (Free):** `wp-7-1-ability-rest-schema-callbacks-ignored` |
| `background.gradient` vs `color.gradient` | **Catch (Free):** `wp-7-1-background-gradient-support` |
| Form-control `__next40pxDefaultSize` ignored | **Catch (Free):** `wp-7-1-next40px-default-size-ignored` |
| **Post Editor always iframed** (global `document`/`window` vs `ownerDocument`) | **Catch (Free):** `wp-7-1-post-editor-iframe-owner-document` |
| Always-iframe migration map (GB 23.6 / WP 7.1) | **Reference (Pro):** `wp-7-1-post-editor-always-iframe` |
| Canvas CSS via `editorStyle` (not `enqueue_block_editor_assets`) | **Catch (Pro):** `wp-7-1-iframe-editor-style-enqueue` |
| Admin-scoped editor CSS (`.wp-admin` / `body.block-editor-page`) | **Catch (Pro):** `wp-7-1-iframe-admin-scoped-editor-css` |
| Abilities lifecycle / typed REST / get-user-info | **Reference (Pro):** `wp-7-1-abilities-api-improvements` |
| Icon API (`collection/name`) | **Catch (Pro):** `wp-7-1-icon-api` |
| Navigation → Navigator | **Catch (Pro):** `wp-7-1-editor-navigation-removed` |
| theme.json `textShadow` | **Reference (Pro):** `wp-7-1-theme-json-text-shadow` |
| Client-side media processing | **Reference (Pro):** `wp-7-1-client-side-media-processing` |
| React 19 punted beyond 7.1 | **Reference (Pro):** `wp-7-1-react-19-punted` |
| `dimensions.minWidth` | **Reference (Pro):** `wp-7-1-dimensions-min-width` |
| Knowledge CPT / DataViews / Design System / jQuery UI 1.14.2 / founder briefing | **Still open** |

Website / sales line: **“From WP 7.1 the Post Editor is always iframed; Lumo watches document/window and admin-scoped CSS breaks. Covers WordPress 7.0 breakages we have sourced, plus a growing WordPress 7.1 wave (Free Catch slice + Pro depth). Full 7.1 pack is still open, not Ready.”**

### 3.7 Plugins (hosted MCP depth)

Live `lumo_plugin_advice` / catch depth for premium and ecosystem plugins is **Solo Hosted / Pro / Team 20 only**. File-only Agent Team ships **bundled patterns** for Woo + Plugin specialists (accurate at kit release, not live-updated).

| Ecosystem | Example topics |
| --- | --- |
| WooCommerce HPOS | Order meta via CRUD, `wc_get_orders`, status hooks, compat declaration |
| WooCommerce Subscriptions | Subscription meta under HPOS, invented function names, `update_dates` |
| ACF | Unescaped `get_field()`, field keys vs names, `acf/init` registration |
| Gravity Forms | Scoped submission hooks, validation arity, entry decimal keys |
| Elementor | Controls / widgets / dynamic tags registration renames |
| Meta Box | `object_type`, unescaped `rwmb_the_value`, clone storage, filter timing |
| Carbon Fields | Complex field shapes, registration hook, escaping |
| Contact Form 7 | Deprecated shortcode API, `$abort` by reference, typed validation filters |

### 3.8 UnleashWP Learn Vol.1 (hosted lookups)

**69** `book-*` entries via `lumo_lookup` on Solo Hosted / Pro / Team 20. Engineering reference (testing, CI/CD, ops, project structure, …). **Not** Catch. **Not** the print/PDF.

---

## 4. Feature comparison matrix (code-backed)

Legend: ● included · ○ not included · ~ local / Free snapshot only

### A. Watcher & CLI (built in `@unleashwp/lumo`)

| Feature | Free | Starter | Agent Team | **Solo Hosted ★** | Pro | Team 20 |
| --- | --- | --- | --- | --- | --- | --- |
| `lumo demo` (4 samples, real catch) | ● | ● | ● | ● | ● | ● |
| `lumo check` (whole-file) | ● | ● | ● | ● | ● | ● |
| `lumo scan` (git diff) | ● | ● | ● | ● | ● | ● |
| Local MCP (`lumo-mcp`) | ● | ● | ● | ● | ● | ● |
| Free snapshot (~**48** catch entries) | ● | ● | ● | ● | ● | ● |
| Local tools: `lumo_check_code`, `lumo_lookup`, `lumo_audit` | ● | ● | ● | ● | ● | ● |
| Honest caps (`computed` / `complete` / line limits) | ● | ● | ● | ● | ● | ● |
| Quiet ≠ clean (never false all-clear) | ● | ● | ● | ● | ● | ● |

### B. Agent kit files (`lumo-agent-kit`)

| Feature | Free | Starter | Agent Team | **Solo Hosted ★** | Pro | Team 20 |
| --- | --- | --- | --- | --- | --- | --- |
| Currency Guard + Code Reviewer (topic lists in §5) | ○ | ● | ● | ● | ● | ● |
| Full roster (**6** agents; §5) | ○ | ○ | ● | ● | ● | ● |
| Scaffold skills (**2** Core / **9** Pack) | ○ | ● (2) | ● (9) | ● (9) | ● (9) | ● (9) |
| Review command (`/wp-review` Core; **5** Pack) | ○ | ● (1) | ● (5) | ● (5) | ● (5) | ● (5) |
| Claude / Cursor / Codex install | ○ | ● | ● | ● | ● | ● |
| Yearly kit updates (LS download) | ○ | ● | ● | ● | ● | ● |
| Full Agent Team included (no second buy) | ○ | ○ | buy | ● | ● | ● |

Pack Plugin / Woo agents ship **bundled patterns** on disk. Live ACF / Woo / GF / Elementor catalogue = hosted MCP only (section C).

### C. Hosted Pro MCP (`mcp.unleash-wp.com` — paying seats only)

| Feature | Free | Starter | Agent Team | **Solo Hosted ★** | Pro | Team 20 |
| --- | --- | --- | --- | --- | --- | --- |
| Hosted MCP access | ○ | ○ | ○ | ● | ● | ● |
| Pro catalogue (~**192** entries) | ○ | ○ | ○ | ● | ● | ● |
| Live catch depth (~**95** catch-capable) | ○ | ○ | ○ | ● | ● | ● |
| Plugin advice (`lumo_plugin_advice`: ACF, Woo, GF, Elementor, Meta Box, Carbon Fields, CF7, …) | ○ | ○ | ○ | ● | ● | ● |
| `lumo_check_code` (hosted) | ○ | ○ | ○ | ● | ● | ● |
| `lumo_lookup` (full DB) | ○ | ○ | ○ | ● | ● | ● |
| `lumo_check_deprecation` | ○ | ○ | ○ | ● | ● | ● |
| `lumo_compat_check` | ○ | ○ | ○ | ● | ● | ● |
| `lumo_migration_pattern` | ○ | ○ | ○ | ● | ● | ● |
| `lumo_core_update_briefing` | ○ | ○ | ○ | ● | ● | ● |
| `lumo_propose_config` | ○ | ○ | ○ | ● | ● | ● |
| **Vol.1 living lookups** (**69** `book-*`, `lumo_lookup` only) | ○ | ○ | ○ | ● | ● | ● |
| Coverage domains in §3 at Pro depth (Core, REST, FSE, Abilities, WP 7.0, plugins) | ○ | ○ | ○ | ● | ● | ● |
| WordPress **7.1** curated pack | ○ | ○ | ○ | ○ **gap** | ○ **gap** | ○ **gap** |
| `GET /connect` + Cursor `lumo.mdc` | ~ | ~ | ~ | ● | ● | ● |
| Paid quotas (120/min · 8000/day default) | ○ | ○ | ○ | ● | ● | ● |
| Hosted seats | — | 1 download | 1 download | **1** | **1 / seat** | **20** |

### D. AI Forge (tool shelf)

| Feature | Free | Starter | Agent Team | **Solo Hosted ★** | Pro | Team 20 |
| --- | --- | --- | --- | --- | --- | --- |
| AI Forge **self-host** | ● | ● | ● | ● | ● | ● |
| AI Forge **Hosted** (entitlement; install not yet available) | ○ | ○ | ○ | **●** | **●** | **●** |

Local Forge UI may offer German (DE). Lumo product language stays English.

### E. CI, plugin, enforcement

| Feature | Free | Starter | Agent Team | **Solo Hosted ★** | Pro | Team 20 |
| --- | --- | --- | --- | --- | --- | --- |
| Cursor rule / Claude `wp-enforce` hook (docs) | ● | ● | ● | ● | ● | ● |
| GitHub Action **CI gate** (LOUD can fail PR) | ○ | ○ | ○ | ○ | ● | ● |
| WordPress plugin abilities (`lumo-wp`, needs licence) | ○ | ○ | ○ | ● | ● | ● |
| Self-hosted Pro catalogue | ○ | ○ | ○ | ○ | ○ | ○ |
| Money-back 14 days | — | ● | ● | ● | ● | ● |

### Footnotes (must appear under the table)

1. Free / Starter / Agent Team never call `mcp.unleash-wp.com` (production **402**).
2. Vol.1 = **69 IDE lookups** from UnleashWP Learn Vol.1 — **not** the 345-page PDF, **not** Catch.
3. Quiet ≠ clean. Engineering watcher with sources — **not** AppSec / pentest.
4. Unlicensed CI runs stay green and say the gate **did not run** (never a silent pass).
5. Do **not** claim “Ready for WP 7.1” until §3.6 gap is closed with sourced entries.
6. Lumo is **not** the `WordPress/agent-skills` project. That repository is a separate public skill set; Lumo may curate overlapping topics into its own evidence-backed catalogue.
7. **Forge Hosted** on Solo Hosted / Pro / Team 20 = included entitlement. Hosted Forge install not yet available.

---

## 5. Agent coverage topics (not slash-command marketing)

Lead with **jobs and topics**. Commands and skills are how you invoke them.

### Starter (39 €) — two agents on disk

#### Currency Guard (`currency-guard`)

Catches stale or version-wrong AI output for blocks, themes, and Interactivity:

- `block.json` `apiVersion` (must be 3 for modern WP; WP 7.0 conditional iframe; **WP 7.1 Post Editor always iframed**)
- **WP 7.1 iframe breakage:** global `document`/`window` against the canvas; admin-scoped editor CSS; canvas styles via `enqueue_block_editor_assets` instead of `editorStyle`
- `viewScriptModule` vs classic `viewScript` for Interactivity
- Removal of `__experimental*` block supports prefixes
- Block Bindings stable registration (no experimental guard needed on WP 6.5+)
- Interactivity: `watch()` vs importing `effect` from `@preact/signals` (WP 7.0)
- Router: deprecated `state.navigation.hasStarted` / `hasFinished` (breaks later)
- `render` field in `block.json` vs PHP `render_callback`
- `theme.json` version 3 and default preset opt-outs
- WP 7.0: `html5` script theme support removed; PHP 7.4 minimum headers

With hosted MCP connected: live `lumo_check_code`. Without: bundled patterns at kit release.

#### Code Reviewer (`code-reviewer`)

Senior PR pass on PHP / `block.json` / `theme.json`:

- Output escaping in the right context
- REST `permission_callback` and sanitize/validate pairing
- `is_admin()` and role-name capability mistakes
- Nonces on state-changing handlers; `$wpdb->prepare`
- HPOS-incompatible order queries (basics)
- HTTP API misuse; options / transients / WP-Cron lifecycle
- Open redirects; plugin prefix / `ABSPATH` / i18n text domain basics

Plus Core scaffold skills: `wp-block-scaffold`, `wp-project-scaffold`. Command: `/wp-review`.

**Not in Starter:** Woo / Plugin / Security / Release agents; live plugin catalogue; Forge Hosted; CI.

### Agent Team (99 €) — full six on disk (+ included in Solo Hosted / Pro / Team 20)

Everything in Starter, plus:

| Agent | Job topics |
| --- | --- |
| **Woo Specialist** | HPOS order CRUD vs post meta; `wc_get_orders`; status hooks; Analytics SQL traps; HPOS compat declaration; Subscriptions meta under HPOS; invented Subscriptions helpers; `update_dates` vs raw schedule meta |
| **Plugin Specialist** | ACF / Gravity Forms / Elementor / Meta Box / Carbon Fields / CF7 integration mistakes (field retrieval, hook scoping, escaping, registration order) |
| **Security Auditor** | XSS / SQLi / CSRF / caps / REST holes / uploads / `unserialize` / open redirects / `WP_DEBUG_DISPLAY`; secrets and `.env` hygiene |
| **Release Engineer** | Testing strategy, CI stages, atomic deploy / rollback, staging hygiene, caching / cron / logging / backups, Composer lock, plugin standards, project layout (advisory `lumo_lookup` lane) |

Pack also: **9** skills + **5** commands. Still **no** hosted MCP on the 99 € SKU alone.

### Solo Hosted 149 / Pro 199 / Team 20 599 — hosted depth

Same full agent kit, plus:

- Live Pro catalogue (~192) and catch depth (~95+)
- Plugin advice for ACF, WooCommerce, Gravity Forms, Elementor, Meta Box, Carbon Fields, CF7, …
- Vol.1 living lookups (69)
- **AI Forge Hosted** entitlement on all three (Hosted Forge install not yet available)
- Pro / Team 20 only: GitHub Action CI gate
- Team 20: 20 hosted seats

**Seat helper (Teams):** Pro for 1–3 seats with CI; Team 20 from about 4 seats or the whole shop (3×199 ≈ 599).

---

## 6. Compact matrix (homepage / above-the-fold)

Shorter table for the first screen; full matrix on `/pricing#compare`.

| | Free | Starter 39 | Agent Team 99 | **Solo Hosted 149 ★** | Pro 199 | Team 20 · 599 |
| --- | --- | --- | --- | --- | --- | --- |
| Local watcher (CLI + Free MCP) | ● | ● | ● | ● | ● | ● |
| Agent files (2 / 6) | ○ | 2 | 6 | 6 | 6 | 6 |
| Hosted Pro MCP + live catch | ○ | ○ | ○ | ● | ● | ● |
| Vol.1 living lookups (69) | ○ | ○ | ○ | ● | ● | ● |
| AI Forge self-host | ● | ● | ● | ● | ● | ● |
| **AI Forge Hosted** (entitlement; install not yet available) | ○ | ○ | ○ | **●** | **●** | **●** |
| CI merge gate | ○ | ○ | ○ | ○ | ● | ● |
| WP 7.0 sourced coverage | ~ Free slice | bundled | bundled | ● hosted | ● | ● |
| WP 7.1 curated pack | ○ | ○ | ○ | ○ gap | ○ gap | ○ gap |
| Seats | — | 1 dl | 1 dl | 1 | per seat | **20** |

---

## 7. Card copy (paste-ready)

### Starter — 39 €/yr

**Two WordPress specialist agents on disk. Start small.**  
- **Currency Guard:** stale `block.json` / `theme.json` / Interactivity / WP 7.0 currency, plus **WP 7.1 always-iframe** breaks (`document`/`window`, admin-scoped CSS)  
- **Code Reviewer:** escaping, REST auth, capability checks, HPOS basics, Cron / HTTP / options traps  
- Plus matching scaffold skills and a `/wp-review` command (Claude / Cursor / Codex)  
- **No hosted MCP:** no live ACF / Woo / GF / Elementor catalogue (that unlocks at Solo Hosted 149+)  
**CTA:** Get Starter

### Solo Hosted ★ — 149 €/yr · Best Value

**Live Pro knowledge in Cursor + full Agent Team included.**  
- Hosted MCP · plugin advice for ACF, WooCommerce, Gravity Forms, Elementor, and more  
- Full 6-agent kit included (same files as Agent Team 99 — already inside) · Vol.1 living lookups · 1 seat  
- **Forge Hosted:** included entitlement. Hosted Forge install not yet available.  
- WordPress **7.0** depth in the live catalogue; **from 7.1 the Post Editor is always iframed** (Lumo watches); **7.1 coverage expanding** (no Ready claim)  
- **Why not Agent Team 99?** Pack is files only. Solo Hosted is the live catalogue. +50 € buys hosted MCP + Pack + Vol.1 + Forge Hosted entitlement — Best Value for Cursor solos.  
- No CI (upgrade to Pro for merge gate)  
**CTA:** Get Solo Hosted

### Pro — 199 €/seat/yr

**Solo Hosted + CI merge gate.**  
- Everything in Solo Hosted (hosted plugin knowledge + Forge Hosted entitlement; install not yet available)  
- GitHub Action can fail LOUD PRs — **required if WordPress merges need a gate that cannot be skipped**  
- Unlicensed Action stays green and says the gate **did not run** (never a silent pass)  
- Prefer Pro for **1–3** seats with CI; Team 20 from ~4 seats  
- **No hosted trial.** Proof path: Free `demo` LOUD first, then 14-day money-back once checkout is live (or a founder-shared dogfood key for finance review)  
**CTA:** Get Pro

### Agent Team — 99 €/yr (secondary · not starred)

**Full WordPress agent roster. Files only · no hosted MCP · dead end for live Cursor catalogue.**  
- 6 specialists on disk: Currency Guard, Code Reviewer, Woo, Plugin (ACF/GF/… patterns), Security, Release  
- Topic coverage in §5 · 9 skills + 5 commands · self-install  
- Patterns frozen at kit release until you connect hosted MCP  
- Need live plugin catalogue in Cursor? Buy **Solo Hosted 149** (Pack included — do not buy this SKU first)  
**CTA:** Get Agent Team

### Team 20 — 599 €/yr

**One license for the shop · default agency close.**  
- 20 hosted seats · full kit · live plugin knowledge · Vol.1 · CI  
- **Forge Hosted:** included entitlement. Hosted Forge install not yet available.  
- Choose Team 20 from ~4 seats (3× Pro ≈ 599); Pro if you only need 1–3 CI seats  
- Do not buy Starter or Agent Team separately — both included  
**CTA:** Get Team 20

### Free — 0 €

**Prove it on your machine.** `npx @unleashwp/lumo demo`  
Local snapshot + CLI + local MCP. No hosted Pro catalogue. Quiet ≠ clean.  
Go-live candidate (until npm publish): `npx -y github:unleash-wp/lumo#release/v1.0.0-go-live`  
**Fork after the Aha:** live ACF/Woo/GF → Solo Hosted 149 · files-only six agents → Agent Team 99 · tiny entry → Starter 39. Free coverage freezes; Core does not.

---

## 8. Psychology rules

1. **Solo Hosted** is the only starred solo card.
2. Never star Agent Team 99 on the main grid.
3. Never hide Agent Team completely — label it **files only / dead end for live catalogue**.
4. Never put Team 20 in the three-card solo row.
5. Forge Hosted shown on **Solo Hosted, Pro, Team 20** as **entitlement** (install not yet available) — not Free/Starter/Agent Team.
6. Primary CTA colour only on Solo Hosted. Never star Agent Team.
7. Never claim WP 7.1 readiness until the curated pack exists.
8. Always show glossary (website ↔ LS name) near pricing or checkout.
9. **Everyone buys** = each of the four buying personas has one primary close SKU (§11). CEO is not a buyer.
10. Loss aversion only with honest facts (frozen Free snapshot, 402 on hosted without paid key, Pack included so 99 then 149 is double-pay).

---

## 9. Wire to checkout

| Website name | LS product | In `LUMO_LS_PRODUCT_IDS`? |
| --- | --- | --- |
| Starter | Lumo Agent Core · 39 EUR | No |
| Agent Team | Lumo Agent Pack · 99 EUR | No |
| Solo Hosted | Lumo Freelancer · 149 EUR | **Yes** |
| Pro | Lumo Pro · 199 EUR | **Yes** |
| Team 20 | Lumo Agency · 599 EUR · 20 activations | **Yes** |

---

## 10. Sources (do not invent beyond these)

| Area | Source |
| --- | --- |
| Free MCP tools | `lumo/src/mcp/server.ts` |
| Hosted MCP tools | `lumo-pro/src/mcp/tool-names.ts` |
| Catalogue counts / honesty | `lumo-pro/docs/capability-inventory.md` |
| Agents / skills | `lumo-agent-kit/CONTENTS.md` |
| CI Action | `lumo-action/action.yml` |
| WP abilities | `lumo-wp` abilities registration |
| Knowledge import plan | [knowledge-import-agent-skills.md](./knowledge-import-agent-skills.md) |
| Product lock | [go-live-final.md](./go-live-final.md) · [packages.md](./packages.md) |

Canonical product rules: [go-live-final.md](./go-live-final.md) · [packages.md](./packages.md).

**Buyer smoke paths (per tier, honest):** [go-live-final.md §6b](./go-live-final.md#6b-buyer-verification-per-tier). Free is the trial; no hosted trial keys.

---

## 11. Everyone buys (persona close map)

**Definition (honest):** “Alle kaufen” means each **buying** persona has one primary SKU they would pay for, with a clear trigger and a secondary only when the job differs. **CEO is the founder, not a buyer.** Prices stay locked; framing carries conversion. No fake hosted trial.

| Persona | Primary SKU | Close trigger | Secondary | Do not |
| --- | --- | --- | --- | --- |
| **Entwickler** | Free → **Solo Hosted 149** (live) or **Agent Team 99** (files) | After `demo` Aha: local snapshot freezes; live ACF/Woo/GF needs hosted (402 without key). One-line npm vs go-live branch everywhere Free is sold. | Starter 39 if tiny entry | Stay Free forever without stating the freeze; confuse npm `0.4.x` with go-live `check` |
| **Freelancer** | **Solo Hosted 149 ★** | Best Value: +50 € over Agent Team buys hosted MCP + Pack included + Vol.1 + Forge Hosted entitlement. Agent Team alone = files dead end for live Cursor. | Starter 39 budget / files-curious | Stop at Agent Team 99 when they need live MCP |
| **Abteilungsleiter** | **Pro 199/seat** | CI merge gate is non-negotiable when WordPress PRs merge without a human re-check. Unlicensed Action never silent-passes. Seat math: 1–3 Pro; Team 20 from ~4. | Solo Hosted if no CI | Invent live trial infra. Close with Free LOUD proof + **14-day money-back** and/or **founder dogfood key** for finance |
| **Agentur-Chef** | **Team 20 · 599** | Default agency close. ~30 €/seat/year vs Pro 199. Pack + CI + Vol.1 + Forge Hosted entitlement included. | Pro × 1–3 only if tiny shop | Upsell Starter/Agent Team twice; weaken Team 20 |

**Founder close tools (not product infra):**

| Tool | Who | Status |
| --- | --- | --- |
| Free `demo` / go-live branch `check` | All | Live |
| 14-day money-back on LS paid pages | All paid | Restate on checkout (already locked) |
| Founder-shared dogfood / demo keys | Abteilungsleiter finance | **FOUNDER-ONLY** — temporary keys, not a public trial product |
| 60 s Free + Solo LOUD screenshot | Abteilungsleiter / Freelancer | Open (founder media) |
| Refund window | All paid | **FOUNDERS-LOCKED:** **14 days** only; do not advertise 30; do not cut price |

**No price change in this pass.** Any price tweak = **FOUNDERS-DECIDE**.

Also mirrored: [sales-ready-checklist.md](./sales-ready-checklist.md) · [pricing-personas.md](./pricing-personas.md) · `/connect`.
