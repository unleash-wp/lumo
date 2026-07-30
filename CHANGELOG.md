# Changelog

All notable changes to Lumo — the Free Agent — are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Update cadence

The knowledge base is kept current with each WordPress and WooCommerce release.
Entries are added when a core or plugin API change is verified against real source —
always with a source URL, affected version range, and a tested code example.
No entry ships without evidence; no claim ships without a test step.

---

## [Unreleased]

## [0.4.0] — 2026-07-30

**Why you should update:** 0.3.0 installs carry a pre-gating snapshot that
included paid-tier content and advertised coverage the free tier does not have.
0.4.0 ships the corrected 42-entry snapshot, honest coverage claims, and a
watchdog that actually barks.

### Added
- **Second LOUD route** — security fundamentals that are wrong in every
  WordPress version (unprepared `$wpdb` queries, role names passed to
  `current_user_can()`) now answer LOUD, anchored on their documentation
  source instead of a release version. No citation, no bark.
- Seven curated rules connected to the live catch (superglobal sanitisation,
  SQL injection, i18n text domains, unsafe redirects, role-vs-capability,
  raw cURL), each tested against its entry's own documented wrong and
  correct forms.
- A fired signal into Pro-only knowledge (WooCommerce/HPOS) now surfaces a
  named coverage gap in every channel — MCP tool, editor hook, GitHub
  Action — instead of being dropped silently.

### Changed
- The neutral line reports the scope that was checked instead of pronouncing
  the code clean; the same applies to the Action's log line and review
  summary.
- The Pro teaser names only what was detected and what Lumo Pro actually
  covers — no catalogue recitation, no claims about your AI's training data.
- The editor hook shows the full upgrade teaser once per plugin and install;
  afterwards a short line keeps the gap named without repeating the pitch.
- Plugin manifests and marketplace descriptions state the real entry count
  (42) and name WooCommerce/HPOS as Lumo Pro coverage.

### Fixed
- WooCommerce order-variable detection no longer fires on `$recorder_id`,
  `$border_id`, `$order_status` or `$order_number`.
- `wp_redirect()` is only flagged when request input actually reaches the
  redirect target — static redirects stay quiet.
- The test suite can no longer write into the developer's real state
  directory.

**How to update:** AI Forge → Plugins → "Check for updates" → Update (the
update is offered because the version number changed). npm installs:
`npm install -g @unleashwp/lumo@latest`.

_Nothing yet._

## [0.3.0] — 2026-07-29

The catch-wedge release: the knowledge base grows from 20 to 142 entries, the
detection registry generalizes beyond WooCommerce, and every surface (README,
marketplace, plugin manifest, MCP tool copy) moves off the HPOS-first framing
to the Core/Block catch wedge.

### Knowledge base

**WordPress 7.0 (released May 2026)**
- `wp-7-0-router-navigation-deprecated` — `state.navigation.hasStarted` /
  `state.navigation.hasFinished` deprecated in the `core/router` Interactivity API store
- `wp-7-0-interactivity-watch` — `effect()` from `@preact/signals` should be replaced with
  `watch()` from `@wordpress/interactivity`
- `wp-7-0-php-minimum-7-4` — PHP 7.2 and 7.3 no longer supported in WordPress 7.0

**Gutenberg block editor**
- `gutenberg-apiversion-2-deprecated-wp6-9` — Block API version 2 deprecated in WP 6.9;
  migrate to `apiVersion: 3`
- `gutenberg-isvalidblockcontent-removed` — `wp.blocks.isValidBlockContent()` removed;
  use `validateBlock()` instead
- `gutenberg-usesetting-deprecated-wp6-5` — `useSetting()` deprecated in WP 6.5;
  migrate to `useSettings()`
- `wp-img-tag-add-decoding-attr-deprecation` — `wp_img_tag_add_decoding_attr()` deprecation

**WordPress Abilities API**
- `wp-ability-missing-mcp-public` — `wp_register_ability()` without `meta.mcp.public: true`
  hides the ability from MCP clients (Claude Code, Cursor)

**Security & repo hygiene**
- `env-file-committed-to-git` — `.env` committed to version control exposes secrets
- `hardcoded-api-keys-secrets` — hardcoded Stripe / GitHub / AWS key prefixes in source
- `missing-composer-lock-file` — `composer.lock` absent from version control
- `wp-output-escaping-xss-prevention` — missing context-correct escape functions at output

### Detection & catch

- Pattern registry generalised: detection is no longer WooCommerce-only; any registered
  pattern can fire (`wordpress-core`, `gutenberg`, `env-in-git`, `hardcoded-secrets`,
  `wordpress-dependencies`, `wp-abilities-api`, `wordpress-7-0`)
- Premium agency plugin detection: ACF Pro, Elementor Pro, Gravity Forms, Meta Box, Carbon
  Fields, WP Rocket, Wordfence, Polylang, Rank Math, Toolset Types, Pods, WPBakery,
  WooCommerce Subscriptions; each surfaces a measured upgrade teaser, or an honest detection
  note when Pro coverage is not yet curated
- Upgrade promise gated: `hasProCoverage: true` required before any Lumo Pro teaser is shown
- Blob-in catch tool (`lumo_check_code`): detects anti-patterns directly in a code snippet
  without a project scan; catch signals are precision-classed (CERTAIN / CONTEXT_DEPENDENT /
  REPO_STATE) and map to LOUD / SOFT / SILENT output
- Version-scoped catch output: LOUD/SOFT messages reference the project's detected WP/Woo
  version when available
- `lumo_check_code` GitHub Actions PR reviewer: blocks merge on LOUD signals in the diff,
  advises on SOFT signals
- Local PreToolUse enforcement hook: intercepts WordPress edits in the Claude Code editor,
  blocks on LOUD signals before the file write lands
- `wp-binding` skill: consult Lumo before writing WordPress code, with optional
  `wp_version` / `woo_version` so catches stay version-aware

### Infrastructure

- Local MCP server (`lumo-mcp`): exposes `lumo_audit`, `lumo_check_code`, `lumo_lookup`,
  and `lumo_version` over stdio; runs without network access
- Snapshot locked to generated artifact: `data/snapshot.json` is never hand-edited;
  a byte-parity CI guard enforces provenance
- Freshness line on every Free answer; upgrade hint sharpened with loss-aversion framing
- Onboarding aha flow and local activation event log
- HPOS scoreboard (opt-in telemetry)
- Cursor rule and MCP server config for non-Claude-Code editors

---

## [0.2.0] — 2026-06-21

### Initial public release

- Free Agent plugin spine: manifest, shared types, local HPOS snapshot and loader
- WooCommerce detection via composer, plugin directory, wp-cli, and heuristic source signals
- HPOS order-access entry (`woocommerce-hpos-order-access`): `get_post_meta()` /
  `get_posts(['post_type' => 'shop_order'])` vs. `wc_get_order()` with dated source and a
  tested code example
- Upgrade prompt with hard under-ask back-off
- README, install docs, and 0.2.0 release packaging

[Unreleased]: https://github.com/unleash-wp/lumo/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/unleash-wp/lumo/releases/tag/v0.2.0
