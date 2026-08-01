# Lumo Agent Pack — full agents + skills

English. One full-team SKU. Self-install files. No hosted Pro MCP.

Cheaper entry (2 agents only): **[Agent Core 39 €/yr](./agent-core.md)**.

## The pitch (one line)

**Your WordPress Agent Team — 6 specialists + 9 skills + 5 commands, 99 €/year. Install once. Updates yearly.** Quiet ≠ clean. Core-sourced knowledge, not model memory.

## What's inside (honest counts)

| Surface | Count |
| --- | --- |
| Specialized agents (`uwp-*`) | **6** |
| Domain skills (`wp-*`) | **9** |
| Slash commands | **5** |
| Hosted Pro MCP | Not in this SKU |

## What’s in the pack

| Included | Not included |
| --- | --- |
| 6 agents with topic coverage below | Hosted Pro MCP (buy Freelancer / Pro / Agency) |
| 9 skills + 5 slash commands | GitHub Action CI gate |
| Claude Code / Cursor / Codex install paths | AI Forge Hosted (entitlement only on Solo Hosted / Pro / Team 20; install not yet available) |
| Annual update entitlement (LS, 1 activation) | **Vol.1 living knowledge** (69 MCP lookups — paid hosted only) |
| Money-back 14 days | Optional bookstore PDF (week-1; does not block go-live) |

Source tree: `unleash-wp/lumo-agent-kit` (ship as zip / installer from that repo).
Public topic matrix: [website-pricing-table.md](./website-pricing-table.md) §5.

### Agent jobs (topic lists, not slash-command marketing)

Public agent IDs use the `uwp-` prefix (UnleashWP). Never `wp-`.

### Specialized agents for the WordPress build lifecycle

**uwp-currency-guard** — Catches stale block/theme AI code before it ships  
**uwp-code-reviewer** — Escaping, REST auth, caps, HPOS basics  
**uwp-woo-specialist** — WooCommerce HPOS and Subscriptions that survive 8.2+  
**uwp-plugin-specialist** — ACF, Gravity Forms, Elementor, Meta Box, Carbon Fields, CF7  
**uwp-security-auditor** — OWASP surfaces plus a secrets sweep  
**uwp-release-engineer** — Testing, CI/CD, infra, and release hygiene  

| Agent | Watches / advises on |
| --- | --- |
| **Currency Guard** (`uwp-currency-guard`) | Stale `block.json` / `theme.json` / Interactivity / WP 7.0 currency (apiVersion, viewScriptModule, experimental supports, Bindings, `watch()`, router nav, render field, preset opt-outs) + **WP 7.1 always-iframe** breaks |
| **Code Reviewer** (`uwp-code-reviewer`) | Escaping, REST auth, caps vs roles, nonces, SQL prepare, HPOS basics, HTTP / options / Cron, redirects, plugin hygiene basics |
| **Woo Specialist** (`uwp-woo-specialist`) | HPOS order CRUD, status hooks, Analytics SQL, compat declaration; Subscriptions meta / invented helpers / `update_dates` |
| **Plugin Specialist** (`uwp-plugin-specialist`) | ACF, Gravity Forms, Elementor, Meta Box, Carbon Fields, CF7 integration mistakes (bundled patterns; live catalogue = hosted) |
| **Security Auditor** (`uwp-security-auditor`) | XSS / SQLi / CSRF / caps / REST / uploads / unserialize / open redirects / debug display; secrets and `.env` |
| **Release Engineer** (`uwp-release-engineer`) | Tests, CI/CD, atomic deploy, staging, caching/cron/logging/backups, Composer lock, plugin standards, project layout (advisory) |

### Skills (9) — domain IDs stay `wp-*`

Honest count: **9** skills (not inflated catalogue numbers).

**Scaffold & project structure:** `wp-project-scaffold`, `wp-composer-bedrock`, `wp-mu-plugin`, `wp-block-scaffold`  
**CI, test & deploy:** `wp-ci-pipeline`, `wp-playwright-e2e`, `wp-atomic-deploy`, `wp-release`  
**Secrets & hygiene:** `wp-secrets-env`

### Commands (5)

`/wp-scaffold` · `/wp-review` · `/wp-audit` · `/wp-deploy-check` · `/wp-test-setup`

### Included free higher up the ladder

| Tier | Agent Pack |
| --- | --- |
| Agent Core | Not this SKU — Core is the 2-agent subset |
| Agent Pack (standalone) | You pay **99 €/yr** |
| Freelancer | **Included** |
| Lumo Pro | **Included** |
| Agency | **Included** for the team |

Do not sell Agency / Pro / Freelancer buyers a second Agent Pack checkout.

## Price

| Tier | Price | Job |
| --- | --- | --- |
| Free | 0 € | Local watcher only |
| Agent Core | **39 €/yr** | 2 agents (entry) |
| **Agent Pack** | **99 €/yr** | Full team files |
| Freelancer | 149 €/yr | Pack included + hosted MCP + Forge Hosted entitlement (install not yet available) |
| Pro | 199 €/seat/yr | Pack included + MCP + CI + Forge Hosted entitlement (install not yet available) |
| Agency | 599 €/yr · 20 seats | Pack included + MCP + CI + Forge Hosted entitlement (install not yet available) |

**Website:** Agent Pack = **Agent Team** (secondary, not starred). Need live catalogue? **Solo Hosted 149**, not this SKU alone.

## Ladder

```
Free → Agent Core 39 € → Agent Pack 99 € → Freelancer 149 € → Pro 199 € → Agency 599 €
```

## Unit economics

1. Delivery = zip / copy install — **no per-request LLM**, no Pro host burn
2. Standalone license = Lemon Squeezy annual · activations **1**
3. Paid hosted seats unlock the **full** pack download — no second charge
4. Do **not** unlock Pro MCP with Core- or Pack-only keys

## Lemon Squeezy checklist

1. Product: `Lumo Agent Pack`
2. Variant: Annual **99 EUR**
3. License + 1 activation (download entitlement)
4. Product id **out** of `LUMO_LS_PRODUCT_IDS`
5. Checkout + portal: download link after purchase

## Without MCP

Agents say at the top of every review: MCP not connected — running on bundled patterns.
With Freelancer / Pro / Agency hosted MCP, agents call live `lumo_check_code` / lookup.
**Vol.1 living edition** (69 `book-*` reference lookups via `lumo_lookup`) ships on hosted
seats only — not in this zip, not Catch, not the PDF.
