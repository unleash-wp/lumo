# Agent Core — affordable entry (not the full team)

English. Files only. No hosted Pro MCP.

## The pitch (one line)

**Two WordPress specialist agents that catch stale AI code and review PHP/REST/auth. 39 €/year. Not the live ACF/Woo/GF catalogue (that is Solo Hosted 149+). Upgrade to Agent Pack when you need Woo, Plugin, Security, and Release on disk.**

## What’s in

| Included | Not included |
| --- | --- |
| **Currency Guard** (`wp-currency-guard`): stale `block.json` / `theme.json` / Interactivity / WP 7.0 currency (apiVersion 3, viewScriptModule, experimental supports, Block Bindings, `watch()`, router nav deprecation, render field, theme.json v3 opt-outs, html5 script / PHP 7.4 floor) + **WP 7.1 always-iframe** breaks (`document`/`window`, admin-scoped CSS, `editorStyle`) | Hosted Pro MCP |
| **Code Reviewer** (`wp-code-reviewer`): escaping, REST `permission_callback` + sanitize/validate, caps vs roles, `is_admin()` auth mistake, nonces, `$wpdb->prepare`, HPOS query basics, HTTP API, options/transients, WP-Cron, open redirects, prefix / ABSPATH / i18n basics | Woo / Plugin / Security / Release agents |
| `/wp-review` command (runs the Code Reviewer) | Live `lumo_plugin_advice` (ACF, Woo, GF, Elementor, …) |
| Scaffold skills: `wp-block-scaffold`, `wp-project-scaffold` | Full 9-skill + 5-command set |
| Annual update entitlement (LS, 1 activation) | GitHub Action CI |
| Money-back 30 days | AI Forge Hosted |

**Naming rule:** say **Core**, never “Team”. Team = Agent Pack (99 €).

**Buyer clarity:** lead with the two jobs and their **topic lists** (Currency Guard + Code Reviewer). The slash command and skills are how you invoke them, not the product. Full public matrix: [website-pricing-table.md](./website-pricing-table.md) §5.

## Ladder

```
Free → Agent Core 39 € → Agent Pack 99 € → Freelancer 149 € → Pro 199 € → Agency 599 €
```

| Tier | Agent files |
| --- | --- |
| Agent Core (standalone) | You pay **39 €/yr** (2 agents) |
| Agent Pack | You pay **99 €/yr** (full 6) |
| Freelancer / Pro / Agency | **Full Agent Pack included** (not Core alone) |

Do not sell Core to Freelancer/Pro/Agency buyers. They already get the full Pack.

## Plugin knowledge — where it lives

| What | Where |
| --- | --- |
| Currency Guard + Code Reviewer (bundled patterns) | **Core** (and every higher kit) |
| Plugin Specialist / Woo Specialist agents (bundled patterns) | **Agent Pack** files (99 €) and included in hosted seats |
| Live ACF / Woo / GF / Elementor / Meta Box / Carbon Fields / CF7 catalogue via `lumo_plugin_advice` | **Hosted MCP only:** Freelancer (Solo Hosted), Pro, Agency (Team 20) |

Core never calls `mcp.unleash-wp.com`. Agents state MCP not connected and use bundled patterns.

## Why 39 € (not 49, not 19)

- 19 € felt like a tip, not a license.
- 49 € was a dead middle (too dear to try, too thin vs Pack).
- **39 €** = clear step under 99, still a real annual product for price-sensitive solos.

## Lemon Squeezy

1. Product: `Lumo Agent Core`
2. Variant: Annual **39 EUR** · 1 activation
3. Product id **out** of `LUMO_LS_PRODUCT_IDS`
4. Delivery: Core zip from `lumo-agent-kit/bin/package-agent-core.sh`

## Without MCP

Agents state MCP not connected and use bundled patterns. Live catalogue = Freelancer / Pro / Agency.
