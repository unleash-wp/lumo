# Pricing that keeps the buying panel happy

English. Prices are annual. Lemon Squeezy owns checkout.
Lead with **website names**; LS / internal names in parentheses.

## Name glossary

| Website name | LS / internal | Price |
| --- | --- | --- |
| Free | Lumo Free | 0 € |
| **Starter** | Agent Core | 39 €/yr |
| **Agent Team** | Agent Pack | 99 €/yr |
| **Solo Hosted** ★ | Freelancer | 149 €/yr |
| **Pro** | Lumo Pro | 199 €/seat/yr |
| **Team 20** | Agency | 599 €/yr |

## Tiers (locked 2026-08-01)

| Website name | Price | Seats | Who smiles |
| --- | --- | --- | --- |
| **Free** | 0 € | Local only | Taste on **their** machine — **no hosted MCP** |
| **Starter** (Agent Core) | **39 €**/yr | 1 download | Price-sensitive solos — 2 agents (not the full team) |
| **Agent Team** (Agent Pack) | **99 €**/yr | 1 download | Kit buyers — full agents + skills + commands · **files only** |
| **Solo Hosted** ★ (Freelancer) | **149 €**/yr | 1 | **Hosted** Pro MCP · Agent Team included · **Vol.1 lookups** · Forge Hosted entitlement (install not yet available) · no CI |
| **Pro** | **199 €**/yr | per seat | Senior + DevOps (+ **CI Action**) · Pack · **Vol.1 lookups** · Forge Hosted entitlement |
| **Team 20** (Agency) | **599 €**/yr | **20** | Agency chef · Pack · **Vol.1 lookups** · Forge Hosted entitlement · CI |

**Seat helper:** Pro for **1–3** seats with CI; **Team 20** from about **4** seats or one shop license (3×199 ≈ 599).

Specs: [packages.md](./packages.md), [agent-core.md](./agent-core.md), [agent-pack.md](./agent-pack.md), [freelancer-pack.md](./freelancer-pack.md), [sales-ready-checklist.md](./sales-ready-checklist.md).

**Why Starter 39 €:** 99 € is steep for some. Starter = Currency Guard + Code Reviewer only — clear step under Agent Team, not a dead middle.

**Why Agent Team 99 €:** full team on disk, self-install, near-zero host cost. **Not** live MCP — need live catalogue → **Solo Hosted 149**.

**Why Solo Hosted 149 € (hero ★):** +50 € over Agent Team buys live hosted MCP + Vol.1 living lookups. Best Value for Cursor solos.

**Vol.1 placement:** 69 reference-lane `book-*` entries via `lumo_lookup` on hosted seats.
Free teaser only. Starter/Agent Team = no book corpus. PDF bookstore may stay separate.

## Ladder

```
Free (local) → Starter 39 € → Agent Team 99 € → Solo Hosted 149 € (hosted) → Pro 199 € → Team 20 · 599 €
```

**Hosted MCP = paid only.** Free / Starter / Agent Team never use `mcp.unleash-wp.com`.

## Persona → offer

| Persona | Happy path | Do not |
| --- | --- | --- |
| Agency chef | **Team 20** (20 seats) · Pack already in | Upsell Starter/Agent Team twice |
| Senior Dev | Free → **Solo Hosted** or **Pro** | Hide Cursor rule |
| DevOps | **Pro** / **Team 20** for Action | Sell Starter as “has CI” |
| Security lead | Non-goals in writing | AppSec SKU |
| Freelancer (budget) | **Starter 39** then Agent Team 99 | Jump to 199 before proof |
| Freelancer (Cursor live) | **Solo Hosted 149** ★ | Stop at Agent Team 99 when they need live MCP |
| Kit buyer | **Agent Team 99** (files only) | Call Starter “the team” |

## Server cost

- Free = €0 on your host
- Starter / Agent Team = zip — almost €0 per buyer
- Hosted MCP = Solo Hosted / Pro / Team 20 only
- Community Free tokens → **402** on hosted

## Decision log

- 2026-08-01: Skills 19 € / Freelancer 39 € retired.
- Starter 49 € killed (dead middle); **Agent Core / Starter 39 €** added as real entry under Pack 99.
- Buyer panel: Pack 99 · Freelancer 149 · Pro 199 · Agency 599 (20 seats).
- One global price — no PPP. India/LATAM often stay Free or Starter.
- Website names first; LS names for invoice / env only.
