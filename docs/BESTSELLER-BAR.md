# Bestseller bar (go-live)

English product artifact. Branch: `release/v1.0.0-go-live`.
Companion: [START-HERE-GO-LIVE.md](./START-HERE-GO-LIVE.md) · [sales-ready-checklist.md](./sales-ready-checklist.md) · [go-live-final.md](./go-live-final.md).

This is not “good enough to merge.” The bar is **professionally shippable + commercially sharp**. Nothing here claims 100% or that every visitor buys.

---

## Kurzfassung (DE)

| Achse | Score vs Bar | Urteil |
| --- | --- | --- |
| **Code** | **~96%** | False-all-clear-Vertrag hält; Medium-Risiken aus dem Prior-Review geschlossen; Suites grün. Nicht 99%: historische AI-Trailer in älteren Commits, CONTEXT→SOFT Rest-Rauschen, Auth-Gate nicht als Full-HTTP-Integration gegen `http.ts` verdrahtet (gleiche Funktionen, ja). |
| **Sell** | **~70%** | Leiter, Close-Map, 14-Tage-Refund, Core-USP, No-Forge-Lie: **im Repo locked**. Umsatz blockiert durch **LS + Deploy + www** (nur du). |
| **Retain** | **~45%** | Briefing #1 und Knowledge-Cadence fehlen; Cohort nach Day-0. Ohne Briefing bleibt Pro “nice DB”, kein Moat-Gefühl. |

**Bestseller-Trajektorie:** Engineering ist shippable. Revenue startet erst nach deinen Day-0-Klicks. Week-1 entscheidet Retention, nicht der Merge.

---

## Score vs bar

| Axis | Bar | Current | Evidence |
| --- | --- | --- | --- |
| **Code** | ~99% professional / near-production | **~96%** | Vitest: lumo 858/858, lumo-pro 990/990; `tsc --noEmit` clean; lumo-action 12/12; lumo-wp 109/109; agent-kit web-edition verified. False-all-clear wording intact (`CATCH_NEUTRAL_LINE`, degraded/complete split). Mediums closed this pass (auth gate functions shared with `http.ts`; `.wp-admin` catch narrowed + near-miss silent; Currency Guard 7.1 source split). |
| **Sell** | Bestseller trajectory (honest) | **~70% code-side / 0% revenue until founder** | Close map for 4 buyers locked; 14-day refund locked in copy; Core-sourced USP on `/connect` + pricing docs; Forge Hosted = entitlement only (no live-install lie). LS products + Mittwald env + www paste still FOUNDER-ONLY. |
| **Retain** | Week-1 cadence that makes Pro sticky | **~45%** | Catalogue depth exists (~192 Pro published). Briefing #1 not shipped. Knowledge publish cadence and founder cohort not running until after Day-0. |

**Honest ceiling:** Code will not hit a measured 99% without (a) rewriting historical AI trailers out of git history or accepting them as residue, (b) broader Catch precision audits beyond the iframe CSS signal, (c) an end-to-end HTTP suite that boots the real `http.ts` process (heavy; functions are shared now).

---

## Gaps to 99% professional

| Gap | Severity | Status |
| --- | --- | --- |
| Never false all-clear (tool / hook / Action / log) | Critical | **Holding** on this branch; regressions would be P0 |
| Auth gate tested against production functions (`checkMissingBearer` / `checkPaidSeat` used by `http.ts`) | Medium → closed | **Closed** |
| `.wp-admin` CONTEXT→SOFT noise on ordinary admin UI CSS | Medium → closed | **Closed** (match requires block-like class; near-miss test) |
| Currency Guard 7.1 Aha citing only 7.0 Make URL | Medium → closed | **Closed** (7.0 + 7.1 handbook sources) |
| `buildCodeProTeaser` awarding “official” skill rank | High → closed | **Closed** + pin test |
| Customer-facing em dashes (`README`, `/connect`) | Medium → closed | **Closed** on touched surfaces |
| AI `Co-authored-by: Cursor` in **older** release commits | Medium (process) | **Accepted residual** (rewriting shipped history needs founder call; new commits cleaned via commit-tree) |
| Full `http.ts` process boot in CI | Low–Medium | **Accepted residual** (shared gate functions cover drift; process boot is env-heavy) |
| Update paths (portal zips refresh, WP plugin artefact channel) | P1 after Day-0 | **Noted**, not Day-0 blocker |
| Agent id rename (`wp-currency-guard` → `currency-guard`) | Process | **Shipped on branch**; confirm www/docs/Cursor rule paths after merge |

