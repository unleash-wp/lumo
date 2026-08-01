# Quota + Solo-CI Herztest — 2026-08-01

Branch: `release/v1.0.0-go-live` (lumo + lumo-pro)  
Tester: Stufe-1 QA (quota/SKU/Action contracts)

## Executive Summary

**Urteil: PASS für alle hosted MCP-Produkte und den Action-CI-Gate.**  
Implementierung in `lumo-pro` (`key-quota`, `hosted-sku`, `require-auth`, `http.ts`) und Action-Client in `lumo` (`catch-runner.ts`, `X-Lumo-Client: action`) verhalten sich wie spezifiziert. Kein Produktions-Bug gefunden; Lücken in der Testabdeckung geschlossen (+18 Tests in lumo-pro).

Pre-existing Failures (nicht Quota): `lumo/tests/detection.test.ts` (6× composer.lock/git, Sandbox), `lumo-pro/tests/pro-pack.test.ts` (1× EPERM tsx IPC nur in Sandbox — mit `all` grün).

---

## Matrix Product × Scenario × Ergebnis

| Produkt / SKU | Szenario | Erwartung | Ergebnis |
| --- | --- | --- | --- |
| **Solo / Freelancer** | Default day/min | 1500 / 30 | **PASS** (`HOSTED_QUOTA_DEFAULTS`, `key-quota.test.ts`) |
| Solo | Eigener Minute-Bucket (≠ Pro) | Solo blockiert bei 2, Pro bei 5 | **PASS** |
| Solo | Daily cap | 4/day env → 429 day window | **PASS** |
| Solo | `X-Lumo-Client: action` | 402 `ci_not_included`, „did not run“ | **PASS** (`hosted-sku-quota`, `http-quota-gate`) |
| Solo | Editor MCP (kein action client) | erlaubt unter Quota | **PASS** |
| Solo | Env `LUMO_LS_PRODUCT_ID_FREELANCER` | `hostedSku: solo` | **PASS** (`resolve-tier-license`) |
| **Pro** | Default day/min | 5000 / 60 | **PASS** |
| Pro | + action client | erlaubt | **PASS** |
| Pro | Soft-warn ≥70% day | `warn.pct ≥ 70` | **PASS** |
| Pro | limit-1 OK, limit → 429 | `QUOTA_*_EXCEEDED_MESSAGE`, Retry-After | **PASS** (`http-quota-gate`) |
| **Team20 / Agency** | Default day/min | 20000 / 120 | **PASS** |
| Team | Eigener Bucket (≠ Pro/Solo) | 4/min team vs 2/min pro | **PASS** |
| Team | + action client | erlaubt (CI inkl.) | **PASS** |
| Team | Env `LUMO_RATE_LIMIT_AGENCY_PER_DAY` | Override greift | **PASS** |
| **Free / kein Paid** | Kein Bearer (hosted) | 401 | **PASS** |
| Free | Community token / inactive key | 402 `payment_required`, kein Pro-DB | **PASS** |
| Free | `hostedSku` | `null` (nie Solo-Bucket) | **PASS** |
| **Agent Core / Starter (39€)** | LS product 3901 ∉ `LUMO_LS_PRODUCT_IDS` | tier `free`, kein Host | **PASS** (`hosted-sku-quota`) |
| **Agent Team / Pack (99€)** | Nicht in hosted allowlist | wie Core — kein MCP-Host | **PASS** (Allowlist-Logik) |
| **Action (lumo)** | HTTP 429 | `checkDidNotRun`, reason `quota`, kein free catch | **PASS** (`action-pro-contract`) |
| Action | HTTP 402 `ci_not_included` | `checkDidNotRun`, kein `proDegraded` | **PASS** |
| Action | Sendet `X-Lumo-Client: action` | Header auf jedem Pro-Request | **PASS** (`action-instance-fingerprint`) |

---

## Implementierung (Stichproben)

| Bereich | Datei | Verhalten |
| --- | --- | --- |
| SKU-Defaults | `lumo-pro/src/mcp/hosted-sku.ts` | solo 1500/30, pro 5000/60, team 20000/120 |
| Quota consume | `lumo-pro/src/mcp/key-quota.ts` | minute + day, soft-warn 70%, env overrides |
| CI-Gate | `lumo-pro/src/mcp/require-auth.ts` | `checkCiAllowed`: nur `solo` + client `action` → 402 |
| HTTP-Reihenfolge | `lumo-pro/src/mcp/http.ts` | auth → paid → CI → quota → MCP |
| Action-Client | `lumo/src/action/catch-runner.ts` | 429/402 ci → `ProCheckBlockedError`, kein free fallback |

429-Message (Produktgesetz): `This check did not run (daily quota).` bzw. `(quota).`

---

## Neue / erweiterte Tests (lumo-pro)

- `tests/http-quota-gate.test.ts` — Gate-Kette wie `http.ts` (9 Tests)
- `tests/key-quota.test.ts` — +3 (team bucket, agency env, limit-1 edge)
- `tests/hosted-sku-quota.test.ts` — +4 (team+action, unknown→pro, pack allowlist)
- `tests/license/resolve-tier-license.test.ts` — +2 (Freelancer→solo SKU, inactive→null)

---

## Commands + Ergebnisse

```bash
# lumo-pro — Quota-Fokus
cd lumo-pro && npx vitest run tests/key-quota.test.ts tests/hosted-sku-quota.test.ts \
  tests/http-quota-gate.test.ts tests/account-first-auth.test.ts tests/license/resolve-tier-license.test.ts
# → 46 passed

# lumo-pro — Full suite (all permissions für pro-pack IPC)
cd lumo-pro && npx vitest run
# → 74 files, 1025 passed

# lumo-pro + lumo — Types
npx tsc --noEmit   # in beiden Repos → clean

# lumo — Action contract
cd lumo && npx vitest run tests/action-pro-contract.test.ts tests/action-instance-fingerprint.test.ts
# → 47 passed
```

---

## Offene Lücken / Hinweise

1. **Kein E2E gegen live `mcp.unleash-wp.com`** — nur Unit/Contract; Smoke nach Deploy weiterhin manuell (Runbook §Smoke).
2. **`resolveHostedSku(unknownPaidId)` fällt auf `pro`-Quotas** — beabsichtigt (safe default), solange SKU-env fehlt; nicht Solo.
3. **402 `payment_required` im Action** fällt noch in `proDegraded` + free catch — bewusst anderes Gate als 429/ci; kein `checkDidNotRun`. Dokumentiert, kein Defekt für dieses Paket.
4. **Pre-existing:** `lumo/tests/detection.test.ts` (git/composer.lock) — nicht anfassen in diesem Lauf.

---

## Fixes in Produktionscode

Keine. Nur Tests ergänzt.
