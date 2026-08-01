# Lumo packages — final (locked 2026-08-01)

English. One global price. No PPP.

**USP:** Knowledge curated from WordPress Core changes (Make/Core, Trac, handbooks, contributor pipeline), with wrong→correct, source, and version. Not AI training cutoffs. Free = local snapshot. Pro = live curated knowledge that tracks Core.

**Two doors:**
- **Free** may self-host (local CLI + local MCP + AI Forge self-host). Encouraged.
- **Freelancer / Pro / Agency** = **done-for-you online access** to UnleashWP’s hosted MCP
  (`mcp.unleash-wp.com`). Not a self-hosted Pro package.

**File packs (no hosted MCP):** Agent Core (entry) and Agent Pack (full team).
Paid hosted seats include the **full Agent Pack** — never double-sell.

## Ladder

```
Free (local) → Starter 39 € → Agent Team 99 € → Solo Hosted 149 € → Pro 199 € → Team 20 · 599 €
```

(Internal LS: Agent Core · Agent Pack · Freelancer · Agency.)

| Package | Website | Price | Hosted MCP (Pro DB) | What they get |
| --- | --- | --- | --- | --- |
| **Lumo Free** | Free | 0 € | **Never** | Local `@unleashwp/lumo` (bundled snapshot: Core/REST/block teaser Catch) + AI Forge **self-host**. No hosted MCP. |
| **Agent Core** | **Starter** | **39 €/yr** | **Never** | **2 specialist agents on disk:** block/theme/Interactivity currency (WP 7.0 + **WP 7.1 always-iframe** breaks) + Core PHP review (escaping, REST auth, caps, HPOS basics, Cron/HTTP/options). Scaffold skills. No live plugin catalogue. |
| **Lumo Agent Pack** | **Agent Team** | **99 €/yr** | **Never** | **Full 6-agent team on disk** (Currency Guard, Code Reviewer, Woo HPOS/Subscriptions, Plugin ACF/GF/Elementor/Meta Box/Carbon/CF7 patterns, Security, Release) + 9 skills + 5 commands. No hosted MCP. |
| **Freelancer** | **Solo Hosted** ★ | **149 €/yr** | **Yes** · 1 seat | Hosted MCP depth (Core, REST, FSE, Abilities, WP **7.0** + growing **7.1** wave, plugins via `lumo_plugin_advice`) · **Agent Pack** · Vol.1 · **Forge Hosted entitlement** (install not yet available) · no CI. **Full WP 7.1 pack = still open (not claimed ready).** |
| **Lumo Pro** | **Pro** | **199 €/seat/yr** | **Yes · hosted only** | Same as Solo Hosted + CI Action · **Agent Pack** · Vol.1 · **Forge Hosted entitlement** (install not yet available) |
| **Agency** | **Team 20** | **599 €/yr** | **Yes · hosted only** · **20 seats** | Hosted MCP · **Agent Pack** · Vol.1 · **Forge Hosted entitlement** (install not yet available) · CI |

**Seat helper:** Pro for 1–3 seats with CI; Team 20 from about 4 seats or one shop license (3×199 ≈ 599).

### Hard rules

1. Free / Agent Core / Agent Pack / Community `uwp.free.…` → **zero bytes** from `mcp.unleash-wp.com`.
2. **Full Agent Pack** included free in Freelancer / Pro / Agency — never double-sell.
3. Agent Core + Agent Pack LS product ids must **not** be in `LUMO_LS_PRODUCT_IDS`.
4. Freelancer + Pro + Agency LS product ids **must** be in `LUMO_LS_PRODUCT_IDS`.
5. **No self-hosted Pro.** Paying seats = hosted MCP only.
6. Quiet ≠ clean. Not AppSec. Lumo English; Forge local UI may be DE.
7. Agency = **up to 20** hosted MCP seats (stated on checkout).
8. Core is **not** called “Team” — Pack is the team. Core upsells to Pack.
9. **Vol.1 living edition** = 69 `book-*` reference lookups via `lumo_lookup` on hosted MCP
   (Freelancer / Pro / Agency). Not Catch. Not the PDF. Free / Core / Pack get teaser copy only.
