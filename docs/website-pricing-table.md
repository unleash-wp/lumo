# Website pricing table

English. Paste source for www, `/connect`, and checkout. Locked 2026-08-01.

**Rules:** [packages.md](./packages.md) · **Homepage:** [website-sell-sheet.md](./website-sell-sheet.md) · Re-measure catalogue counts from code before publishing on www.

---

## Name glossary

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

## Above the fold

**Hero:** WordPress knowledge from Core changes, with wrong→correct, source, and version.

| Starter 39 | **Solo Hosted 149 ★ Best Value** | Pro 199/seat |
| --- | --- | --- |
| 2 agents · files | Live MCP + full kit + Forge Hosted entitlement* | Same + **CI gate** |

> **Files only?** [Agent Team 99 €](#agent-team) · no hosted MCP (402). Live ACF/Woo/GF → **Solo Hosted 149** (Pack included).

> **Free · 0 €.** `npx @unleashwp/lumo demo`. Local watcher, no hosted MCP. Go-live candidate: `npx -y github:unleash-wp/lumo#release/v1.0.0-go-live`.

> **Team 20 · 599 €/yr.** 20 seats · Pack · Vol.1 · CI · Forge Hosted*. Pro for 1–3 CI seats; Team 20 from ~4 (3×199 ≈ 599).

---

## Compact matrix

Limits: [sell-sheet § Hosted MCP limits](./website-sell-sheet.md#hosted-mcp-limits). Coverage: live Pro catalogue ([packages.md](./packages.md)).

| | Free | Starter | Agent Team | **Solo Hosted ★** | Pro | Team 20 |
| --- | --- | --- | --- | --- | --- | --- |
| Local watcher | ● | ● | ● | ● | ● | ● |
| Agent files (2/6) | ○ | 2 | 6 | 6 | 6 | 6 |
| Hosted MCP + live catch | ○ | ○ | ○ | ● | ● | ● |
| Vol.1 lookups (69) | ○ | ○ | ○ | ● | ● | ● |
| Forge self-host | ● | ● | ● | ● | ● | ● |
| Forge Hosted* | ○ | ○ | ○ | ● | ● | ● |
| CI merge gate | ○ | ○ | ○ | ○ | ● | ● |
| WP 7.1 pack | ○ | ○ | ○ | gap | gap | gap |
| Seats | — | 1 dl | 1 dl | 1 | /seat | 20 |

● included · ○ not · ~ Free snapshot

---

## Card copy

### Starter — 39 €/yr

Two agents on disk (Currency Guard + Code Reviewer). Scaffold skills, `/wp-review`. No hosted MCP.

**CTA:** Get Starter

### Solo Hosted ★ — 149 €/yr

Live MCP, plugin advice, full Pack included, Vol.1, 1 seat, Forge Hosted*. Best Value for Cursor solos. No CI.

**CTA:** Get Solo Hosted

### Pro — 199 €/seat/yr

Solo Hosted + CI gate. Unlicensed Action stays green, says gate did not run. 14-day money-back when checkout is live.

**CTA:** Get Pro

<span id="agent-team"></span>

### Agent Team — 99 €/yr

Six agents + 9 skills on disk. No hosted MCP. Live catalogue → Solo Hosted 149 (Pack included).

**CTA:** Get Agent Team

### Team 20 — 599 €/yr

20 seats, Pack, Vol.1, CI, Forge Hosted*. Starter and Agent Team included.

**CTA:** Get Team 20

### Free — 0 €

`npx @unleashwp/lumo demo`. Local snapshot, no hosted catalogue.

**CTA:** Install Free

---

## Footnotes

1. Free / Starter / Agent Team → **402** on `mcp.unleash-wp.com`.
2. Vol.1 = 69 `lumo_lookup` entries. Not PDF. Not Catch.
3. Pattern watcher, not AppSec or pentest.
4. Unlicensed CI: green, gate **did not run**.
5. No “Ready for WP 7.1.” Coverage expanding.
6. Lumo ≠ `WordPress/agent-skills`.
7. **Forge Hosted*** = entitlement only; install **not live**.
8. **14-day money-back** when Lemon Squeezy checkout is live.

**Layout:** Solo Hosted starred · Agent Team secondary · Team 20 outside solo row · glossary at checkout.

---

## Checkout wire

| Website | LS product | In `LUMO_LS_PRODUCT_IDS`? |
| --- | --- | --- |
| Starter | Agent Core · 39 EUR | No |
| Agent Team | Agent Pack · 99 EUR | No |
| Solo Hosted | Freelancer · 149 EUR | **Yes** |
| Pro | Lumo Pro · 199 EUR | **Yes** |
| Team 20 | Agency · 599 EUR · 20 act. | **Yes** |

Free `demo` = trial. No hosted trial keys.
