# Dogfood persona feedback — 2026-08-01 go-live candidate

English product artifact. Simulated buyer panel via **Agent Team testing mode**
(five internal personas scoring the locked ladder and messaging). Not a wait for
external customer email.

**Method:** Each persona walked Free → Starter 39 → Agent Team 99 → Solo Hosted 149 →
Pro 199 → Team 20 · 599 against `customer-dogfood-test.md`, `website-pricing-table.md`,
`go-live-final.md`, `packages.md`, `pricing-personas.md`, `/connect` copy, and kit
`COMMERCIAL.md`. Scores 1–5. Quiet ≠ clean was a hard trust check on every path.

---

## Kurzfassung (DE) — für Benjamin

**Dogfood-Pfad für diesen Release Candidate = Agent-Team-Persona-Testing-Mode.**
Externe Kunden-Mails sind optional später, nicht der Gate.

| Persona | Würde kaufen? | Kernurteil |
| --- | --- | --- |
| **CEO** | Ship Solo Hosted als Best Value | Leiter klar; Forge-Hosted-Entitlement ohne Live-Install ist Vertrauensrisiko; LS/www noch founder-gated |
| **Agentur-Chef** | **Team 20 · 599** wenn Checkout lebt | Seat-Math stark; Pro-vs-Team-20 Entscheidhilfe fehlt; Forge Hosted auf der Karte nervt wenn nicht nutzbar |
| **Abteilungsleiter** | **Pro 199** für CI-Gate | CI-Differenz zu Solo ist klar; Seat-/Key-Mechanik und „kein Hosted-Trial“ blocken Freigabe |
| **Freelancer** | **Solo Hosted 149** (Budget: Starter 39) | Best-Value-Karte trifft; Gefahr: Agent Team 99 statt Hosted zu kaufen |
| **Entwickler** | Free zuerst, dann Pack oder Solo | `demo` ist der Aha; npm 0.4.1 vs go-live-`check` und local vs hosted MCP verwirren |

**Top 5 P0 (Freigabe vor Implementierung):** siehe §5.

---

## Scoring rubric

| Axis | 1 | 3 | 5 |
| --- | --- | --- | --- |
| **Clarity** | Wrong SKU likely | Understands after re-read | Knows what to buy in &lt;30 s |
| **Value** | Price feels wrong for job | Fair if proof exists | Clear bargain for their job |
| **Trust (quiet ≠ clean)** | Reads silence as pass | Notices honesty once | Honesty is part of the sell |

---

## 1. CEO — UnleashWP / product owner lens

**Job:** Ship without a false all-clear or a false feature claim.

| Axis | Score | Notes |
| --- | --- | --- |
| Clarity | 4 | Ladder and hard rules are locked. Dual names (LS Freelancer / website Solo Hosted; Agency / Team 20; Core / Starter) still tax every surface. |
| Value | 4 | Solo Hosted ★ as Best Value is the right psychology. Six public tiers is heavy but documented. |
| Trust | 3 | Quiet ≠ clean is strong in docs and connect. **Forge Hosted on Solo/Pro/Team 20 cards while install is blocked** is the main trust leak if www copies entitlement as if live. |

**What they would buy / ship:** Solo Hosted as primary CTA; Pro as CI upsell; Team 20 as agency SKU. Keep Agent Team secondary (files only).

**Confuses them:**
- Connect page lists Free / Starter / Agent Team on a page whose job is “paste paid Bearer.”
- `pricing-personas.md` still leads with internal names (Agent Core, Freelancer, Agency) while website lock uses Starter / Solo Hosted / Team 20.
- Dogfood sheet originally read as “wait for email”; product owner intended **persona testing mode**.

**Blocks purchase / go-live:**
- Lemon Squeezy five products + webhook + portal zips not live.
- Production deploy of `/connect` + knowledge seed still CODE-DONE / FOUNDER-ONLY.
- Forge Hosted packaging entitlement must not be sold as a live install.

