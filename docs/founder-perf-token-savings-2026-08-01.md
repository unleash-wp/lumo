# Founder perf + token savings — 2026-08-01

**Status:** FOUNDERS-DECIDE (recommend only).  
**Companion:** `docs/founder-load-and-usage-pricing-2026-08-01.md` (Quota, CI-Gates, SKU).  
**Audience:** Benjamin (founder). German exec first; English technical detail below.

---

## Kurz (DE) — zwei verschiedene Kosten

**Server-Last (Mittwald CPU/SQLite/RPS)** und **Kunden-Token (LLM-Kontext)** sind *nicht* dieselbe Rechnung.

| Was brennt | Wo | Typischer Auslöser |
| --- | --- | --- |
| **Mittwald CPU** | `lumo-pro` `scanProCode()` | Jeder `lumo_check_code`: ~104 Catch-Einträge, ~144 Signale, Regex auf bis zu 2000 Zeilen, plus DB-Joins. **Action: 1 HTTP POST pro PHP/JS-Datei** (`catch-runner.ts`). |
| **Kunden-Token** | Tool-Antwort + Session-Overhead | `tools/list` ~2567 Token/Session · `lumo_lookup` Ø835 (Cap 1500) · `lumo_check_code` bis **6250** · `lumo_get_agent` **2746–7017** pro Agent · voller Datei-Blob im Request-JSON |
| **Beides** | Action + „Agent ruft alles ab“ | 12 Dateien = 12× Scan **und** 12× bis zu 6250 Token Antwort **plus** der Code nochmal im Prompt |

**Produktgesetz bleibt unverhandelbar:** Nie false all-clear · Caps offenlegen · Verfügbarkeit fail-open, **Claim** nie.

---

## Top 3 (blunt) — schneiden Server **und** Token

1. **GitHub Action: Batch-`lumo_check_code` (ein MCP-Call pro PR, nicht pro Datei).**  
   Heute: `runCatch` sequentiell, 1× `tools/call` pro Diff-Datei. Ein Batch-Schema (`files: [{path, code, language}]`) spart **(N−1)×** HTTP, Quota-Ticks, LS-Auth-Amortisation **und** duplizierte Session-/Tool-Overheads im Agent-Kontext. Scan-CPU bleibt ~N× (jeder Blob muss gelesen werden), aber der Multiplikator, der CI-Stürme erzeugt, fällt weg.

2. **Catch-Signal-Index einmal pro Prozess kompilieren (Regex + Metadaten), nicht pro Request.**  
   Heute: `deserializeSignals()` baut bei **jedem** `check_code` ~144 `RegExp` neu; dazu voller DB-Select aller Frontier-Einträge. Startup-Cache (invalidieren bei Deploy/DB-Migration) senkt **p95 CPU pro Request** deutlich, **null** Token-Risiko wenn Scan-Ergebnis identisch bleibt.

3. **Client-Routing: Pack/Free lokal für Wissen; MCP nur für Live-Catch/Lookup — nie Agent-Kit-Volltext blind laden.**  
   Starter/Agent Team (39/99) = **0** Mittwald. Free `@unleashwp/lumo` = lokaler Snapshot (48 Einträge). Hosted MCP: **`lumo_list_*` reicht** (~216–241 Token); **`lumo_get_agent`/`get_skill` nur bei Bedarf** (bis ~7k Token/Stück). Skills/Agents im Pack auf Disk statt 6× MCP.

---

## Gemessene Baselines (2026-08-01, Code)

| Konstante / Messung | Wert | Quelle |
| --- | --- | --- |
| Pro Catch-Einträge (Frontier) | **104** | `CATCH_SIGNALS` Registry |
| Pro Signale gesamt | **144** (114 PHP, 30 JS) | idem |
| Free Snapshot-Einträge | **48** | `data/snapshot.json` |
| Free Registry-Pattern mit Catch | **25** | `src/detection/registry.ts` |
| `INPUT_LINE_CAP` | **2000** Zeilen | Free + Pro `classify.ts` / `catch.ts` |
| Free Display-Cap | **3** Treffer | `CATCH_CAP` |
| Pro Scan-Display | **∞** im Scan, Budget im Renderer | `scanProCode(..., Infinity)` → `renderScannedHits` |
| `DEFAULT_TOKEN_BUDGET` (lookup etc.) | **1500** | `lookup.ts` |
| `CHECK_CODE_TOKEN_BUDGET` | **6250** | `tools.ts` (bewusst >1500; 3 Treffer @1500 trimmten mid-report) |
| `NOTICE_RESERVE_TOKENS` | **220** | `tools.ts` |
| `tools/list` Session-Kosten | **≤2600** (gemessen ~2567) | `tool-surface-cost.test.ts`, `tool-contract.md` |
| Ø `lumo_lookup` Pro-Antwort | **835** Token (15 Fixtures) | `scripts/token-savings-benchmark.ts` |
| `lumo_list_agents` / `list_skills` | **216 / 241** Token | dist-Messung 2026-08-01 |
| `lumo_get_agent` (je Agent) | **2746–7017** Token | idem (`uwp-plugin-specialist` max) |
| `lumo_get_skill` (je Skill) | **1045–1777** Token | idem |
| Action MCP | **1 POST/Datei**, 15s Timeout | `catch-runner.ts` |

