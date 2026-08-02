# Website sell sheet

English. Paste source for www, pricing, and checkout. Locked ladder 2026-08-01. Quotas from shipped MCP defaults.

**Related:** [packages.md](./packages.md) · [website-pricing-table.md](./website-pricing-table.md)

## Sales story

**Free:** Install the Lumo plugin in [AI Forge](https://github.com/unleash-wp/ai-forge). Local snapshot watcher on `uwp mcp`. No hosted MCP.

**Paid:** Hosted done for you on `mcp.unleash-wp.com`: live catalogue, full Agent Pack, MCP link for Cursor/Claude, and CI on Pro/Team 20. Forge Hosted is included on paid hosted seats when that install ships.

**File packs (Starter 39, Agent Team 99):** Specialist agents as files on disk only. No hosted MCP. If you need live ACF/Woo/GF advice in the editor, buy Solo Hosted (Pack is already included there).

14-day money-back on paid SKUs once Lemon Squeezy checkout is live.

---

## Prices

Global EUR. No PPP.

| Website | LS name | Price | Hosted MCP |
| --- | --- | --- | --- |
| Free | Lumo Free | 0 € | Never |
| Starter | Agent Core | 39 €/yr | Never |
| Agent Team | Agent Pack | 99 €/yr | Never |
| Solo Hosted ★ | Freelancer | 149 €/yr · 1 seat | Yes |
| Pro | Lumo Pro | 199 €/seat/yr | Yes |
| Team 20 | Agency | 599 €/yr · 20 seats | Yes |

Ladder: Free → Starter 39 → Agent Team 99 → Solo Hosted 149 → Pro 199 → Team 20 · 599

Rules: full Agent Pack is included in Solo Hosted / Pro / Team 20 (never double-sell). Starter and Agent Team never unlock the Pro host. No self-hosted Pro MCP.

---

## Feature matrix

| Feature | Free | Starter | Agent Team | Solo Hosted | Pro | Team 20 |
| --- | --- | --- | --- | --- | --- | --- |
| Lumo as Forge plugin | Yes | — | — | — | — | — |
| Local Catch / lookup | Yes | Via Free | Via Free | — | — | — |
| Specialist agents on disk | — | 2 | 6 + skills | Pack incl. | Pack incl. | Pack incl. |
| Hosted Pro MCP | No | No | No | Yes | Yes | Yes |
| Live plugin advice | No | No | No | Yes | Yes | Yes |
| Vol.1 living lookups (69) | No | No | No | Yes | Yes | Yes |
| MCP link (Cursor / Claude) | Local | — | — | Hosted | Hosted | Hosted |
| GitHub Action CI | No | No | No | No | Yes | Yes |
| Forge Hosted entitlement | No | No | No | Yes* | Yes* | Yes* |

\*Included on the license. Hosted Forge install is not available yet.

Agent Team roster: Currency Guard, Code Reviewer, Woo Specialist, Plugin Specialist (ACF, GF, Elementor, Meta Box, Carbon, CF7), Security Auditor, Release Engineer. Starter ships the first two only.

---

## Hosted MCP limits

Per license key. Soft warn near 70% of daily budget. Hard stop = HTTP 429 and an explicit *check did not run* message.

| Plan | Requests / day | Requests / min | CI | Seats |
| --- | --- | --- | --- | --- |
| Solo Hosted | 1 500 | 30 | No | 1 |
| Pro | 5 000 | 60 | Yes | 1 per key |
| Team 20 | 20 000 | 120 | Yes | 20 |

Free, Starter, and Agent Team send zero bytes to the Pro host. Catch input/output caps are disclosed when they apply.

---

## Forge and Lumo

AI Forge is the local host (changelog, scaffold, plugin shelf). Lumo Free is a Forge plugin plus the `@unleashwp/lumo` catch engine. Lumo Pro is a separate hosted MCP you add in your editor with a paid license. Forge handles wp.org tooling; Lumo handles curated wrong→correct patterns and catch. They run alongside each other, not as replacements.

Changelog/Contributors mirror for hosted Forge: planned ([ai-forge#24](https://github.com/unleash-wp/ai-forge/issues/24)). Do not sell it as finished.

---

## Do not claim on www today

Hosted Forge UI/install · self-hosted Pro MCP · lifetime license · “Ready for WP 7.1” badge · AppSec or pentest · quiet = clean

Coverage is pattern-based from Core and major plugin releases, not every API of every plugin. Re-measure catalogue counts from code before publishing numbers on www.
