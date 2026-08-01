# Knowledge import plan: WordPress/agent-skills

English. Internal curation plan. Measured 2026-08-01 against
[WordPress/agent-skills](https://github.com/WordPress/agent-skills/tree/trunk/skills)
(`trunk/skills`) and the Lumo Pro catalogue / Free snapshot / agent kit.

**Naming rule:** call the upstream project **`WordPress/agent-skills`**. Do not
call it “the official WordPress skills” in a rank sense. Do not claim Lumo “is”
that repository. Overlap is topical; Lumo’s product rule remains evidence-backed
Catch and reference entries (`AGENTS.md` in `lumo-pro`).

**Tier rule:** deep / current imports land in **Pro** SQLite. Free may get a
**teaser** slice only after Pro verify. Agent kit file patterns may cite bundled
near-term rules; live truth stays on hosted MCP for paying seats.

---

## 1. Inventory (18 skill folders)

| Skill folder | Domain (plain English) | Lumo map today | Import priority |
| --- | --- | --- | --- |
| `wordpress-router` | Classify repo → route to the right workflow | Process skill; not knowledge Catch | Low (optional agent routing note) |
| `wp-project-triage` | Deterministic repo inspection / JSON triage | No equivalent Catch; tooling | Low (reference or ignore) |
| `wp-block-development` | `block.json`, registration, supports, render, deprecations, tooling | **Strong:** Currency Guard + `block-theme-currency` + Gutenberg | Medium (fill gaps: InnerBlocks, attribute serialization, create-block tooling as **reference**) |
| `wp-block-themes` | `theme.json`, templates/parts, patterns, style variations, Site Editor debug | **Strong:** FSE + theme.json v3 currency | Medium (Site Editor debug / style hierarchy as reference) |
| `wp-interactivity-api` | Directives, store/state/actions, `viewScriptModule`, hydration | **Partial:** store + WP 7.0 `watch` / router deprecation | High (directive gotchas → Catch where wrong pattern is precise) |
| `wp-patterns` | Pattern registration, markup, tokens, a11y, i18n | **Partial:** FSE pattern auto-reg / synced patterns | Medium (anti-patterns → Catch candidates) |
| `wp-rest-api` | Routes, controllers, schema, auth, fields, CPT exposure | **Partial:** permission_callback + sanitize/validate | **High** (expand REST Catch / reference) |
| `wp-abilities-api` | Register abilities/categories, REST/MCP exposure, JS client | **Partial:** 6 Abilities entries (MCP public, permission, schema, resource URI) | **High** (domain-vs-projection, input_schema gotchas, error vocabulary → Catch + reference) |
| `wp-abilities-audit` | Audit REST surface → proposed Abilities registrations | **Gap** | Medium (Pro **reference** / curator workflow; not Free) |
| `wp-abilities-verify` | Verify registrations; adversarial readonly-but-writes | **Gap** | Medium (reference; possible future tool, not silent Catch) |
| `wp-plugin-development` | Hooks, lifecycle, Settings API, data, cron, security packaging | **Partial:** core breadth + plugin standards + security | Medium (Settings API / uninstall gaps) |
| `wp-plugin-directory-guidelines` | wordpress.org directory guidelines, GPL, naming | **Thin / gap** | Low–Medium (reference lane; rarely Catch) |
| `wp-performance` | Autoload, object cache, cron, HTTP, measurement | **Partial:** options autoload, cron, HTTP; book ops | Medium (autoload/object-cache Catch precision) |
| `wp-wpcli-and-ops` | WP-CLI search-replace, db, multisite, cron/cache | **Gap** as Catch | Low (Vol.1 / reference; dangerous ops = docs not Catch) |
| `wp-phpstan` | PHPStan neon, WP stubs, baselines | **Gap** | Low (reference) |
| `wp-playground` | Playground CLI, blueprints, version matrix | **Gap** | Low (reference; adjacent to AI Forge story) |
| `blueprint` | Playground blueprint JSON | **Gap** | Low (reference) |
| `wpds` | WordPress Design System UI (needs WPDS MCP) | **Gap** | Out of scope for Lumo Catch |

---

## 2. Gap matrix (focus: Abilities API + WP 7.1)

### Abilities API

| Topic | Pro today | Free snapshot | Suggested lane | Draft slug (curate, do not invent evidence) |
| --- | --- | --- | --- | --- |
| Missing `meta.mcp.public` | Yes | Teaser possible | Catch (exists) | `wp-ability-missing-mcp-public` |
| Mutating ability with open permission | Yes | — | Catch (exists) | `wp-ability-permission-true-on-mutating` |
| Thin / missing input schema | Yes | — | Catch (exists) | `wp-ability-missing-input-schema-properties` |
| Missing permission callback | Yes | — | Catch (exists) | `wp-ability-missing-permission-callback` |
| Resource ability missing URI | Yes | — | Catch (exists) | `wp-ability-resource-missing-uri` |
| Domain capability vs REST/MCP/Command Palette projection | No dedicated entry | — | **Reference** first | `wp-abilities-domain-vs-projection` |
| `show_in_rest` alone ≠ MCP discoverability (paired teaching) | Covered partly by MCP public entry | — | Reference cross-link | keep existing + lookup blurb |
| Input schema defaults / pagination key drift | No | — | Catch **if** regex-precise | `wp-ability-input-schema-defaults-drift` |
| Readonly annotation but execute writes | No | — | Catch (hard; needs careful signal) | `wp-ability-readonly-meta-but-mutates` |
| Category registration hook timing | No | — | Reference or soft Catch | `wp-abilities-category-init-hook` |
| Audit / verify rollout docs | No | — | Curator process, not customer Catch | n/a (skill workflow) |

### WordPress 7.0 vs 7.1

| Topic | Status 2026-08-01 |
| --- | --- |
| WP **7.0** iframe / apiVersion 3, Interactivity `watch`, router nav deprecation, PHP 7.4 floor, html5 script support, script module deps | **In catalogue** (see `wp-7-0-*.ts`) |
| WP **7.1** Free high-signal slice | **Shipped** in Free snapshot: Classic inserter reversal; prepare-schema mutation; ability REST callbacks ignored; background.gradient vs color.gradient; `__next40pxDefaultSize` on form controls; **Post Editor always iframed** (global `document`/`window` vs `ownerDocument`) |
| WP **7.1** Pro depth | **Shipped (partial):** abilities lifecycle / typed REST / get-user-info reference; Icon API; Navigation→Navigator; theme.json textShadow; client-side media; React 19 punted; dimensions.minWidth; **always-iframe Post Editor migration map**; **editorStyle vs enqueue_block_editor_assets**; **admin-scoped editor CSS** |

**Loud product fact (not a Ready claim):** From WordPress 7.1 the Post Editor canvas runs inside an iframe. Blocks that touch `document`/`window` or inject admin-scoped CSS break. Lumo watches for those patterns.
| WP **7.1** full pack | **Not done** — Knowledge CPT, DataViews filters, Design System theming, jQuery UI 1.14.2 removals, Custom HTML editable, founder briefing still open |
| Pre-release briefing entry | Template only (`core-briefing-content.ts`) |
| Website claim “Ready for WP 7.1” | **Forbidden** until full curated pack + `verify:knowledge` |

**Candidate 7.1 topics** (re-verified / remaining):

| Draft slug | Working title | Status |
| --- | --- | --- |
| `wp-7-1-classic-block-inserter-reversal` | Classic stays; remove filter workarounds | **Published** (Catch, Free) |
| `wp-7-1-prepare-json-schema-for-client` | Do not store prepared client schemas on abilities | **Published** (Catch, Free) |
| `wp-7-1-ability-rest-schema-callbacks-ignored` | Use validate filters, not REST schema callbacks | **Published** (Catch, Free) |
| `wp-7-1-background-gradient-support` | background.gradient vs color.gradient | **Published** (Catch, Free) |
| `wp-7-1-next40px-default-size-ignored` | Form-control `__next40pxDefaultSize` ignored | **Published** (Catch, Free) |
| `wp-7-1-post-editor-iframe-owner-document` | Global `document`/`window` vs `ownerDocument`/`defaultView` in iframed Post Editor | **Published** (Catch, Free) |
| `wp-7-1-abilities-api-improvements` | Lifecycle filters, typed REST, get-user-info | **Published** (Reference, Pro) |
| `wp-7-1-icon-api` | collection/name Icon API | **Published** (Catch, Pro) |
| `wp-7-1-editor-navigation-removed` | Navigation → Navigator | **Published** (Catch, Pro) |
| `wp-7-1-theme-json-text-shadow` | styles.typography.textShadow | **Published** (Reference, Pro) |
| `wp-7-1-client-side-media-processing` | Filter + CSP worker-src | **Published** (Reference, Pro) |
| `wp-7-1-react-19-punted` | React 19 not in Core 7.1 | **Published** (Reference, Pro) |
| `wp-7-1-dimensions-min-width` | supports.dimensions.minWidth | **Published** (Reference, Pro) |
| `wp-7-1-post-editor-always-iframe` | GB 23.6 / WP 7.1 always-iframe migration map | **Published** (Reference, Pro) |
| `wp-7-1-iframe-editor-style-enqueue` | Canvas CSS via `editorStyle`, not `enqueue_block_editor_assets` | **Published** (Catch, Pro) |
| `wp-7-1-iframe-admin-scoped-editor-css` | Drop `.wp-admin` / `body.block-editor-page` canvas selectors | **Published** (Catch, Pro) |
| ~~`wp-7-1-classic-block-inserter-hidden`~~ | ~~Classic block hidden~~ | **Obsolete** — plan reverted; do not publish |
| `wp-7-1-knowledge-cpt-route-collision` | `wp_knowledge` CPT / REST / caps collisions | Ticket — re-verify before curate |
| `wp-7-1-dataviews-server-registration` | DataViews server registration shift | Ticket — Reference until API stable |
| `wp-7-1-router-navigation-replacement` | Official navigation-state replacement | Ticket — Catch when API ships |
| `wp-7-1-breaking-changes` | Founder briefing umbrella | Ticket — Briefing |

**Abilities reference shipped:** `wp-abilities-domain-vs-projection` (lookup only).

---

## 3. Evidence requirements (non-negotiable)

From `lumo-pro/AGENTS.md`:

1. Every Catch rule needs **two tests**: one must fire, one near-miss must stay silent.
2. Evidence chain: source URL, affected versions, wrong pattern, correct pattern, verification step.
3. No speculative “will break in 7.1” without a sourced sentence (`no-speculation-check`).
4. Counts and claims on the website must match measured catalogue, not this plan’s drafts.
5. Fail open on availability; never invent a clean bill of health.

**Import method (recommended):**

1. Read skill `references/*.md` as **topic leads**, not as copy-paste truth.
2. For each candidate, find a primary source (Make Core, handbook, Trac, plugin docs).
3. Write entry in `src/knowledge/*-content.ts` with catch signal only when the bad pattern is machine-precise.
4. Prefer **reference lane** (`lumo_lookup`) when the skill teaches a workflow without a stable wrong regex.
5. Run `npx vitest run`, `npx tsc --noEmit`, `npm run verify:knowledge` before publish.
6. Free snapshot: only after Pro seed, and only patterns that survive the three-guard precision model.

---

## 4. Recommended next curation wave (priority order)

### Wave A — WP 7.1 readiness (founder-gated, highest product value)

1. Re-read Make / Trac for 7.1 as of **today** (research file dated 2026-06-25 will drift).
2. Publish sourced Catch entries for confirmed breaks (Classic inserter; Knowledge collisions if still accurate).
3. Fill `wp-7-1-breaking-changes` briefing (replace template).
4. Update Currency Guard bundled list **after** Pro entries exist.
5. Only then: website line “Ready for WP 7.1”.

### Wave B — Abilities API depth (from `wp-abilities-api` + verify/audit)

1. Reference: domain vs projection.
2. Catch candidates: input schema drift; readonly-but-writes (if signalable).
3. Keep audit/verify as curator/agent workflow docs, not silent customer Catch.

### Wave C — REST API breadth (from `wp-rest-api`)

1. Catch: common `register_rest_field` / CPT `show_in_rest` / controller mistakes with clear wrong code.
2. Reference: auth mode matrix, pagination/embed pitfalls.

### Wave D — Interactivity + patterns polish

1. Directive misuse Catch where unique.
2. Pattern anti-patterns from `wp-patterns/references/anti-patterns.md` with sources.

### Wave E — defer

`wpds`, Playground/blueprint (unless Forge packaging needs them), PHPStan, WP-CLI ops encyclopaedia, directory guidelines (reference backlog).

---

## 5. Free vs Pro

| Layer | Gets |
| --- | --- |
| Pro hosted | Full new entries after verify |
| Free snapshot | Optional 1–3 teaser Catch rows from Wave A/B that fire cleanly offline |
| Agent Core / Pack files | Topic bullets updated to match; still say “bundled patterns / MCP when connected” |
| Website | Coverage domains in `website-pricing-table.md`; 7.1 marked gap until Wave A ships |

---

## 6. Out of scope for this import

- Vendoring `WordPress/agent-skills` into the npm package as product content.
- Claiming Lumo agents are those skills.
- Shipping Catch rules copied from skill prose without independent evidence.
- Marketing “Ready for WP 7.1” before Wave A.

---

## 7. Sources

| Item | Path / URL |
| --- | --- |
| Upstream skills tree | https://github.com/WordPress/agent-skills/tree/trunk/skills |
| Pro catalogue honesty | `lumo-pro/docs/capability-inventory.md` |
| WP 7.0 entries | `lumo-pro/src/knowledge/wp-7-0-content.ts`, `wp-7-0-depth-content.ts` |
| Abilities entries | `lumo-pro/src/knowledge/wp-abilities-content.ts`, `wp-abilities-mcp-frontier-content.ts` |
| Briefing template | `lumo-pro/src/knowledge/core-briefing-content.ts` |
| Prior 7.1 research (stale risk) | `lumo-pro/plans/reports/researcher-260625-1903-briefing-1-topic-starter.md` |
| Website matrix | `lumo/docs/website-pricing-table.md` |
