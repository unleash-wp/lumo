# Founder load map + usage pricing — 2026-08-01

**Status:** FOUNDERS-DECIDE (recommend only).  
**Does not change** locked website prices in `docs/packages.md`, `docs/website-pricing-table.md`, or lumo-pro mirrors.  
**Audience:** Benjamin (founder). German exec first; English technical detail below.

---

## Kurz (DE) — was du entscheiden musst

**Größtes Risiko heute:** Nicht „Mittwald stirbt an Cursor“, sondern **CI-Stürme + ungeteilte Paid-Quota**. Ein PR mit N PHP/JS-Dateien = **N×** `lumo_check_code` gegen `mcp.unleash-wp.com`. Solo Hosted („kein CI“) und Pro teilen **dieselbe** Server-Tier-Logik (`tier === 'pro'`). Marketing sagt Solo ohne CI; **Code blockiert Solo-Action nicht**. 8000 Requests/Tag/Key klingen groß, bis 10 Repos × 20 Dateien × viele Pushes laufen.

**Zweites Risiko (separat):** AI Forge → **Automattic / wp.org / GitHub**, nicht dein MCP. Hosted Forge ist **noch nicht live** (`ai-forge#20`). Trotzdem: vor Go-live-Claims Soft-Limits/Caching/Backoff festziehen — sonst blockiert wp.org *dich*, nicht dein Mittwald-Host.

**Empfohlene First Moves (vor Lemon go-live):**

1. **Quota ehrlich machen:** Paid day/min nach SKU differenzieren (oder CI-Budget-Header). Solo soft-cap Action. 429-Antwort **muss** „check did not run / quota“ sagen — nie still als clean.
2. **Action: 429 nicht als Free-Catch-Fallback** ohne sichtbares DID-NOT-RUN (heute: `proDegraded` + Notice — gut; 429 fällt in denselben Catch-Pfad). Kein Retry-Storm.
3. **File-Packs pushen** (39/99): Last = 0 auf Mittwald. Pack ist der Load-Ventil, nicht nur Upsell.

**Pricing-Hebel (ohne Website-Preise jetzt umzuschreiben):** Soft-Quotas im Seat + Upgrade-Nudge; CI als Pro/Team-Budget; Pack/Offline belohnen. Preis-Leiter-Anhebung später, wenn Messung da ist — nicht blind vor Messung.

---

## A. Load map — who hits what

```
┌─────────────────────┐     Bearer + tools/call      ┌──────────────────────────┐
│ Cursor / Claude     │ ───────────────────────────► │ Mittwald MCP             │
│ (paid hosted seat)  │                              │ mcp.unleash-wp.com       │
└─────────────────────┘                              │ SQLite Pro DB            │
                                                     │ (payers only)            │
┌─────────────────────┐     1× check_code / file     │                          │
│ GitHub Action (CI)  │ ───────────────────────────► │                          │
│ lumo-action@v1      │     (PHP/JS in PR diff)      │                          │
└─────────────────────┘                              │                          │
                                                     │                          │
┌─────────────────────┐     abilities → /mcp         │                          │
│ lumo-wp plugin      │ ───────────────────────────► │                          │
└─────────────────────┘                              └──────────────────────────┘

┌─────────────────────┐     profiles.wordpress.org,  ┌──────────────────────────┐
│ AI Forge (local /   │ ──► Trac / mcp-context-wporg,│ Automattic / wp.org /    │
│ future Hosted)      │     api.github.com           │ GitHub                   │
└─────────────────────┘     ✗ NOT Mittwald MCP       └──────────────────────────┘

┌─────────────────────┐
│ Starter / Agent Team│     disk files only → **0** Pro-DB / **0** MCP RPS
│ (file packs)        │
└─────────────────────┘

┌─────────────────────┐
│ Free local          │     bundled snapshot on laptop → **0** Pro host
│ @unleashwp/lumo     │
└─────────────────────┘
```

