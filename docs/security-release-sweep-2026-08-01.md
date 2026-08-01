# Security- und Release-Sweep (2026-08-01)

Branch: `release/v1.0.0-go-live` (alle Repos). Kein Push, kein Deploy.

## Executive Summary (Deutsch)

**Release-fähig mit Founder-Gates.** Keine committed Secrets, keine `.tmp-prodev-bait`-Reste,
keine Dogfood-/Founder-Docs in npm-/R2-/Plugin-Zips. MCP-Auth und pack-download Worker sind
default-closed (Bearer + LS Store/Product, kein Knowledge-Download, Path-Traversal-Guard).

**Offen vor Go-Live (Benjamin):**

1. Cloudflare `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` in GitHub Secrets
2. Worker production: `LS_STORE_ID`, `LS_PRODUCT_IDS`, `PACKAGE_SIGNING_SECRET` (+ optional `LS_API_KEY`)
3. Lemon Squeezy live (Produkte, Webhook, Checkout)
4. Erst Staging-Bucket (`lumo-artifacts-staging`), dann Prod-Upload
5. Bekannte Test-Flakes/Debt in `lumo` (9) und `lumo-pro` (2) — nicht durch diesen Sweep verursacht

---

## lumo (public, `@unleashwp/lumo`)

| Prüfung | Ergebnis |
|---------|----------|
| Committed `.env` | Keine (nur `.env.example` in Skills) |
| Hardcoded Live-Keys | Keine in `src/`; Snapshot enthält absichtliche Beispiel-Muster für Catch |
| npm pack Inhalt | **OK** — nur `dist/`, `data/`, `agents/`, `commands/`, `skills/`, `server.json`, `.cursor/` |
| Dogfood/Founder-Docs | Nach `docs/internal/` verschoben; `.npmignore` + Test `npm-pack-hygiene.test.ts` |
| `.tmp-check/` / `.tmp-prodev-bait/` | In `.gitignore`, nicht vorhanden |
| MCP CORS | Free MCP lokal; kein offener HTTP-Endpoint im Paket |
| npm audit (high) | `hono`, `postcss` in verschachtelten Skill-DevDeps — **nicht im npm-Tarball** |

**Fixes in diesem Sweep:** Doc-Scrub, `.npmignore` verschärft, npm-pack-Hygiene-Test.

**Tests:** `npm-pack-hygiene` grün. Gesamtsuite 9 Failures (git-sandbox/`auditProject`-E2E) — **FOUNDERS-DECIDE**, vorbestehend.

---

## lumo-pro (private MCP + R2 Worker)

| Prüfung | Ergebnis |
|---------|----------|
| Committed `.env` | `directus/.env` **nicht** in git; explizit in `.gitignore` ergänzt |
| MCP Auth | `require-auth.ts`: Production erzwingt Bearer + paid tier; Free bekommt 402 |
| CORS | Kein breites CORS in `src/mcp/` |
| pack-download SSRF/Traversal | Flat keys only (`/` rejected); Knowledge-Suffixe blockiert; LS validate timeout 10s |
| License gating worker | `LUMO_ENV=production` + leere LS vars → 503 `license_gating_unconfigured` |
| Dogfood docs | `docs/dogfood-protocol.md` → `docs/internal/` |
| npm audit (high) | `vite` in Skill-DevDeps — nicht deployed |

**Fixes:** `.gitignore`, `scripts/upload-r2-artifact.mjs`, `upload-artifacts-r2.yml`, `RELEASE-AUTOMATION-R2.md`.

**Tests:** 1029/1031 grün; 2 Failures (`tool-surface-cost` Token-Ceiling) — **FOUNDERS-DECIDE**.

---

## lumo-action

| Prüfung | Ergebnis |
|---------|----------|
| `secrets.*` in `action.yml` | **Keine** — bewusst `github.token` + INPUT_* passthrough |
| Unlizenzierter Check suggeriert | Nein — Copy + Tests pin „DID NOT RUN“ |
| Secrets in Repo | Keine |

**Tests:** 12/12 grün (`node --test`).

---

## lumo-wp

| Prüfung | Ergebnis |
|---------|----------|
| XSS Panel | React rendert `status.message` als Text; SVG nur aus statischen Brand-Strings in PHP |
| Licence in Tests | Keine echten Keys in Fixtures |
| Plugin zip Inhalt | Nur `lumo.php`, `includes/`, `assets/`, README, LICENSE — kein `src/`, kein `tests/` |
| Dogfood in zip | Keine |

**Tests:** 109/109 grün (`php tests/run.php`).

**Fix:** `release-artifacts-r2.yml` für WP-Zip-Upload vorbereitet.

---

## lumo-agent-kit

| Prüfung | Ergebnis |
|---------|----------|
| Internal docs in Pack-Zips | `verify-pack-contents.mjs` — FEEDING, docs/, dogfood, founder ausgeschlossen |
| Brainstorm in R2 zip | Agent Pack shippt nur `.claude/`, `agents-src/`, `web-skills/`, Commercial READMEs |
| Secrets | Keine |

**Fixes:** `verify-pack-contents.mjs`, CI in `verify.yml`, `release-artifacts-r2.yml`.

**Lokal:** Core + Pack zip gebaut und verifiziert (OK).

---

## R2 Key Layout (Referenz)

Siehe `lumo-pro/docs/RELEASE-AUTOMATION-R2.md`.

| Artefakt | R2-Key |
|----------|--------|
| Pro toolkit | `toolkit-pro.zip` |
| Agent Core | `lumo-agent-core-<version>.zip` |
| Agent Pack | `lumo-agent-pack-<version>.zip` |
| WP Plugin | `lumo-wp-<semver>.zip` |

---

## Empfehlung

**Ja, safe to release** sobald Benjamin die Cloudflare- und Lemon-Squeezy-Secrets setzt und
`LS_STORE_ID` / `LS_PRODUCT_IDS` auf dem Production-Worker bestätigt. Code-seitig sind
Shippable Trees bereinigt; Idea-Scratch liegt unter `docs/internal/` (git ok, nicht publish).

**Nicht blockierend:** npm audit in Skill-DevDeps; lumo/lumo-pro Test-Debt vor Tag `v1.0.0`
separat triagieren.
