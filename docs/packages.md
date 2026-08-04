# Lumo packages

English. One global price. No PPP. Locked 2026-08-01.

## Sales story

**Free:** Lumo plugin in AI Forge. Local snapshot on `uwp mcp`. No hosted MCP.

**Paid:** Hosted done for you at `mcp.unleash-wp.com`: live catalogue, Agent Pack included, MCP link, CI on Pro/Team 20. Forge Hosted entitlement on paid hosted seats when install ships.

**File packs:** Starter (39 €) and Agent Team (99 €) are offline agent files only. No hosted MCP.

Knowledge is curated from WordPress Core changes (Make/Core, Trac, handbooks) with wrong→correct, source, and version. Free uses a bundled snapshot. Paid uses the live Pro catalogue.

## Ladder

```
Free → Starter 39 € → Agent Team 99 € → Solo Hosted 149 € → Pro 199 € → Team 20 · 599 €
```

| Package | Website | Price | Hosted MCP | What they get |
| --- | --- | --- | --- | --- |
| Lumo Free | Free | 0 € | Never | AI Forge plugin + `@unleashwp/lumo` engine (Free snapshot) |
| Agent Core | Starter | 39 €/yr | Never | 2 agents on disk: block/theme currency + Core PHP review |
| Agent Pack | Agent Team | 99 €/yr | Never | 6 agents + 9 skills + 5 commands on disk |
| Freelancer | Solo Hosted ★ | 149 €/yr | Yes · 1 seat | Hosted MCP + Pack + Vol.1 lookups + Forge Hosted entitlement · no CI |
| Lumo Pro | Pro | 199 €/seat/yr | Yes | Same as Solo + CI Action |
| Agency | Team 20 | 599 €/yr | Yes · 20 seats | Hosted MCP + Pack + Vol.1 + CI |

Seat helper: Pro for 1–3 seats with CI; Team 20 from about 4 seats (3×199 ≈ 599).

## Hard rules

1. Free / Starter / Agent Team / community tokens → zero bytes from `mcp.unleash-wp.com`.
2. Full Agent Pack included in Solo Hosted / Pro / Team 20. Never double-sell.
3. Agent Core and Agent Pack LS product IDs stay out of `LUMO_LS_PRODUCT_IDS`.
4. Freelancer, Pro, and Agency LS product IDs must be in `LUMO_LS_PRODUCT_IDS`.
5. No self-hosted Pro. Paying seats use the hosted MCP only.
6. Agency = up to 20 hosted MCP seats on checkout.
7. Vol.1 living edition = 69 `book-*` reference lookups via `lumo_lookup` on hosted tiers only (not Catch, not the PDF).
8. Forge Hosted: included entitlement on Solo Hosted / Pro / Team 20. Install not yet available.
9. Do not claim “Ready for WP 7.1” until sourced `wp-7-1-*` entries ship. Post Editor always-iframe (7.1) is a known loud pattern; coverage is still expanding.

Website copy: [website-sell-sheet.md](./website-sell-sheet.md) · [website-pricing-table.md](./website-pricing-table.md) · Install: [install.md](./install.md)

## Vol.1 living edition

| Tier | Vol.1 |
| --- | --- |
| Free / Starter / Agent Team | Teaser copy only |
| Solo Hosted / Pro / Team 20 | 69 living `lumo_lookup` entries |

Queryable engineering reference in hosted MCP, updated per release. Not the print/PDF.

## Lemon Squeezy products

| LS product | Variant | Activations | In `LUMO_LS_PRODUCT_IDS`? |
| --- | --- | --- | --- |
| Lumo Agent Core | Annual 39 EUR | 1 | No |
| Lumo Agent Pack | Annual 99 EUR | 1 | No |
| Lumo Freelancer | Annual 149 EUR | 1 | Yes |
| Lumo Pro | Annual 199 EUR / seat | 1 per key | Yes |
| Lumo Agency | Annual 599 EUR | 20 | Yes |

Connect page: `GET /connect` on the Pro host.

## Who runs what

| Buyer | MCP endpoint | Knowledge |
| --- | --- | --- |
| Free | local `lumo-mcp` / `uwp mcp` | Free snapshot in npm package |
| Starter / Agent Team | local Free MCP + kit files | Snapshot + bundled agent patterns |
| Solo Hosted / Pro / Team 20 | `https://mcp.unleash-wp.com/mcp` + Bearer key | Pro SQLite on UnleashWP host |