**Sind 6250/1500 zu hoch?** Für **lookup**: nein im Schnitt (Ø835 <1500); Einzelfälle bis ~1451 (HPOS-Query-Fixture). Für **check_code**: 6250 ist **Untergrenze für ehrliche Multi-Finding-Reports** — Regression-Tests zeigen: bei 1500 wurden Findings abgeschnitten *inkl.* Cap-Hinweis am Ende (`wp-check-code.test.ts`). Senken nur mit **kürzerem Evidence-Format**, nicht blind.

---

## Optimierungen nach Priorität

### P0 — vor Scale / Lemon go-live

| ID | Bereich | Maßnahme | Server-Ersparnis (Richtung) | Token-Ersparnis | Produktgesetz-Risiko |
| --- | --- | --- | --- | --- | --- |
| **PERF-P0-1** | Action (`lumo`) | **`lumo_check_code` Batch-Argument** `files[]` + per-file `structuredContent` Array; Action sendet einen Call | **~80–95% HTTP/RPS** bei N-Datei-PRs; Quota **N→1** | **~(N−1)×** Tool-Wrapper + weniger duplizierter Neutral-Prose pro PR | **Mittel:** Schema-Contract (`docs/tool-contract.md`); jede Datei braucht eigenes `computed`/`complete`/`found`; PR-Summary darf nicht „clean“ sagen wenn Datei X `didNotRun` |
| **PERF-P0-2** | Pro catch | **Module-level Signal-Cache:** DB-Rows + deserialisierte `RuntimeSignal[]` einmal laden, bei Deploy invalidieren | **~30–60% CPU** pro `check_code` (Regex-Allokation + wiederholter Select) | **0** (Antwort unverändert) | **Niedrig** wenn Ergebnis bit-identisch; Cache-Fehler = `computed:false`, nicht neutral |
| **PERF-P0-3** | GTM / Docs | **Pack + Free lokal pushen**; Hosted-MCP-Skill: „list before get; lookup before check wenn nur Wissen“ | Entlastet Quota **komplett** für Pack-Kunden | **6× get_agent (~26k Token)** vermeidbar pro Session | **Niedrig** (Routing, kein Claim) |
| **PERF-P0-4** | Quota (bereits release) | SKU-Limits + Solo CI-Block (`X-Lumo-Client: action`) | Deckelt Worst-Case | Verhindert Retry-Stürme | **Niedrig** — 429/402 = did-not-run Copy |

### P1 — nächste Engineering-Welle

| ID | Bereich | Maßnahme | Server | Token | Risiko |
| --- | --- | --- | --- | --- | --- |
| **PERF-P1-1** | Pro catch | **Identischer Blob-Hash Short-Circuit** (sha256(code+language+tier), TTL 5–15 min, keyed per license) | Cache-Hit ≈ **0 CPU** | Gleiche Antwort = gleiche Tokens; Hit spart Re-Scan | **Hoch wenn falsch:** Nie „neutral“ aus Cache ohne `computed:true` + Scope-Zeile; **kein** Cache bei `inputTruncated`; Tier/Pro-Depth im Key |
| **PERF-P1-2** | Response shape | **`check_code` kompakt-Modus** (optional flag): Summary + Slugs + Tiers; volle Evidence via `lumo_lookup(slug)` on demand | Weniger `lookupBySlug`-Render pro Hit | **~40–60%** bei Multi-Hit wenn Agent eh nachfixt | **Mittel:** Default bleibt voll; compact muss `complete`/`found` behalten |
| **PERF-P1-3** | Agent Kit | **`get_agent`/`get_skill` mit `depth: summary|full`** oder hartes Token-Cap auf Body | Minimal | **>50%** bei summary | **Niedrig** wenn full explizit |
| **PERF-P1-4** | Catch render | **`renderCatchHit`:** doppelte `updatedAt`-Query entfernen (steht schon in `lookupBySlug`) | Kleine CPU | 0 | **Niedrig** |
| **PERF-P1-5** | Action | **Concurrency cap** (z. B. max 20 Dateien) mit disclosed truncation in Summary | Deckelt Worst-Case | Deckelt Token-Sturm | **Mittel** — muss „nicht gescannt: Dateien X–Y“ sagen |

