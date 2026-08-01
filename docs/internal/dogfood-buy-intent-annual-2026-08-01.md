# Dogfood buy intent — annual license (2026-08-01)

English product artifact. Simulated buyer panel: would each persona **buy the annual
license NOW**, given the product as it stands on `release/v1.0.0-go-live` after
recent upgrades (agents+skills via Pro MCP, honesty copy, locked ladder).

**Method:** Same four buying personas as [dogfood-persona-feedback-2026-08-01.md](./dogfood-persona-feedback-2026-08-01.md).
CEO is shipper lens only, not scored as a buyer. Checkout / hosted MCP / Lemon
assumed Day-0-complete for the **offer** evaluation (personas do not invent live
LS product IDs). Facts from [website-pricing-table.md](./website-pricing-table.md),
[BESTSELLER-BAR.md](./BESTSELLER-BAR.md), [agent-pack.md](./agent-pack.md),
`/connect` messaging, and Pro MCP agent-kit tools.

**What changed since morning dogfood (material to buy intent):**

- Paid hosted seats serve living Agent Team + skills via MCP:
  `lumo_list_agents` / `lumo_get_agent` / `lumo_list_skills` / `lumo_get_skill`
  (not zip-only delivery).
- Agents are `uwp-*` (6); skills 9 categorized; ClaudeKit-style presentation.
- Forge Hosted = entitlement honesty locked; Agent Team secondary “files only”
  + Team seat helper locked; Core-sourced USP locked.
- Money-back remains **14 days** (not 30). No hosted trial. Free = local proof.
- WP 7.1 iframe coverage expanding — no “Ready for 7.1” claim.

---

## Kurzfassung (DE) — für Benjamin

**Vier Käufer, Angebot als wäre Checkout live:** Kaufbereitschaft ist da.
Score: **4 / 4** sind **YES** oder **LEAN YES**. Kein harter NO.

| Persona | Jahreslizenz jetzt? | SKU |
| --- | --- | --- |
| Freelancer | **YES** | Solo Hosted 149 ★ |
| Entwickler | **LEAN YES** | Free → Solo Hosted 149 (oder Agent Team 99 files-only) |
| Abteilungsleiter | **LEAN YES** | Pro 199/seat |
| Agentur-Chef | **YES** | Team 20 · 599 |
| CEO (nicht Käufer) | Ship Solo Hosted als Hero | — |

**Was die neuen MCP-Agent/Skill-Tools bewegen:** Hosted-Seats sind nicht mehr
„DB + Zip separat“. Roster lebt über Bearer — das hebt Solo/Pro/Team 20 gegen
Agent Team 99 und senkt Ops-Friction bei Agentur/Abteilung. Forge Hosted bleibt
Entitlement-only; ehrlich kommuniziert, aber kein Kauf-Treiber.

**Was noch blockiert (nicht Preis):** Day-0 LS + Deploy (founder); Abteilungsleiter
braucht Free-LOUD-Beweis + 14-Tage-MB / Dogfood-Key für Finance; Briefing #1 /
Knowledge-Cadence fehlen für Retention (nicht für Erstkauf).

Canonical: [website-pricing-table.md](./website-pricing-table.md) §11 ·
[sales-ready-checklist.md](./sales-ready-checklist.md) ·
[BESTSELLER-BAR.md](./BESTSELLER-BAR.md).

---

## Scoring keys

| Label | Meaning |
| --- | --- |
| **YES** | Would pay annual this week if checkout works |
| **LEAN YES** | Would pay; one soft blocker (finance proof, Free-first habit, 14-day window) |
| **MAYBE** | Job fit unclear or trust/ops gap still dominates |
| **NO** | Would not buy this offer as stated |

---

## 1. Freelancer — Solo Hosted / Starter buyer

**Would buy annual?** **YES**

**SKU:** **Solo Hosted 149 €/yr** (budget fallback: Starter 39 only if files-curious and no live Cursor catalogue)

**Why:**
- Best Value card matches the job: live MCP (ACF/Woo/GF) + full kit + Vol.1, one seat, no CI tax.
- **NEW:** agents+skills via MCP on the paid seat — no zip dance for Cursor; living `uwp-*` roster beats frozen Agent Team files at +50 € over 99.
- Free `demo` + quiet ≠ clean already bought trust; 14-day MB is enough for a solo invoice.

**Still blocks / friction (does not kill YES):**
- Forge Hosted entitlement without live install — accepted if copy stays honest; not a reason to skip Solo.
- Dual LS/www names on the invoice (Freelancer vs Solo Hosted).

**Flip to stronger YES (already YES):** optional 60 s Solo LOUD screenshot on pricing; keep Agent Team clearly secondary so they never stop at 99.

---

## 2. Entwickler — Free → Pack / Solo

