# Dogfood — daily MCP request quota panel (2026-08-01)

English product artifact. Simulated buying / usage panel on **proposed daily
MCP request limits per license key**. Same four close personas as prior dogfood
sets. Does **not** change locked website prices. Quota numbers =
**FOUNDERS-DECIDE** (§6–7).

**Method:** Each persona is told: hosted MCP on Benjamin’s server; annual seats;
file packs (R2) = zero MCP load; seats = Lemon activations (installations), not
humans; **daily quota = hard brake against key sharing**. Proposed table is
tested as written. Usage intuition given before scoring.

**Proposed table under test (FOUNDERS-DECIDE numbers):**

| Plan | Requests/day | /min | CI (GitHub Action) |
| --- | --- | --- | --- |
| Solo Hosted | 1 500 | 30 | no |
| Pro | 5 000 | 60 | yes (+ optional CI budget 2 000) |
| Team 20 | 20 000 | 120 | yes |

**When hit:** HTTP 429, English *“This check did not run (daily quota).”*
Never silent clean.

**Rough usage intuition shown to personas:**

- 1 Cursor tool call ≈ 1 request; a chat turn may be several
- 1 PR with N PHP/JS files ≈ N Action requests
- 1 500/day ≈ ~60 files/day if all CI, or many editor checks
- Key shared by 10 people burns the bucket together

---

## Kurzfassung (DE) — für Benjamin

**Blunt:** Tageslimit ist **erwartet und willkommen** als Anti-Sharing-Bremse.
Die vorgeschlagenen Zahlen halten dem Panel stand — mit einer klaren Warnung
bei Team 20 und einer Produktdeutlichkeit bei Pro-CI.

| Was das Panel gesagt hat | Folge |
| --- | --- |
| Daily limit = normales SaaS-MCP | Ship hard stop + sichtbarer 429-Text |
| Solo **1 500** | **OK** (Freelancer). Als Shared-Key für 3–10 Leute **TOO LOW** — genau der Point |
| Pro **5 000** | **OK** für 1 Seat + moderates CI. Abteilungsleiter will **Soft-Warn @ 70 %** und Klarheit: CI-Budget 2 000 *innerhalb* oder *zusätzlich*? |
| Team **20 000** | Agentur-Chef: **OK bis knapp**. Bei echtem Shop (viele Editoren + CI über Client-Repos) eher **TOO LOW** → Push auf **25–30 k** *oder* Soft-Warn + Upgrade-Pfad |
| Key sharen? | Ja, **wenn** Quota hoch genug. Niedrige Solo-/Pro-Caps **ändern Verhalten** Richtung zweiter Seat / Team / Pack |
| Soft warn vs hard only | **Soft @ 70 % → hard @ 100 %** einstimmig bevorzugt |
| Solo ohne CI + niedriger Cap vs Pro mit CI | Leiter funktioniert. Solo-CI-Gate muss Code matchen Marketing |

**Empfohlene Ship-Zahlen (Panel-adjusted):**

| Plan | Requests/day | /min | CI |
| --- | --- | --- | --- |
| Solo Hosted | **1 500** (lock) | 30 | no (enforce) |
| Pro | **5 000** (lock) | 60 | yes; CI sub-budget **2 000 inside** the 5 000 day (not additive) |
| Team 20 | **25 000** (panel nudge) *or keep 20 000 if you want the harder brake* | 120 | yes |

**FOUNDERS-DECIDE:** §7 — empfohlen **lock Solo 1 500 / Pro 5 000**, Team
entweder **20 000 lock** (härtere Bremse) oder **25 000** (weniger Support-Noise).
Soft-Warn 70 % + Solo-CI-Gate = P0, nicht optional.

---

## Scoring keys

| Label | Meaning |
| --- | --- |
| **OK** | Would accept this day cap on the plan they would buy |
| **TOO LOW** | Would hit often, complain, churn, pirate, or force upgrade in a way that feels punitive |
| **TOO HIGH** | Cap so loose that key sharing stays attractive / load risk returns |

---

## Matrix — Persona × Solo 1 500 / Pro 5 000 / Team 20 000