**Verdict:** Product lock is shippable as messaging. Revenue path is not. Do not soft-launch hosted SKUs until Day-0 smoke (§6) is green.

---

## 2. Agentur-Chef — agency owner, Team 20 buyer

**Job:** One license for the shop; seats for developers; CI on client repos.

| Axis | Score | Notes |
| --- | --- | --- |
| Clarity | 4 | “Team 20 · 599 · 20 seats · Pack included · CI · Forge Hosted” is scannable. |
| Value | 5 | ~30 €/seat/year vs Pro 199/seat is an obvious agency win past ~3 seats. |
| Trust | 3 | Honesty on quiet ≠ clean and unlicensed CI “did not run” is good. Selling Forge Hosted they cannot open weakens the premium pitch. |

**What they would buy:** **Team 20 · 599 €/yr.** Would not buy Agent Team or Starter separately (correctly warned “do not buy twice”).

**Confuses them:**
- When is **Pro × N** better than Team 20? (Math: 3×199 = 597 ≈ 599; 4+ seats → Team 20. Not on the pricing cards.)
- “Agency” on Lemon Squeezy vs “Team 20” on www — finance and procurement mismatch.
- Seat activation: second machine / second seat untested in buyer path (§6b).

**Blocks purchase:**
- Cannot checkout (LS products FOUNDER-ONLY).
- No proof that 20 activations work without two machines + live keys.
- CI needs secrets in each client repo — ops cost not stated on the card.

**Verdict:** Buy intent high once checkout + seat smoke exist. Add a one-line seat decision helper on Teams block.

---

## 3. Abteilungsleiter — dept lead, Pro seats

**Job:** Merge gate on WordPress PRs; hosted depth for the team; budget per seat.

| Axis | Score | Notes |
| --- | --- | --- |
| Clarity | 4 | Pro = Solo Hosted + CI is the cleanest upsell story on the ladder. |
| Value | 4 | +50 € over Solo Hosted for CI is defensible for a dept with GitHub. |
| Trust | 4 | Unlicensed Action stays green **and** must say gate did not run — matches their fear of silent pass. |

**What they would buy:** **Pro 199 €/seat/yr** for repos that need the merge gate. Solo Hosted only if no CI requirement.

**Confuses them:**
- How seats work (one key per seat? portal deactivate?). Docs say FOUNDER-ONLY / Week-1 P3 for self-service deactivate.
- Free is the only pre-purchase proof — no hosted trial key. Hard to justify card to finance without a LOUD hosted screenshot.
- Vol.1 “69 living lookups” vs “book” branding — fear of buying a PDF again (honesty line helps if visible on checkout).

**Blocks purchase:**
- No hosted trial / sandbox key (by design) — need a recorded Solo/Pro smoke video or founder-shared key for dogfood.
- Action verification needs a real repo + secrets.
- Money-back 14 days only after LS exists.

**Verdict:** Strong Pro fit. Purchase blocked on delivery + seat story, not on price.

---

## 4. Freelancer — Solo Hosted / Starter buyer

**Job:** Catch stale AI code in Cursor on client work; pay once per year.

| Axis | Score | Notes |
| --- | --- | --- |
| Clarity | 3 | Best Value card is right, but three pre-hosted choices (39 / 99 / 149) invite wrong SKU. |
| Value | 4 | Solo Hosted 149 = hosted MCP + full Pack + Vol.1 + Forge Hosted entitlement for one seat — strong if Forge honesty is clear. |
| Trust | 3 | Free `demo` builds trust. Paying for “Forge Hosted” they cannot open feels like packing air. |

**What they would buy:**
- Lives in Cursor + needs live ACF/Woo/GF: **Solo Hosted 149**.
- Price-sensitive / files only: **Starter 39**, maybe later Agent Team 99.
- Would **skip** Agent Team 99 if they already know they need live catalogue (correct ladder).

