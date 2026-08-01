# Dogfood — all-SKU buy panel (2026-08-01)

English product artifact. Simulated buying panel across **every** priced SKU.
Does **not** change locked prices in `website-pricing-table.md` / `packages.md`.
Price moves = **FOUNDERS-DECIDE** recommendations only (§6).

**Method:** Four buying personas (CEO = shipper lens, not scored). Each is shown
the full ladder, asked what they would buy first, and YES/NO/MAYBE on every SKU.
Commercial pressure tests from Benjamin: (1) real price must cover ongoing
curation/updates, (2) **+50 €** Pack→Solo feels too cheap for hosted MCP +
living agents/skills + updates vs a shareable zip, (3) **skills/agents on disk
are shareable** — one Pack can stock a whole office.

**Locked ladder (evaluate, do not rewrite elsewhere without founder approve):**

| Website | Internal | Price | Delivery |
| --- | --- | --- | --- |
| Free | — | 0 | Local CLI/MCP snapshot |
| Starter | Agent Core | 39 €/yr | 2 uwp agents + 2 skills — **files only, shareable** |
| Agent Team | Agent Pack | 99 €/yr | 6 uwp + 9 skills + 5 cmds — **files only, shareable** |
| Solo Hosted | Freelancer | 149 €/yr · 1 seat | Hosted MCP + agents/skills via MCP + Vol.1 + Pack included + Forge entitlement |
| Pro | Lumo Pro | 199 €/seat/yr | Solo Hosted + CI Action |
| Team 20 | Agency | 599 €/yr · 20 seats | Multi-seat + CI + Forge entitlement |

14-day money-back. No Forge install live. No Ready-for-7.1 claim. USP Core-sourced.

---

## Kurzfassung (DE) — für Benjamin

**Blunt:** Die Leiter verkauft die richtigen Jobs — aber die **Preise schützen die Leiter nicht**.

1. **Shareability-Risiko ist real.** Agent Team 99 (und Starter 39) sind Dateien. Eine Agentur / Abteilung kauft **einmal**, kopiert Skills/Agents auf alle Maschinen, und braucht keinen Seat. Das untergräbt Solo / Pro / Team 20 härter als jede Copy-Zeile „files only“.
2. **+50 € (99→149) ist zu wenig.** Hosted MCP + lebende Agents/Skills über Bearer + laufende Kuration + Vol.1 + Forge-Entitlement gegen ein teilbares Zip ist kein „Best Value“-Aufpreis — das ist ein **Schnäppchen**, das dem Seller wehtut. Freelancer freut sich; Abteilungsleiter und Agentur-Chef lesen „Pack reicht fürs Büro“.
3. **Update-Kosten:** Du kuratierst weiter. File-Packs ohne Hosted fühlen sich wie einmaliger Download an; der Jahrespreis muss entweder Hosted klar teurer machen **oder** Pack so teuer, dass „ein Zip fürs ganze Haus“ trotzdem wehtut.

**1st-choice (bei locked Preisen):**

| Persona | 1st choice | Warum kurz |
| --- | --- | --- |
| Freelancer | Solo Hosted 149 | Live Cursor + Pack inkl. — und +50 wirkt wie Deal |
| Entwickler | Free → Solo 149 *oder* Pack 99 | Nach Aha: live vs files |
| Abteilungsleiter | Pro 199/seat | CI-Gate; Pack 99 als Büro-Diebstahl-Versuch |
| Agentur-Chef | Team 20 · 599 | Seat-Math; **aber** Pack-99-Temptation hoch |

**FOUNDERS-DECIDE (Panel-Empfehlung):** Pack hoch, Solo-Lücke größer, Pro/Team nachziehen — siehe §6. **Nicht** in anderen Docs ändern ohne dein OK.

---

## Scoring keys

| Label | Meaning |
| --- | --- |
| **YES** | Would pay this SKU this year for their job |
| **MAYBE** | Only if budget / proof / framing fits; not default |
| **NO** | Wrong job or actively avoids this SKU |

---

## 1. Freelancer