| Persona | Solo 1 500 | Pro 5 000 | Team 20 000 | Plan of choice |
| --- | --- | --- | --- | --- |
| Freelancer | **OK** | TOO HIGH *for their need* (would not buy) | TOO HIGH / irrelevant | Solo Hosted |
| Entwickler | **OK** if honest solo; **TOO LOW** if shop shares one Solo key | **OK** if they own CI | **OK** as agency ceiling | Free → Solo *or* Pack; Pro if merge duty |
| Abteilungsleiter | TOO LOW for dept + CI (correct: buy Pro) | **OK** (1–2 active + moderate PR volume) | **OK** if dept grows | Pro 199/seat |
| Agentur-Chef | TOO LOW / anti-abuse (good for seller) | TOO LOW as *agency shared key* | **OK → leicht TOO LOW** under heavy CI | Team 20 · 599 |

Read **TOO LOW on Solo for Entwickler/Agentur** as *success of the brake*, not
a reason to raise Solo.

---

## 1. Freelancer

**Job:** Cursor catch on client work; one annual invoice; no CI.

### Q1 — Daily limit acceptable / expected?

**Yes.** Hosted SaaS MCP without a day ceiling feels like someone else’s bill.
Expected if the 429 text is honest (*did not run*), not a fake clean.

### Q2 — Number for their plan (Solo 1 500)?

**OK.** Solo editor use: dozens of tool calls/day, not hundreds of CI files.
1 500 ≈ headroom. Would feel **TOO LOW** only under ~800 if they live in
multi-turn agent loops all day — rare for this persona.

**Pro 5 000 / Team 20 000:** not their buy. Numbers feel **TOO HIGH** relative
to Solo (good ladder pressure).

### Q3 — Share one key across a team?

**No team.** Might paste key to one contractor once. At 1 500, sharing with a
second heavy user **hurts both** → they stop or tell contractor to get Solo.
Limit **does** change that casual share.

### Q4 — Churn / downgrade / pirate vs upgrade thresholds

| Daily number (Solo-shaped) | Behaviour |
| --- | --- |
| &lt; ~800 | Complain / consider Pack 99 or Free local |
| 1 500 | Stay / buy Solo |
| ≥ ~4 000 on Solo | Would not pay more for headroom alone; upgrade only for **CI** (Pro) |

Pirate: low interest (one machine). Downgrade path = Pack/Free, not cracked key.

### Q5 — Soft warn @ 70 % then hard stop, or hard only?

**Soft then hard.** One English notice in the tool answer at 70 %, then 429.
Hard-only feels abrupt on a busy client day.

### Q6 — Solo without CI + lower day cap vs Pro with CI

**Correct product.** They do not want to pay for CI. Lower Solo cap + no CI
reinforces “I bought the right SKU.” Pro’s higher cap is irrelevant noise.

**Verdict:** Lock Solo **1 500** / **30/min**. Ship soft-warn.

---

## 2. Entwickler (agency / mid-level)

**Job:** Prove watcher on bait PHP/`block.json`; then files vs hosted; sometimes
merge duty.

### Q1 — Daily limit acceptable / expected?

**Yes if published.** Hidden caps that look like “clean” = trust kill. Visible
quota + *did not run* = fine.

### Q2 — Number for plan of choice?

- **Solo 1 500:** **OK** for one honest Cursor user. **TOO LOW** the moment the
  shop pastes one Solo key into five `mcp.json`s — and they *know* shops do that.
- **Pro 5 000:** **OK** if they are the CI owner on 1–2 repos (≈ tens of files/day,
  not hundreds). Optional CI budget 2 000: **OK** if it is a **sub-cap** of the
  day, not a surprise second meter they must math.
- **Team 20 000:** **OK** as the “stop sharing Solo” ceiling the lead will buy.

### Q3 — Share one key if quotas allow?

**Yes, they would try** — Pack already taught them shareability. With today’s
loose **8 000** paid default in their head, one Pro/Solo key for the pod is
tempting. At **1 500 Solo** they tell the lead: buy seats or Team. **Limit
changes behaviour.** At **5 000 Pro** still some 2–3 person share risk; soft
warn makes the share visible before the hard stop.

### Q4 — Churn / pirate / upgrade thresholds

| Situation | Behaviour |
| --- | --- |
| Solo shared, hits 1 500 mid-day | Upgrade path (second Solo / Pro / Team) or Pack copy for non-MCP work |
| Pro hits 5 000 often with real CI | Team 20 or second seat — not pirate first |
| Solo raised to ≥ ~5 000 without CI gate | **Pirate/share wins**; seller loses |

Churn trigger: opaque 429 without “quota / did not run”, or Solo sold *with*
CI marketing then blocked silently.

### Q5 — Soft warn vs hard only?

**Soft @ 70 % → hard.** They want to finish the PR without a surprise red wall.

### Q6 — Solo no CI + lower cap vs Pro with CI