**Confuses them:**
- Agent Team 99 looks like “the team” — name implies people/hosted; product is zip-only.
- “Freelancer” (LS) vs “Solo Hosted” (www) — invoice vs marketing.
- Starter has “HPOS basics” in Code Reviewer but live Woo depth is Solo+ — easy to over-expect at 39.

**Blocks purchase:**
- Checkout / portal zips not live.
- Fear of buying Agent Team then discovering 402 on hosted MCP (docs say this is correct; still a support ticket waiting to happen).
- No hosted trial: Free local must be the proof — path must be one click from pricing.

**Verdict:** Solo Hosted is the right hero. Tighten Agent Team secondary copy so freelancers do not stop at 99 when they need live MCP.

---

## 5. Entwickler — hands-on WP developer, Free → Pack path

**Job:** Prove the watcher on a bad `block.json` / HPOS file; then decide files vs hosted.

| Axis | Score | Notes |
| --- | --- | --- |
| Clarity | 3 | Free path is excellent. Local MCP vs hosted MCP vs “agents on disk” is three concepts in one install week. |
| Value | 4 | Free `demo` / `check` is genuine. Agent Team 99 is fair for six specialists if install is painless. |
| Trust | 5 | Quiet ≠ clean + scope lines + unlicensed CI wording match how a careful WP engineer thinks. |

**What they would buy:**
- Start: **Free** (`npx @unleashwp/lumo demo`, then `check` on bait PHP).
- Files-only shop with Claude/Cursor agents: **Agent Team 99**.
- Need live plugin catalogue: jump to **Solo Hosted 149** (skip 99).

**Confuses them:**
- Published npm `0.4.1` vs go-live candidate `github:…#release/v1.0.0-go-live` for whole-file `check` (dogfood sheet states it; easy to miss).
- Agents say “MCP not connected” — reads as broken install unless the dogfood expect line is known.
- Kit INSTALL-CROSS-TOOL across Claude / Cursor / Codex — friction before first LOUD agent finding.

**Blocks purchase:**
- Zip delivery still invite/manual until LS portal.
- Hosted path needs key + deploy.
- Security Auditor name may over-promise vs “not AppSec” (persona pitch exists; must sit on checkout).

**Verdict:** Free honesty demo is the wedge. Pack path works if “bundled patterns frozen at kit date” is said once at install, not buried.

---

## 6. Cross-persona consensus

### What works across all five

1. Locked ladder and Solo Hosted ★ Best Value psychology.
2. Quiet ≠ clean / never false all-clear as brand trust.
3. Free `npx @unleashwp/lumo demo` as zero-friction proof.
4. Pack included in hosted seats (“do not buy twice”).
5. Vol.1 honesty line (lookups ≠ PDF ≠ Catch) when shown.

### Shared confusion clusters

1. **Dual naming** (Starter/Core, Agent Team/Pack, Solo Hosted/Freelancer, Team 20/Agency).
2. **Files vs hosted** — Agent Team name vs zip-only reality.
3. **Forge Hosted** entitlement vs blocked install.
4. **No hosted trial** — finance/dept leads need a substitute proof.
5. **Purchase path dead** until Lemon Squeezy + deploy smoke.

### Purchase intent map (when checkout lives)

| Persona | Primary SKU | Secondary |
| --- | --- | --- |
| CEO | Ship Solo Hosted hero | Protect honesty claims |
| Agentur-Chef | Team 20 · 599 | — |
| Abteilungsleiter | Pro 199/seat | Solo if no CI |
| Freelancer | Solo Hosted 149 | Starter 39 budget |
| Entwickler | Free → Agent Team 99 or Solo 149 | Starter if tiny |

---

## 7. Prioritized fix list (approve before implement)

Do **not** implement until Benjamin approves. Doc typos / dogfood-path clarification are allowed now.

### P0 — blocks trust or revenue for this candidate