**Job:** Catch stale AI code in Cursor on client work; one annual invoice.

### Rank — 1st choice

**Solo Hosted 149 €/yr.** Live MCP (ACF/Woo/GF) + full kit included + Vol.1. Agent Team alone is a dead end for live Cursor. Starter only if cash-tight and files-curious.

### YES / NO / MAYBE per SKU

| SKU | Vote | Why |
| --- | --- | --- |
| Free 0 | **YES** | Prove with `demo` first; always |
| Starter 39 | **MAYBE** | Budget entry; two agents only; no live catalogue |
| Agent Team 99 | **MAYBE** | Tempting name; only if they truly want files-only and will never need hosted |
| Solo Hosted 149 | **YES** | 1st choice — job fit |
| Pro 199 | **NO** | No CI need as solo |
| Team 20 · 599 | **NO** | Overkill |

### Shareable skills (file packs)

Mostly **indifferent**. Solo buyer. Might drop Pack files on a contractor once — not their buying thesis. They still feel Solo is cheap vs Pack (+50), which confirms seller pressure.

### Is +50 € Pack→Solo enough?

**No — from seller fairness; YES from Freelancer greed.** Panel Freelancer would still buy Solo at **199–229 €/yr**. At 149 they feel they won. Fair Solo feel: **~199 €** minimum if Pack stays 99; **~229 €** if Pack rises to 149.

---

## 2. Entwickler

**Job:** Prove watcher on bait PHP/`block.json`, then pick files vs hosted.

### Rank — 1st choice

**Free first**, then fork: **Solo Hosted 149** if live plugin catalogue needed; **Agent Team 99** if files-only shop with Claude/Cursor agents. Starter 39 only as tiny toe-dip.

### YES / NO / MAYBE per SKU

| SKU | Vote | Why |
| --- | --- | --- |
| Free 0 | **YES** | Non-negotiable wedge; freeze story drives upgrade |
| Starter 39 | **MAYBE** | Too thin if they already know they want six agents |
| Agent Team 99 | **YES** | Fair for full disk roster — *and* they notice it can be copied to teammates |
| Solo Hosted 149 | **YES** | When live ACF/Woo/GF required; Pack included so skip 99 |
| Pro 199 | **MAYBE** | Only if they own merge-gate duty |
| Team 20 · 599 | **NO** | Not their budget |

### Shareable skills (file packs)

**Sees the hole.** Will tell the shop: “Buy Pack once, copy the folder.” That recommendation **steals hosted seats**. Framing “patterns freeze at kit date” helps hosted; it does **not** stop file copy.

### Is +50 € Pack→Solo enough?

**No.** Live MCP + continuous curation vs frozen zip should hurt more. Entwickler fair Solo: **199–249 €**. Pack at 99 feels *cheap for a whole team*, not just for one dev.

---

## 3. Abteilungsleiter

**Job:** Merge gate on WordPress PRs; hosted depth; budget per seat; finance proof.

### Rank — 1st choice

**Pro 199 €/seat/yr** when CI is required (1–3 seats). **Team 20 · 599** from ~4 seats. Solo only if no CI. **Agent Team 99 as “one zip for the floor” is the dark horse** — commercially dangerous.

### YES / NO / MAYBE per SKU

| SKU | Vote | Why |
| --- | --- | --- |
| Free 0 | **YES** | LOUD proof for finance (no hosted trial) |
| Starter 39 | **NO** | Wrong scale; shareable crumbs not a dept standard |
| Agent Team 99 | **MAYBE** | **Risk SKU:** one purchase, copy to N machines, skip seats — finance loves 99 |
| Solo Hosted 149 | **MAYBE** | Per-dev without CI; loses to Pack-share logic unless live MCP is mandatory |
| Pro 199 | **YES** | 1st choice — CI non-negotiable |
| Team 20 · 599 | **YES** | From ~4 seats / shop license |

### Shareable skills (file packs)