**Clear ladder.** Solo = editor hosted. Pro = pay for Action. They will still
test a Solo key in Action once; **code must refuse** with *CI not on this plan /
did not run*, not a soft clean.

**Verdict:** Keep Solo low. Pro 5 000 OK. Enforce Solo CI gate.

---

## 3. Abteilungsleiter

**Job:** Merge gate on WordPress PRs; hosted depth; budget per seat; finance proof.

### Q1 — Daily limit acceptable / expected?

**Expected.** Procurement likes a published fair-use line. Unmetered “unlimited
MCP” on a cheap seat is a red flag, not a feature.

### Q2 — Number for Pro 5 000?

**OK** for **one Pro seat** used by one merge owner + moderate PR volume
(e.g. 5 PRs × ~10 files = 50 Action calls, plus editor checks).

**TOO LOW** if finance buys **one Pro key for five humans** (they might still
try). That pain is the correct upgrade nudge to more seats or Team 20.

Solo 1 500: **TOO LOW** for dept job (correct — they should not buy Solo).
Team 20 000: **OK** when the dept is folded into agency SKU.

**CI budget 2 000:** Wanted as **named sub-budget inside 5 000**, disclosed on
`/connect` and in Action docs. Additive 5 000+2 000 feels like marketing fog.

### Q3 — Share one key across the team?

**Would share if quota allows and seats are “activations not humans.”** At
5 000/day, sharing across a five-person WordPress pod **will** trip the cap on
busy merge weeks → they either buy more Pro seats or Team. **Limit changes
behaviour** toward honest seat count. Without a day cap, one key for the dept
is the default cheat.

### Q4 — Churn / downgrade / pirate vs upgrade

| Daily Pro-shaped number | Behaviour |
| --- | --- |
| ≤ ~2 500 with real CI | Feel punished → churn risk or Pack fallback for “good enough” |
| **5 000** | Stay on Pro; upgrade when soft-warn fires often |
| Hits 5 000 weekly | **Upgrade** to Team 20 / more seats (desired) |
| ≥ ~12 000 on a single Pro seat | Cap **TOO HIGH** — dept shares one key again |

Pirate: low if checkout + seats work. Downgrade: Solo only if CI duty removed.

### Q5 — Soft warn vs hard only?

**Soft warn @ 70 % then hard stop — non-negotiable preference.** Hard-only on a
release Friday = support ticket + trust hit. Warn must be **front of answer**,
English, once per run.

### Q6 — Solo without CI + lower day cap vs Pro with CI

**This is the buy story.** Solo’s lower cap + no CI is what they point at in
budget reviews: “We need Pro for the gate.” If Solo Action still works in code,
the story collapses.

**Verdict:** Lock Pro **5 000** / **60/min**, CI sub-budget **2 000 inside**,
soft-warn P0, Solo CI enforce P0.

---

## 4. Agentur-Chef

**Job:** One license for the shop; seats for developers; CI on client repos.

### Q1 — Daily limit acceptable / expected?

**Yes — they want it on the cheap SKUs.** A high Solo/Pro day cap is how
agencies steal Team 20. Fair-use on Team itself is acceptable if published.

### Q2 — Number for Team 20 000?

**OK → lightly TOO LOW** under honest heavy use: ~10 active Cursor users ×
multi-call turns + CI across several client repos can chew 20 k on a busy day.
Not every day — but the first agency support week will include “we hit the
wall.”

| Panel feel | Number |
| --- | --- |
| Anti-abuse floor (don’t go below) | ~15 000 |
| Comfortable shared agency day | **25 000–30 000** |
| Too loose (one key still “feels unlimited”) | ≥ ~50 000 |

Solo 1 500 / Pro 5 000 as **agency-wide shared keys:** **TOO LOW** — and that
is **good for the seller.** They will not recommend Solo for the shop.

### Q3 — Share one key if quotas allow?

**Yes, historically.** One invoice, one secret in every repo and every laptop.
At Solo 1 500 / Pro 5 000 that cheat **dies**. At Team 20 000 they still share
**one Team key** across activations (by design of the SKU) — quota is the
shared bucket brake, seats are the install brake. Limit **does** stop
“buy Solo once for 20 people.”

### Q4 — Churn / pirate / upgrade thresholds

| Team day cap | Behaviour |
| --- | --- |
| ≤ ~10 000 | Feel bait-and-switch → churn / Pack for non-CI staff |
| **20 000** | Accept with soft-warn; ask for custom if weekly hits |
| **25 000** | Comfortable ship number for most shops this size |
| Soft-warn often @ 20 k | Sales conversation / custom — desired, not churn first |
| Pirate | One Pro key for office **only if Pro day cap is too high** |