**Would buy annual?** **LEAN YES** (after Free Aha; not day-one without `demo`)

**SKU:** Primary **Solo Hosted 149** if live plugin catalogue needed; **Agent Team 99** only for files-only shops; Starter 39 if tiny entry.

**Why:**
- Free local trial is the honest wedge; freeze story + 402 without key is clear loss aversion.
- **NEW:** once on a hosted seat, `lumo_list_agents` / `lumo_get_skill` means the specialist team is not a second install project — that tips many developers past Agent Team 99 straight to Solo.
- Trust axis remains highest: quiet ≠ clean matches how careful WP engineers think.

**Still blocks LEAN (not full YES):**
- Habit: prove Free first; annual is post-Aha, not impulse.
- npm `0.4.x` vs go-live branch `check` residual confusion until npm catches release.
- Agent Team 99 still tempts if they misread “team” as people/hosted (secondary copy must stay loud).

**Flip LEAN → YES:** one-click Free path from pricing; after LOUD Aha, single line “need live ACF/Woo → Solo Hosted (agents+skills on MCP, Pack included).”

---

## 3. Abteilungsleiter — Pro seats

**Would buy annual?** **LEAN YES**

**SKU:** **Pro 199 €/seat/yr** (Solo Hosted only if no CI requirement; Team 20 from ~4 seats)

**Why:**
- CI merge gate is the non-negotiable job; unlicensed Action stays green and says gate did not run — matches fear of silent pass.
- +50 € over Solo for CI is defensible; seat helper (1–3 Pro, Team 20 from ~4) is now on the ladder.
- **NEW:** seats get living agents/skills via MCP — rollout to the team is Bearer + `/connect`, not zip distribution + frozen kit date.

**Still blocks full YES:**
- No hosted trial by design — finance needs Free LOUD proof + **14-day money-back** and/or founder dogfood key (not 30 days).
- Seat deactivate / second-machine story still Week-1-ish; procurement asks once.
- Vol.1 “living lookups ≠ PDF” must stay visible at checkout or they fear buying a book again.

**Flip LEAN → YES:** founder-shared dogfood key or 60 s Free+Solo/Pro LOUD clip for finance; 14-day MB restated on every LS Pro page; one sentence on seat = one activation.

---

## 4. Agentur-Chef — Team 20

**Would buy annual?** **YES**

**SKU:** **Team 20 · 599 €/yr**

**Why:**
- Seat math still wins hard (~30 €/seat/yr vs Pro 199); Pack + CI + Vol.1 included; do-not-buy-twice is correct.
- **NEW:** MCP-served agents/skills for up to 20 seats is the ops close — one shop license, living roster, no zip fleet.
- Forge Hosted honesty accepted; Team 20 remains default agency close.

**Still blocks / friction (does not kill YES):**
- CI secrets in every client repo = real ops cost (state on card or sales call, not a price cut).
- Multi-seat activation must smoke on Day-0; persona assumes it works for this offer score.
- LS “Agency” vs website “Team 20” naming for finance — glossary must sit next to invoice.

**Flip stronger YES:** Day-0 two-machine seat smoke green; seat helper line visible on www Teams block.

---

## 5. CEO — shipper lens (not a buyer)

**Not scored in the 4/4.**

**Ship call:** Solo Hosted ★ as primary CTA; Pro as CI upsell; Team 20 as agency SKU; Agent Team secondary files-only. Do not claim Ready for WP 7.1. Do not sell Forge Hosted as live install. Revenue = 0 until founder Day-0 (LS + deploy + www paste). Buy-intent above assumes that path is done for **offer** evaluation only.

---

## Scoreboard

| Metric | Result |
| --- | --- |
| Buyers scored | 4 |
| **YES** | 2 (Freelancer, Agentur-Chef) |
| **LEAN YES** | 2 (Entwickler, Abteilungsleiter) |
| **MAYBE / NO** | 0 |
| **YES + LEAN YES** | **4 / 4** |

**Honest read:** The offer converts all four buying personas on intent. Revenue and finance proof still sit on founder Day-0 and Abteilungsleiter evidence substitutes — not on price or missing agents-via-MCP.

---

## What would still flip residual soft blockers (cross-persona)

| Blocker | Who | Fix (not a price change) |
| --- | --- | --- |
| Checkout / hosted not live | All | Founder Day-0 LS + Mittwald + smoke |
| No hosted trial | Abteilungsleiter | Free LOUD + 14-day MB + dogfood key / screenshot |
| Agent Team name trap | Freelancer, Entwickler | Keep “files only / dead end for live catalogue” loud |
| Forge Hosted not installable | All hosted | Keep entitlement wording; do not “fix” on www |
| Briefing #1 missing | Retain (post-buy) | Week-1 cadence — not required for first annual YES |

No price change in this pass. 14-day money-back stays locked.