10. **AI Forge Hosted** is included on **Freelancer / Pro / Agency** (all paid hosted seats) —
    **Included entitlement. Hosted Forge install not yet available.** Not Free / Core / Pack. Self-host remains available to all.
11. **Do not claim “Ready for WP 7.1”** until Pro has published sourced `wp-7-1-*` entries
    (see `website-pricing-table.md` §3.6 and `knowledge-import-agent-skills.md`).
    **Loud fact (already shipped):** From WordPress 7.1 the Post Editor canvas runs inside an
    iframe. Blocks that touch `document`/`window` or inject admin-scoped CSS break. Lumo watches
    for those patterns.
12. Website feature detail (domains + agent topics): [website-pricing-table.md](./website-pricing-table.md).
13. Sales Day-0: [sales-ready-checklist.md](./sales-ready-checklist.md).

### Name glossary

| Website | LS / internal | Price |
| --- | --- | --- |
| Free | Lumo Free | 0 € |
| Starter | Agent Core | 39 €/yr |
| Agent Team | Agent Pack | 99 €/yr |
| Solo Hosted ★ | Freelancer | 149 €/yr |
| Pro | Lumo Pro | 199 €/seat/yr |
| Team 20 | Agency | 599 €/yr |
## UnleashWP Learn Vol.1 (living edition)

| Tier | Vol.1 |
| --- | --- |
| Free | Teaser copy only |
| Agent Core / Pack | No MCP book corpus (Pack = agent files, not hosted knowledge) |
| Freelancer / Pro / Agency | **69 living `lumo_lookup` entries** (32/37 chapters distilled) |

Honest line: queryable engineering reference in hosted MCP, updated per release — not the
345-page print/PDF and not automatic Catch rules. Bookstore PDF may stay separate on Digistore24.

## Lemon Squeezy products (founder creates)

| LS product name | Variant | Activations | License | In `LUMO_LS_PRODUCT_IDS`? |
| --- | --- | --- | --- | --- |
| Lumo Agent Core | Annual 39 EUR | 1 | Yes (download entitlement) | **No** |
| Lumo Agent Pack | Annual 99 EUR | 1 | Yes (download entitlement) | **No** |
| Lumo Freelancer | Annual 149 EUR | **1** | Yes | **Yes** |
| Lumo Pro | Annual 199 EUR / seat | **1** per seat key | Yes | **Yes** |
| Lumo Agency | Annual 599 EUR | **20** | Yes | **Yes** |

Checkout copy anchors: see `agent-core.md`, `agent-pack.md`, `freelancer-pack.md`,
`pricing-personas.md`. Connect page: `GET /connect` on the Pro host (payers).

## Who runs what technically

| Buyer | MCP | Knowledge source |
| --- | --- | --- |
| Free | `npx … lumo-mcp` local | Free snapshot in npm package |
| Agent Core / Pack only | local Free MCP + kit files | Snapshot + agent/skill patterns |
| Freelancer / Pro / Agency | `https://mcp.unleash-wp.com/mcp` + Bearer LS key | **Pro SQLite on UnleashWP host only** |

## Specs

- Agent Core: [agent-core.md](./agent-core.md)
- Agent Pack: [agent-pack.md](./agent-pack.md)
- Freelancer: [freelancer-pack.md](./freelancer-pack.md)
- Personas: [pricing-personas.md](./pricing-personas.md)
- Go-live: [go-live-final.md](./go-live-final.md) (canonical), [go-live-48h.md](./go-live-48h.md)
- Harmony + paid gate: lumo-pro `docs/product-harmony.md`
- Server load: lumo-pro `docs/server-load.md`
- LS go-live: lumo-pro `docs/licensing-runbook.md`