### P2 — später / nur mit Telemetrie

| ID | Maßnahme | Anmerkung |
| --- | --- | --- |
| **PERF-P2-1** | `INPUT_LINE_CAP` senken (z. B. 1000) **nur Action** mit gleicher Disclosure | Spart CPU auf Riesendateien; **nie** ohne `catchInputTruncatedLine` |
| **PERF-P2-2** | Früher Scan-Abbruch nach K Budget-Treffer | **Produktrechtlich heikel** — würde Scope verkürzen ohne alle Signale zu prüfen; nur mit explizitem „partial scan“ Flag |
| **PERF-P2-3** | `CHECK_CODE_TOKEN_BUDGET` 6250→4500 nach Evidence-Templates straffen | Erst messen in Prod; Tests anpassen |
| **PERF-P2-4** | `tools/list` weiter trimmen | Ceiling 2600 schon guardrail; **Output-Schema-Beschreibungen nicht anfassen** (tool-contract) |

---

## 1. Catch (Scan-Pfad)

**Was heute passiert (Pro):** `scanProCode` lädt alle published Frontier-Einträge mit `catch_signals`, deserialisiert JSON→RegExp pro Request, filtert Sprache, testet gegen stripped Blobs, dedupliziert, sortiert LOUD>SOFT. Display-Cap im Scan ist **∞**; Budget entscheidet in `renderScannedHits`.

**Server-Hebel:**

- **Signal-Cache (P0-2):** Größter sicherer CPU-Gewinn.
- **Sprach-Filter:** Bereits aktiv (`signal.language !== lang`).
- **Reference-Lane-Skip:** Bereits aktiv (`ne(categories.lane, 'reference')`).
- **Früher Exit:** **Nicht empfohlen** ohne neuen „partial scope“-Claim — würde Produktgesetz brechen.
- **Kleinere Input-Fenster:** Nur mit Disclosure (`catchInputTruncatedLine`); Free und Pro spiegeln `INPUT_LINE_CAP=2000`.

**Token-Hebel:**

- Budget-gesteuerte Finding-Anzahl (nicht fixed 3) — already shipped.
- Kürzere `formatResponse` / optional compact mode (P1-2).
- Agent soll nicht ganze Datei + voller Report doppelt im Chat halten — Client-Discipline.

---

## 2. Action: Batch vs N Calls

**Ist-Zustand:** `runCatch` → `for (const file of files) await catchFile()` → je `fetchProResults` mit `{ code, language }`.

**Win-Modell (12 PHP-Dateien):**

| Metrik | Heute | Batch (1 Call) |
| --- | --- | --- |
| HTTP POSTs | 12 | 1 |
| Quota-Verbrauch | 12 | 1 |
| Scan-CPU (Summe) | ~12× | ~12× (unvermeidbar) |
| Agent Tool-Roundtrips | 12 | 1 |
| Worst-case Antwort-Token | 12×6250 | 1×6250 (Cap pro Call!) |

**Wichtig:** Ein Batch-Call braucht **per-Datei** structured results oder Action splittet Antwort — sonst mischt ein LOUD in Datei A mit Neutral in Datei B. Product law: **kein grünes „NO_MATCH“** wenn nur Teilmenge gescannt oder quota blockiert (`checkDidNotRun` Pfad ist schon da).

**Schema-Skizze (English, contract draft):**

```typescript
// lumo_check_code extension (backward compatible)
{ code?: string; language?: 'php'|'js'|'auto';  // legacy single
  files?: Array<{ path: string; code: string; language?: 'php'|'js'|'auto' }>; }
// structuredContent: { results: CheckCodeResult[] } aligned by path
```

---

## 3. Response shape