| ID | Fix | Why | Owner hint | Status |
| --- | --- | --- | --- | --- |
| **P0-1** | Treat **Agent Team persona testing mode** as the dogfood gate for this RC (update go-live + dogfood sheet). External email optional later. | Avoid waiting on the wrong signal. | Docs (this pass) | **DONE** |
| **P0-2** | Customer-facing Forge Hosted: say **included entitlement / Hosted install still shipping** (or hide until `ai-forge` unblocks). Never imply live Hosted Forge today. | Five personas flag trust leak. | www + connect + cards | **DONE** (copy + connect) |
| **P0-3** | Lemon Squeezy: create 5 products + webhook + portal Core/Pack zips (Pack on hosted SKUs). | No buyer can purchase or download. | Founder | **FOUNDER-ONLY** (checklist ready) |
| **P0-4** | Deploy lumo-pro `/connect` + knowledge seed; run Day-0 smoke (§6). | CODE-DONE without production = false readiness. | Founder + ops | **FOUNDER-ONLY** |
| **P0-5** | One-line **name glossary** on pricing + connect (Website = LS name). | Dual names confuse Agency finance, freelancers, and support. | www + connect | **DONE** |

### P1 — raises conversion / reduces wrong SKU

| ID | Fix | Why | Status |
| --- | --- | --- | --- |
| **P1-1** | Paste website-pricing-table §2 + §7 to www; hero = watcher + demo CTA. | Marketing must match lock. | **FOUNDER** www paste |
| **P1-2** | Agent Team secondary copy: “files only · no hosted MCP · Solo Hosted for live catalogue.” | Stops 99 € dead-end for Cursor solos. | **DONE** |
| **P1-3** | Teams block: “Pro for 1–3 seats with CI; Team 20 from ~4 seats / whole shop.” | Agency + dept decision helper. | **DONE** |
| **P1-4** | Align `pricing-personas.md` / package pitches to **website names first**, LS names in parentheses. | Same ladder, less cognitive tax. | **DONE** |
| **P1-5** | Dogfood / Free strip: state npm vs go-live `check` branch in one line everywhere Free is sold. | Entwickler confusion. | **DONE** |
| **P1-6** | Record or attach a 60 s Free demo + (when keys exist) Solo Hosted LOUD screenshot for dept finance. | Substitutes for no hosted trial. | Open (founder media) |

### P2 — polish after checkout works

| ID | Fix | Why |
| --- | --- | --- |
| **P2-1** | Checkout upsell Starter → Agent Team. | Week-1 backlog already. |
| **P2-2** | Soften Security Auditor card with “not AppSec / pentest” one-liner. | Avoid compliance over-read. |
| **P2-3** | Connect page: collapse Free/Starter/Agent Team into a short “files / local” strip; lead with hosted paste for paid visitors. | Reduce noise for paying users. |
| **P2-4** | Self-service seat deactivate in portal. | Week-1 P3. |
| **P2-5** | Optional Vol.1 PDF for Pack (manual). | Week-1 P2; not blocking. |

---

## 8. What this round did **not** re-test

- Live Lemon Squeezy checkout (products not created).
- Production hosted MCP with a real paid key.
- AI Forge Hosted install (blocked by design this round).
- Multi-seat Team 20 activation on two machines.
- External customer email responses.

Those remain Day-0 / founder smoke items in `go-live-final.md` §3 and §6.

---

## 9. Next step (founder)

1. ~~Approve or edit the **P0 list** above.~~ **Approved** (implement pass 2026-08-01).
2. ~~Implement approved P0/P1 (code + copy).~~ **Done** in repos (P0-3/P0-4 remain founder clicks).
3. Formal **code-review** pass on release branch diffs.
4. Founder Day-0: [sales-ready-checklist.md](./sales-ready-checklist.md) + [go-live-final.md](./go-live-final.md) §9.

Canonical lock: [go-live-final.md](./go-live-final.md) · [website-pricing-table.md](./website-pricing-table.md) · [customer-dogfood-test.md](./customer-dogfood-test.md) · [sales-ready-checklist.md](./sales-ready-checklist.md).