| Client | Target | Load shape (from code) |
| --- | --- | --- |
| Cursor / Claude MCP | Mittwald `/mcp` | Multi-turn: initialize + N tool calls. Each POST counts against IP + key quota. |
| GitHub Action | Mittwald `/mcp` | **1 `lumo_check_code` HTTP POST per PHP/JS file** in the PR unified diff (`runCatch` loops sequentially in `lumo/src/action/catch-runner.ts`). Non-PHP/JS ignored. |
| lumo-wp | Mittwald `/mcp` | On-demand ability calls (`lumo_check_code` / lookup / advice). Low RPS unless an agent loops. |
| File packs (39/99) | none | Zero server load. |
| Free local | none (local snapshot) | Zero Pro host. |
| AI Forge | wp.org + GitHub (+ optional Automattic mcp-context-wporg) | **Separate plane.** Does not hit Mittwald MCP for catalogue. Hosted Forge entitlement exists on Solo/Pro/Team 20; **install not available** (`capability-inventory.md`, `ai-forge#20`). |

### Rough multipliers (Action)

| Scenario | Approx. Mittwald POSTs |
| --- | --- |
| PR touches 1 PHP file | **1** `tools/call` |
| PR touches 12 PHP/JS files | **12** sequential calls (15s timeout each → worst case minutes of wall time) |
| 5 PRs/day × 10 files × 1 repo | **50**/day on one key |
| Agency: 20 seats / many repos sharing one Agency key (if mis-sold) | Can approach **8000/day** paid default fast |
| Plus license path | First call (or after 15 min cache TTL) may hit Lemon Squeezy validate+activate; subsequent calls cache 15 min (`validate-license.ts`) |

**Honest gap:** Solo Hosted is sold as “no CI”. Server resolves Freelancer / Pro / Agency the same once product id ∈ `LUMO_LS_PRODUCT_IDS` → `tier: 'pro'`. There is **no** SKU gate that refuses Action traffic for Solo keys. Enforcement today = marketing + customer honesty, not code.

---

## B. Current protections (honest)

| Layer | What exists | Default / note | Gap |
| --- | --- | --- | --- |
| Auth | Bearer required in prod | 401 anonymous | OK |
| Paid seat | `hostedRequiresPaid()` | non-pro → **402** before DB | Free/Community never touch DB ✓ |
| Seats | LS activation + `X-Lumo-Instance` | Action: `sha256(owner/repo)`; WP: `sha256(siteurl\|blog_id)` | Cursor/Claude without fingerprint → free + `no_instance` notice (not false Pro) |
| IP rate limit | in-memory sliding window | **120/min** (`LUMO_RATE_LIMIT_PER_MIN`) | Resets on process restart; multi-instance = N× limit |
| Key quota | in-memory min + day | **SKU split:** Solo 1500/30 · Pro 5000/60 · Team 20 000/120 (locked 2026-08-01); Solo CI blocked via `X-Lumo-Client: action` | No Redis/persistent store |
| Catch input | `INPUT_LINE_CAP` | 2000 lines | Disclosed when truncated ✓ |
| Catch output | Free `CATCH_CAP` 3; Pro budget-driven | `CHECK_CODE_TOKEN_BUDGET` 6250; lookup 1500 | Caps disclosed ✓ |
| Token cap | `emitText` / `capText` | Truncation notice | OK |
| 402 / license notices | Front of answer | unverified / inactive / no_instance | Product law ✓ |
| Action degradation | 429/timeout → free catch + `proDegraded` | PR comment + optional `fail_on_degraded` | Must stay visible; never green silent |
| CI SKU | Docs: Solo no CI; Pro/Team yes | **Enforced:** Solo + `X-Lumo-Client: action` → 402 `ci_not_included` | LOCKED 2026-08-01 |

**What 429 looks like today (HTTP):**

```json
{ "error": "rate_limited", "retry_after": N, "limit": L, "window": "minute"|"day",
  "message": "This check did not run (daily quota)." }
```

Solo + GitHub Action: `{ "error": "ci_not_included", "message": "This check did not run. …" }` (402).