**Highest commercial risk after Agentur-Chef.** Dept will ask: why pay 199/seat if Pack + copy works? Counter: live catalogue, CI Action, seat Bearer, updates — but **price gap must make Pack-alone feel incomplete**, not merely “files only” in prose.

### Is +50 € Pack→Solo enough?

**Absolutely not.** +50 does not buy out “one Pack for ten laptops.” Needs either Pack much higher, Solo/Pro much higher, or both. Fair Solo feel for dept: **≥199** with Pack still below; Prefer Solo **229–249** and Pro **279+** if Pack stays near 100.

---

## 4. Agentur-Chef

**Job:** One shop license; seats for devs; CI on client repos; avoid double-buy.

### Rank — 1st choice

**Team 20 · 599 €/yr** — seat math (~30 €/seat) still wins **if** they buy hosted. **Attack path:** buy **Agent Team 99 once**, distribute skills/agents shop-wide, stay on Free local MCP, skip 599.

### YES / NO / MAYBE per SKU

| SKU | Vote | Why |
| --- | --- | --- |
| Free 0 | **MAYBE** | Dogfood only |
| Starter 39 | **NO** | Too small; do-not-buy-twice |
| Agent Team 99 | **MAYBE** | **Dangerous YES-temptation:** one shareable kit for the office at coffee-money |
| Solo Hosted 149 | **NO** | One seat — not an agency SKU |
| Pro 199 | **MAYBE** | Tiny shop 1–3 CI seats only |
| Team 20 · 599 | **YES** | 1st choice when hosted+CI+seats understood |

### Shareable skills (file packs)

**Deal-breaker risk for Team 20.** At 99 €, Pack is an agency-wide license in practice (even if ToS says otherwise). Panel: either **price Pack like a team product** or accept that many shops never climb to Team 20.

### Is +50 € Pack→Solo enough?

**Irrelevant for agency close** (they need seats). For the ladder story overall: **no** — Solo must sit clearly above a shareable Pack, and Pack must not be “whole agency for 99.”

---

## 5. CEO — shipper lens (not a buyer)

Ship Solo Hosted as hero only if the **price gap to Pack is honest**. Today +50 underprices hosted curation. Do not claim Ready for 7.1. Do not sell Forge Hosted as live install. Fix shareability with **price + framing**, not hope.

---

## Full matrix — Persona × SKU

| Persona ↓ · SKU → | Free 0 | Starter 39 | Agent Team 99 | Solo Hosted 149 | Pro 199 | Team 20 · 599 |
| --- | --- | --- | --- | --- | --- | --- |
| **Freelancer** | YES | MAYBE | MAYBE | **YES** (1st) | NO | NO |
| **Entwickler** | **YES** (wedge) | MAYBE | **YES** | **YES** (live fork) | MAYBE | NO |
| **Abteilungsleiter** | YES | NO | MAYBE (share risk) | MAYBE | **YES** (1st) | YES (~4+) |
| **Agentur-Chef** | MAYBE | NO | MAYBE (share risk) | NO | MAYBE (tiny) | **YES** (1st) |

**1st-choice summary:** Freelancer → Solo · Entwickler → Free→Solo/Pack · Abteilungsleiter → Pro · Agentur-Chef → Team 20.

---

## Price pressure findings

### A. +50 € Pack → Solo (99 → 149)

| Lens | Verdict |
| --- | --- |
| Freelancer | Loves it (bargain) |
| Entwickler | Undervalues live MCP + updates |
| Abteilungsleiter / Agentur | Reads Pack as “almost as good, shareable, much cheaper” |
| Seller (Benjamin) | **Confirmed: too little** |

Hosted delivers: live catalogue, MCP-served living agents/skills, Vol.1, Forge entitlement, continuous curation. File Pack delivers: copyable roster frozen at kit date. **+50 € does not price that difference.**

### B. Skills / agents are shareable

| Who | Behavior |
| --- | --- |
| Freelancer | Low impact |
| Entwickler | Recommends office-wide Pack copy |
| Abteilungsleiter | Finance asks for one Pack |
| Agentur-Chef | Strong temptation to skip Team 20 |