---

## Day-0 founder clicks still required

Nothing below is code. Revenue is zero until these land.

1. **Lemon Squeezy:** create exactly 5 products (Core 39 / Pack 99 / Freelancer 149 / Pro 199 / Agency 599); attach Core + Pack zips; restate **14-day money-back** on every paid page.
2. **Mittwald env:** `LUMO_LS_PRODUCT_IDS` = Freelancer + Pro + Agency only; API key, store id, webhook secret; `LUMO_REQUIRE_AUTH=true`; `LUMO_ENV=production`; knowledge DB path; `job restart` after merge.
3. **Merge order:** lumo-pro → lumo → agent-kit → action → lumo-wp (see START-HERE).
4. **Smoke:** real paid key against `POST /mcp` + `/connect` paste; Free key must 402.
5. **www:** paste pricing table; Core-sourced USP first; no Forge Hosted as live install; Solo Hosted ★ as best-value card.
6. **Optional:** dogfood/demo keys for Abteilungsleiter finance; 60 s Free+Solo LOUD screenshot.

---

## Bestseller readiness checklist (honest)

| Must be true | State |
| --- | --- |
| LS + Deploy (founder) | **Blocks revenue** |
| Close map for 4 buyers | **Ready** (docs + `/connect`) |
| Update paths (zips, WP artefact) | **P1 after Day-0** (builders exist; portal refresh + WP channel cadence still manual) |
| USP Core-sourced loud | **Ready** in product copy |
| 14-day refund locked | **Ready** in repo copy; must appear on LS pages |
| No Forge Hosted lie | **Ready** (entitlement wording; do not “fix” on www) |

---

## What “bestseller” needs in week 1 after live

1. **Knowledge cadence:** publish / verify at least one Core-sourced Catch or reference entry from Make/Trac/handbook each working day; snapshot Free when a Free-eligible Catch lands.
2. **Cohort:** 5–10 ICP seats (Freelancer or Pro) with founder Slack/email; watch for silence-as-pass complaints and Catch false-SOFT noise.
3. **Briefing #1:** Core/Block topic in your voice (the Moat). Without it, Pro stays a DB; with it, retention has a reason to renew.
4. **Close loop:** one LOUD screenshot + Solo Hosted CTA in every Free Aha path; Agent Team stays secondary (files dead end).
5. **P1 ops:** refresh LS portal zips when kit changes; decide WP plugin artefact update path (self-update already present; release zip cadence).

---

## Residual accepted risk (not 100%)

- Regex Catch can miss or SOFT-fire; LOUD stays three-guard gated.
- Licence / LS outages fail open on availability, never as a clean verdict (by contract).
- Historical AI trailers remain in some release-branch commits until founder rewrites or squash-merges carefully.
- Persona dogfood ≠ paying customers; conversion is unproven until LS is live.
- Agent public IDs dropped the `wp-` prefix on this branch; old bookmarks/rules need a one-time rename.

---

## Test evidence (this pass)

```
lumo:          npx vitest run          → 858 passed
lumo:          npx tsc --noEmit        → clean
lumo-pro:      npx vitest run          → 990 passed
lumo-pro:      npx tsc --noEmit        → clean
lumo-action:   node --test             → 12 passed
lumo-wp:       php tests/run.php       → 109 checks passed
lumo-agent-kit: verify-web-edition     → 6 roles OK
```