### Q5 — Soft warn vs hard only?

**Soft @ 70 % → hard.** Ops needs time to spread load (Pack for juniors,
second product, less noisy Action scope). Hard-only mid-client-delivery = angry
Slack.

### Q6 — Solo without CI + lower day cap vs Pro with CI

**Strong approve.** Solo = freelancer product. Pro = single CI seat. Team =
shop. Low Solo day cap + CI gate is the anti-theft package. Do not raise Solo
“to be nice.”

**Verdict:** Prefer Team **25 000** day (panel comfort) or lock **20 000** if
founder wants maximum share-brake and accepts support nudges. Keep Solo/Pro
low.

---

## 5. Cross-cutting answers (all four)

| Question | Consensus |
| --- | --- |
| Daily limit OK for SaaS MCP? | **Yes**, if disclosed and 429 = *did not run* |
| Soft warn @ 70 % then hard? | **Yes** (4/4 prefer over hard-only) |
| Solo no CI + lower cap vs Pro + CI? | **Ladder works**; enforce in code |
| Does quota stop key sharing? | **Yes on Solo/Pro**; Team remains one shared bucket by SKU design |
| File packs | Still zero MCP load — juniors/Pack path reduces hosted burn (good) |

**Minute caps (30 / 60 / 120):** no pushback. Burst protection; day cap is the
emotional and commercial lever.

---

## 6. Recommended adjusted numbers (if panel pushback)

| Knob | Under test | Panel-adjusted recommendation | Why |
| --- | --- | --- | --- |
| Solo day | 1 500 | **1 500 lock** | Anti-share; Freelancer OK |
| Solo /min | 30 | **30 lock** | Fine |
| Solo CI | no | **Enforce `ci_not_included`** | Marketing already says no |
| Pro day | 5 000 | **5 000 lock** | Abteilungsleiter OK per seat |
| Pro /min | 60 | **60 lock** | Fine |
| Pro CI budget | +2 000 optional | **2 000 Action `check_code`/day inside the 5 000** | Avoid double-counting fog |
| Team day | 20 000 | **20 000 lock** *or* **25 000 if less support noise** | Chef: OK→slightly low at 20 k |
| Team /min | 120 | **120 lock** | Fine |
| Warn | (implied) | **Soft notice @ 70 % day, hard 429 @ 100 %** | 4/4 |
| 429 copy | proposed | Ship English: *This check did not run (daily quota).* | Product law |

**Do not raise Solo** to “help agencies.” That undoes the brake.

**Do not publish “unlimited.”** Publish the table on `/connect` after env ships.

---

## 7. FOUNDERS-DECIDE — lock or change?

### Recommendation: **LOCK with one optional Team bump**

| Decision | Lock? | Note |
| --- | --- | --- |
| Solo 1 500 / 30 / no CI | **LOCK** | Panel-aligned; anti-abuse core |
| Pro 5 000 / 60 / CI yes | **LOCK** | CI sub-budget 2 000 **inside** day |
| Team 20 000 / 120 / CI yes | **LOCK 20 000** *or* **CHANGE → 25 000** | Founder call: harder brake vs fewer tickets |
| Soft-warn @ 70 % | **LOCK as P0 behaviour** | Not a later nice-to-have |
| 429 *did not run (daily quota)* | **LOCK** | Never silent clean |
| Solo Action gate in code | **LOCK P0** | Quotas alone are not enough |

**Default ship package if Benjamin picks one line:**

```
Solo 1500/30 no-CI | Pro 5000/60 CI (2000 Action inside) | Team 25000/120 CI
+ soft-warn 70% + hard 429 did-not-run
```

Alternate (maximum brake): same but Team **20 000**.

**Out of scope this panel:** website price edits; overage billing (P2);
persistent Redis quotas (P1 ops, still needed so mittnite restart does not
reset the window customers were sold).

---

## Appendix — persona one-liners (blunt)

| Persona | One line |
| --- | --- |
| Freelancer | “1 500 is fine; warn me at 70 %; I don’t need CI.” |
| Entwickler | “Low Solo cap stops the five-laptop paste; keep it.” |
| Abteilungsleiter | “5 000 Pro OK per seat; soft-warn mandatory; CI budget inside not plus.” |
| Agentur-Chef | “Punish Solo/Pro sharing hard; Team 20 k is tight — 25 k quieter.” |

---

*FOUNDERS-DECIDE. Decision record only. No website price edits in this change.*