Action treats non-OK as throw → free fallback + degraded notice. That is fail-open on availability **with disclosure**, not a clean Pro pass — keep it that way.

---

## C. Automattic / Forge risk (≠ MCP load)

| Fact | Implication |
| --- | --- |
| Forge hits `profiles.wordpress.org`, Trac via `mcp-context-wporg`, GitHub API | Automattic / GitHub can throttle **Forge users or a future Hosted Forge IP**, not your SQLite MCP |
| Hosted Forge install **blocked** (`ai-forge#20`) | Do not sell live Hosted Forge; entitlement copy only |
| Soft civility already in Forge | `UWP_FETCH_RPS` pacing; `politeFetch` Retry-After on 429/503; disk caches for profiles/slugs; `git ls-remote` avoids GitHub REST for branches |
| Self-host Forge = customer’s egress | Risk is per-customer IP; Hosted Forge would concentrate egress on **your** IP → higher block risk |

**Before any Hosted Forge go-live claim:**

1. Hard default `UWP_FETCH_RPS` (e.g. 1–2) on the Hosted worker; never 0 in Hosted.
2. Shared cache (object store) for profile/slug lookups across tenants.
3. Circuit breaker: after N×429, stop outbound for window; UI says “WordPress.org unavailable”, never invent props.
4. Do not run multi-worker ingest without global rate budget (code comment already warns: RPS is per-process).
5. Keep MCP catalogue traffic on Mittwald; never proxy wp.org through the Pro MCP process.

---

## D. Smart pricing + limits — FOUNDERS-DECIDE

**Locked prices (do not silently edit):** Free 0 · Starter 39 · Agent Team 99 · Solo Hosted 149 · Pro 199/seat · Team 20 · 599. This section **recommends knobs**, not a price rewrite.

### Model 1 — Soft quotas in seat + overage / upgrade nudge (default candidate)

| SKU | Included (proposal) | When hit |
| --- | --- | --- |
| Solo Hosted | e.g. 1 500 MCP req/day, 30/min; **CI Action soft-deny** | 429 + connect CTA → Pro |
| Pro | e.g. 5 000/day + **CI budget** e.g. 2 000 Action `check_code`/day | 429 + Team 20 / second seat |
| Team 20 | e.g. 20 000/day shared or per-seat | 429 + sales / custom |

**Customer sees when hit:** HTTP 429 + machine `error: rate_limited` + English: *“Paid MCP daily quota exceeded. This check did not run. Upgrade or retry after ….”*  
Action: **DID NOT RUN** annotation + summary (not ACTION_NO_MATCH / not green-as-clean). Prefer `fail_on_degraded=true` default for paid CI later; today default off is OK if the notice is loud.

### Model 2 — CI-heavy SKU premium (align code with marketing)

- Solo Hosted: MCP for Cursor/Claude OK; Action with Solo key → **402 or dedicated `ci_not_included`** with copy: gate did not run.
- Pro / Team 20: CI included with explicit daily Action budget.
- Price ladder stays; you sell the **missing enforcement**, not a new SKU.

**Customer sees:** Same product law — check did not run / CI not on this plan. Never “no known issues”.

### Model 3 — Fair-use tiers by daily requests + clear paywall

Publish a simple table on `/connect` (numbers measured after 2 weeks telemetry, not invented):

| Fair use | Solo | Pro seat | Team 20 |
| --- | --- | --- | --- |
| Soft warn @ | 70% | 70% | 70% |
| Hard stop @ | 100% | 100% | 100% |

Warn = notice in tool prose (front). Hard = 429. Optional later: metered overage via LS — **not** day-one.

### Model 4 — Price ladder steers load offline (later)

Raise Solo/Pro only after measurement if Hosted MCP is underpriced vs Pack. Pack (99) and Free local remain the **zero-infra** path. Do **not** raise locked website prices in this doc’s commit.

### Ship-this-first package (recommend)

