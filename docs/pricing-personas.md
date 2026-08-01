# Pricing that keeps the buying panel happy

English. Prices are annual. Lemon Squeezy owns checkout.

## Tiers (locked 2026-08-01)

| Tier | Price | Seats | Who smiles |
| --- | --- | --- | --- |
| **Lumo Free** | 0 € | Local only | Taste on **their** machine — **no hosted MCP** |
| **Agent Core** | **39 €**/yr | 1 download | Price-sensitive solos — 2 agents (not the full team) |
| **Lumo Agent Pack** | **99 €**/yr | 1 download | Kit buyers — full agents + skills + commands |
| **Freelancer** | **149 €**/yr | 1 | **Hosted** Pro MCP · Agent Pack · **Vol.1 lookups** · **Forge Hosted** · no CI |
| **Lumo Pro** | **199 €**/yr | per seat | Senior + DevOps (+ **CI Action**) · Pack · **Vol.1 lookups** · **Forge Hosted** |
| **Agency** | **599 €**/yr | **20** | Agency chef · Pack · **Vol.1 lookups** · **Forge Hosted** (same entitlement as Freelancer/Pro) |

Specs: [packages.md](./packages.md), [agent-core.md](./agent-core.md), [agent-pack.md](./agent-pack.md), [freelancer-pack.md](./freelancer-pack.md).

**Why Agent Core 39 €:** 99 € is steep for some. Core = Currency Guard + Code Reviewer only — clear step under Pack, not a dead 49 € middle.

**Why Agent Pack 99 €:** full team, ClaudeKit-style self-install, near-zero host cost.

**Why Freelancer 149 €:** +50 € over Pack buys live hosted MCP + Vol.1 living lookups.

**Vol.1 placement:** 69 reference-lane `book-*` entries via `lumo_lookup` on hosted seats.
Free teaser only. Core/Pack = no book corpus. PDF bookstore may stay separate.

## Ladder

```
Free (local) → Agent Core 39 € → Agent Pack 99 € → Freelancer 149 € (hosted) → Pro 199 € → Agency 599 €
```

**Hosted MCP = paid only.** Free / Core / Pack never use `mcp.unleash-wp.com`.

## Persona → offer

| Persona | Happy path | Do not |
| --- | --- | --- |
| Agency chef | Agency (20 seats) · Pack already in | Upsell Core/Pack twice |
| Senior Dev | Free → Freelancer or Pro | Hide Cursor rule |
| DevOps | Pro/Agency for Action | Sell Core as “has CI” |
| Security lead | Non-goals in writing | AppSec SKU |
| Freelancer (budget) | **Agent Core 39** then Pack 99 | Jump to 199 before proof |
| Freelancer (Cursor live) | Freelancer 149 | Promise MCP in Core |
| Kit buyer | Agent Pack 99 | Call Core “the team” |

## Server cost

- Free = €0 on your host
- Core / Pack = zip — almost €0 per buyer
- Hosted MCP = Freelancer / Pro / Agency only
- Community Free tokens → **402** on hosted

## Decision log

- 2026-08-01: Skills 19 € / Freelancer 39 € retired.
- Starter 49 € killed (dead middle); **Agent Core 39 €** added as real entry under Pack 99.
- Buyer panel: Pack 99 · Freelancer 149 · Pro 199 · Agency 599 (20 seats).
- One global price — no PPP. India/LATAM often stay Free or Core.