| Tool | Problem | Fix |
| --- | --- | --- |
| `lumo_check_code` | Volle Evidence-Kette pro Hit (~1000 Token/Finding) | Default behalten; optional `compact=true` + lookup on demand |
| `lumo_lookup` | Ø835 OK; Cap 1500 | Body-Trim nur mit `(response trimmed…)` — already |
| `lumo_list_agents/skills` | Schon paginiert (Roster) | OK |
| `lumo_get_agent/skill` | **Bis 7017 Token** Volltext | `depth=summary` oder Pack-Dateien; Skill text: „call get only when invoking role“ |
| `tools/list` | 2567 Token/Session Fixkosten | Kein blindes Kürzen der Schema-Beschreibungen |

**Strukturiert vs Essay:** `computed`/`complete`/`found`/`loudCount` sind schon datengetrieben — **Prose ist für Menschen**, Flags für Agenten. Token sparen heißt **weniger Prosa duplizieren**, nicht Flags schwächen.

---

## 4. Caching (Blob-Hash)

**Sinnvoll:** Identischer Code + Sprache + `servedTier` → gleiche Scan-Antwort innerhalb TTL.

**Pflicht-Regeln:**

1. Cache-Miss = normaler Scan.
2. Cache-Hit liefert **dieselben** `computed`/`complete`/Disclosures wie Live-Scan.
3. **Nie** cachen: `computed:false`, quota/402/429, licence degradation, `inputTruncated:true`.
4. Antwort-Header oder structured field `cacheHit: true` optional — **nicht** als „cleaner“ lesbar.
5. Key **ohne** Roh-Code loggen (nur Hash).

**Fail-open on availability:** Cache down → scan; Cache wrong → schlimmer als miss — deshalb P1, nicht P0, bis Tests mit „guard removed“ rot werden.

---

## 5. Client guidance — wann **kein** MCP

| Situation | Statt Hosted MCP |
| --- | --- |
| Agent Team / Starter Pack | Dateien unter `skills/`, `agents/` — **0 RPS** |
| Free Tier / kein Paid Seat | `npx @unleashwp/lumo` lokal |
| Nur Wissen (kein Blob-Scan) | `lumo_lookup(topic)` not `check_code` on whole repo |
| Rolle laden | `list_agents` → **ein** `get_agent(id)` |
| CI auf Solo Hosted | Blocked by design — kein Fallback der scannt |

In Skills/Commands explizit: **„Do not call lumo_check_code on unchanged files“** (Diff-only ist Action schon; Cursor-Hooks analog).

---

## 6. Token budgets — zu hoch?

| Budget | Urteil |
| --- | --- |
| **1500** shared | Passend für lookup (Ø835); Einzeloutlier bis ~1451 |
| **6250** check_code | **Not too high** for multi-finding honesty; lowering broke tests at 1500 |
| **220** notice reserve | Angemessen (license notice + truncation lines front-loaded) |
| **2600** tools/list ceiling | Schon optimiert; further cuts hit contract literacy |

**Mess-Hook:** `scripts/token-savings-benchmark.ts` für lookup; ergänzen um check_code fixtures (crowded blob) in P1 Telemetrie.

---

## P0 PR-Sized Backlog (optional next)

| Repo | Ticket | Aufwand |
| --- | --- | --- |
| `lumo-pro` | Signal-Cache in `classify.ts` + test „same result, second call faster“ | ~1 PR |
| `lumo-pro` + `lumo` + contract | Batch `files[]` on `lumo_check_code` + Action runner | ~2 PRs |
| `lumo` | Skill/Command: MCP routing (list→get, lookup vs check) | ~1 PR docs/skills |
| `lumo-pro` | `renderCatchHit` dedupe query | ~20 lines |

---

## Appendix — source pins

- Catch scan: `lumo-pro/src/catch/classify.ts`, `lumo/src/detection/catch.ts`
- Token caps: `lumo-pro/src/mcp/tools.ts`, `lumo-pro/src/mcp/cap.ts`, `lumo-pro/src/knowledge/lookup.ts`
- Action loop: `lumo/src/action/catch-runner.ts`
- Agent Kit sizes: `lumo-pro/src/mcp/agent-kit-catalog.ts`
- Quota: `lumo-pro/src/mcp/key-quota.ts`, `docs/server-load.md`
- Product law: `AGENTS.md` (both repos), `docs/tool-contract.md`
- Measurements: `tests/tool-surface-cost.test.ts`, `tests/catch/wp-check-code.test.ts`, `scripts/token-savings-benchmark.ts`

---

*FOUNDERS-DECIDE. Recommendations only; no runtime behavior changed in this commit.*