ToS / “one download” language does **not** fix incentives. **Price must.**

### C. Update / curation cost

Annual license must fund ongoing Core/plugin curation. File buyers emotionally treat Pack as a one-shot zip. Hosted is where updates are felt. Therefore: **widen hosted premium** and/or **raise Pack** so “shareable annual kit” still pays for curation.

### D. What is *not* the fix

- Cutting Solo further (makes shareability worse).
- Hiding Agent Team (still need files door; hide = support tickets).
- Claiming Forge install or Ready-for-7.1 to inflate Solo (trust kill).
- 30-day money-back instead of price (14-day stays locked).

---

## FOUNDERS-DECIDE — recommended price table

Locked prices stay in other docs until Benjamin approves. Panel recommendation:

### Primary recommendation (fix both holes)

| Website | Locked now | **Recommend** | Delta | Rationale |
| --- | --- | --- | --- | --- |
| Free | 0 | **0** | — | Wedge stays free |
| Starter | 39 €/yr | **39 €/yr** | 0 | Entry OK; shareable but thin |
| Agent Team | 99 €/yr | **149 €/yr** | +50 | Shareable full kit = team-ish price; stops “agency for coffee money” |
| Solo Hosted | 149 €/yr | **229 €/yr** | +80 | Hosted + living MCP agents/skills + updates + Vol.1; **+80 over Pack 149** (not +50) |
| Pro | 199 €/seat/yr | **279 €/seat/yr** | +80 | CI premium **+50 over Solo 229** |
| Team 20 | 599 €/yr | **749 €/yr** | +150 | Seat helper: 3×279 ≈ 837 → Team 20 still wins; ~37 €/seat |

**New gap Pack→Solo:** 149 → 229 = **+80 €** (was +50).  
**New psychology:** Solo still Best Value vs buying Pack then discovering 402 — Pack included remains true.

### Alternative A — only widen hosted (Pack stays 99)

| SKU | Recommend |
| --- | --- |
| Agent Team | **99** (accept share risk; fight with freeze + dead-end copy only) |
| Solo Hosted | **199** (+100 over Pack) |
| Pro | **249**/seat |
| Team 20 | **699** |

Use if you refuse to touch Pack this week. **Shareability risk remains.**

### Alternative B — round consumer prices

| SKU | Recommend |
| --- | --- |
| Starter | 39 |
| Agent Team | **149** |
| Solo Hosted | **249** |
| Pro | **299**/seat |
| Team 20 | **799** |

Cleaner marketing numbers; larger hosted premium.

### Panel “feels fair” Solo (independent of ladder math)

| Persona | Fair Solo feel |
| --- | --- |
| Freelancer | 199–229 € |
| Entwickler | 199–249 € |
| Abteilungsleiter | ≥229 € if Pack shareable at low price |
| Agentur-Chef | N/A (Team 20); Pack must not be 99 |

---

## Framing still required (even after price move)

1. Agent Team: **files only · shareable on disk · patterns freeze · no hosted MCP** (loud).
2. Solo: **live catalogue + agents/skills via MCP + updates** — Pack included, do not buy twice.
3. Team 20: seat math + CI + living roster via Bearer — Pack alone is not a shop license for hosted depth.
4. Optional later (product, not this doc): license text “one activation / no redistribution” on Pack — helps legal, not incentives.

---

## Scoreboard (intent at locked prices)

| Metric | Result |
| --- | --- |
| Personas with clear 1st paid SKU | 4 / 4 |
| Commercial red flags | **Pack shareability** · **+50 Solo gap** · **update cost underpriced** |
| Price change in locked docs | **None** — recommendations only |
| Founder action | Approve §6 primary / A / B or keep lock |

Canonical lock until approve: [website-pricing-table.md](./website-pricing-table.md) · [packages.md](./packages.md) · [pricing-personas.md](./pricing-personas.md).  
Prior buy-intent (no price pressure): [dogfood-buy-intent-annual-2026-08-01.md](./dogfood-buy-intent-annual-2026-08-01.md).