| When | What | Why |
| --- | --- | --- |
| **P0 before Lemon go-live** | Env: tighten paid defaults if dogfood shows CI storms; document Solo CI as “honor system” **or** ship Model 2 gate | Honesty + load |
| **P0** | Action: treat 429 as degraded DID-NOT-RUN (already mostly true); **no client retry loop** | Product law |
| **P0** | Forge Hosted: keep “install not available”; set Hosted RPS when unblocking | Automattic risk |
| **P1** | SKU-aware quotas (Model 1 or 2) + usage telemetry dashboard for founder | Steering |
| **P1** | Persist quotas (Redis/SQLite) so mittnite restart does not reset windows | Ops honesty |
| **P2** | Overage billing / CI add-on SKU | After PMF |
| **P2** | Price ladder tweak | After measured load, not before |

**Default recommendation:** **Model 2 (CI gate for Solo) + Model 1 numbers as env defaults for Pro/Team.** Marketing already promises Solo without CI; code should match before scale. Quotas alone without CI gate still let Solo burn 8000/day on Action.

---

## E. Engineering backlog (ticket-shaped)

### P0

| ID | Repo | Item |
| --- | --- | --- |
| LOAD-P0-1 | lumo-pro | SKU-aware gate: Freelancer product id → reject Action User-Agent / optional `X-Lumo-Client: action` with `ci_not_included` (402), or separate daily CI budget 0 |
| LOAD-P0-2 | lumo | Action: on 429, skip free-catch fallback for **paid-configured** runs when policy is “quota = did not run”; always post DID-NOT-RUN (never NO_MATCH) |
| LOAD-P0-3 | lumo-pro | Quota response body: fixed customer sentence *“This check did not run (quota).”* Keep `error: rate_limited` |
| LOAD-P0-4 | ai-forge | Hosted path: default `UWP_FETCH_RPS≥1`, global breaker; do not claim Hosted live until #20 closed |

### P1

| ID | Repo | Item |
| --- | --- | --- |
| LOAD-P1-1 | lumo-pro | Persist key/IP windows (SQLite or Redis); document multi-instance behaviour |
| LOAD-P1-2 | lumo-pro | Per-SKU env: `LUMO_RATE_LIMIT_SOLO_*`, `LUMO_RATE_LIMIT_PRO_*`, `LUMO_RATE_LIMIT_AGENCY_*` |
| LOAD-P1-3 | lumo | Action: optional concurrency/batch cap (max files per run) with disclosed truncation |
| LOAD-P1-4 | lumo-pro | Founder usage report: top keys by day, Action vs editor split |
| LOAD-P1-5 | lumo-action | Docs: Solo key + Action = unsupported; Pro/Team required |

### P2

| ID | Repo | Item |
| --- | --- | --- |
| LOAD-P2-1 | lumo-pro | Soft-warn at 70% via MCP notice (front of answer) |
| LOAD-P2-2 | shop / LS | CI add-on or metered overage |
| LOAD-P2-3 | ai-forge | Shared profile cache for Hosted multi-tenant |
| LOAD-P2-4 | lumo-wp | Client backoff on 429; surface `reason` to panel (already has vocabulary pattern) |

---

## Appendix — source pins (measured 2026-08-01)

- Quotas: `lumo-pro/src/mcp/key-quota.ts`, `docs/server-load.md`, licensing-runbook env block  
- IP limit: `lumo-pro/src/mcp/middleware-rate-limit.ts`  
- Auth/402: `lumo-pro/src/mcp/require-auth.ts`, `http.ts`  
- Action per-file MCP: `lumo/src/action/catch-runner.ts` `runCatch` / `fetchProResults`  
- Seat fingerprints: `lumo-pro/docs/licensing-runbook.md`  
- Packages / Solo no CI (marketing): `lumo/docs/packages.md`, `lumo-pro/docs/product-harmony.md`  
- Forge vs Automattic: `ai-forge/src/lib/wp-profiles.mjs`, `ai-forge/src/mcp-wporg.mjs`; Hosted blocked: `lumo-pro/docs/capability-inventory.md`  

---

*FOUNDERS-DECIDE. No website price edits in this change. Commit = decision record only.*
