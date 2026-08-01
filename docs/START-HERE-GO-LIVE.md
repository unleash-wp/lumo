# START HERE — Go live today

**Engineering ist fertig.** Was noch fehlt, kannst nur du: Lemon Squeezy-Account, Mittwald-Env, www-Paste, Merge/Deploy, Smoke mit echtem Key.

Diese Datei ist die einzige, die du offen brauchst. Alles andere ist Verweis.

Branch überall: `release/v1.0.0-go-live`

---

## Merge-Reihenfolge (noch nicht mergen, bis du startest)

Alle PRs sind **OPEN + MERGEABLE**. Merge in dieser Reihenfolge, je ein Klick:

| # | Repo | PR | CI |
| --- | --- | --- | --- |
| 1 | **lumo-pro** | https://github.com/unleash-wp/lumo-pro/pull/167 | Muss grün sein (Test-Pins gefixt auf Branch) |
| 2 | **lumo** | https://github.com/unleash-wp/lumo/pull/120 | grün |
| 3 | **lumo-agent-kit** | https://github.com/unleash-wp/lumo-agent-kit/pull/10 | grün |
| 4 | **lumo-action** | https://github.com/unleash-wp/lumo-action/pull/10 | grün |
| 5 | **lumo-wp** | https://github.com/unleash-wp/lumo-wp/pull/9 | grün |

Nach Merge von **lumo-pro** → Deploy / `job restart` (Mittwald). Dann LS + Smoke.

---

## 1. Lemon Squeezy — genau 5 Produkte anlegen

Namen **exakt** so (Invoice = LS-Name; Website = andere Spalte):

| # | LS-Produktname | Website-Name | Preis | Activations | Portal-Datei |
| --- | --- | --- | --- | --- | --- |
| 1 | **Lumo Agent Core** | Starter | **39 EUR / year** | 1 | Core-Zip |
| 2 | **Lumo Agent Pack** | Agent Team | **99 EUR / year** | 1 | Pack-Zip |
| 3 | **Lumo Freelancer** | Solo Hosted ★ | **149 EUR / year** | **1** | Pack-Zip (included) |
| 4 | **Lumo Pro** | Pro | **199 EUR / seat / year** | **1** pro Seat-Key | Pack-Zip (included) |
| 5 | **Lumo Agency** | Team 20 | **599 EUR / year** | **20** | Pack-Zip (included) |

**Money-back:** auf jeder Paid-Produktseite **30-day money-back** schreiben.

**Zips anhängen (absolute Pfade):**

```
/Users/benjaminzekavica/Projekte/lumo-agent-kit/dist/lumo-agent-core-2026-08-01.zip
/Users/benjaminzekavica/Projekte/lumo-agent-kit/dist/lumo-agent-pack-2026-08-01.zip
```

- Produkt 1 → **Core**-Zip  
- Produkt 2 → **Pack**-Zip  
- Produkte 3–5 → **dasselbe Pack**-Zip als included Download (kein zweiter Preis)

Rebuild falls nötig:

```bash
cd /Users/benjaminzekavica/Projekte/lumo-agent-kit
./bin/package-agent-core.sh
./bin/package-agent-pack.sh
```

---

## 2. Mittwald Env (nur drei Hosted-IDs)

Nach dem Anlegen: echte Product-IDs von Freelancer + Pro + Agency kopieren.

```bash
# NUR Freelancer + Pro + Agency. NIEMALS Core oder Pack hier rein.
LUMO_LS_PRODUCT_IDS=<freelancer_id>,<pro_id>,<agency_id>

LEMON_SQUEEZY_API_KEY=<ls_api_key>
LUMO_LS_STORE_ID=<store_id>
LEMON_SQUEEZY_WEBHOOK_SECRET=<webhook_signing_secret>

LUMO_ENV=production
LUMO_REQUIRE_AUTH=true
LUMO_TRUSTED_PROXY=1
LUMO_DB_PATH=<path_to_knowledge.db>
```

| LS-Produkt | In `LUMO_LS_PRODUCT_IDS`? |
| --- | --- |
| Lumo Agent Core | **Nein** |
| Lumo Agent Pack | **Nein** |
| Lumo Freelancer | **Ja** |
| Lumo Pro | **Ja** |
| Lumo Agency | **Ja** |

Core/Pack in dieser Liste = Hosted-MCP für File-only-Käufer. Fatal.

---

## 3. Webhook

In LS Dashboard:

```
https://mcp.unleash-wp.com/webhooks/lemon-squeezy
```

Signing secret = Wert von `LEMON_SQUEEZY_WEBHOOK_SECRET`.

Dann: Deploy / `job restart`. Knowledge seed falls Host-DB hinter Branch.

---

## 4. Smoke (nach Deploy)

```bash
# Free lokal (bis npm den Tag hat, Candidate-Branch):
npx -y github:unleash-wp/lumo#release/v1.0.0-go-live demo
# nach npm-Publish des Tags:
# npx @unleashwp/lumo demo

# Anonymous hosted → expect 401 + /connect im Body
curl -sS -o /tmp/lumo-401.txt -w '%{http_code}\n' \
  -X POST 'https://mcp.unleash-wp.com/mcp' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}'

# Connect-Seite: öffentliche Namen + Forge-Honesty
curl -sS 'https://mcp.unleash-wp.com/connect' | grep -E 'Starter|Agent Team|Solo Hosted|Team 20|Forge Hosted|install not yet|Vol\.1|149|199|599|39|99|Name glossary'

# Cursor-Rule
curl -sS 'https://mcp.unleash-wp.com/cursor/lumo.mdc' | head -40

# Paid Key (echten LS-Key einsetzen) → expect 200
curl -sS -o /tmp/lumo-paid.txt -w '%{http_code}\n' \
  -X POST 'https://mcp.unleash-wp.com/mcp' \
  -H "Authorization: Bearer YOUR_LS_KEY" \
  -H 'X-Lumo-Instance: smoke-day0' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}'
```

Zusätzlich (Kurz):

- Free / Core / Pack Key auf Hosted → **402**
- Paid: `lumo_lookup` mit `book-test-philosophy` · `lumo_check_code` auf HPOS-bad PHP
- GitHub Action unlicensed: Check **grün**, Annotation/Summary **„did not run“** (kein Clean-Claim)

---

## 5. www Pricing paste

Datei: `/Users/benjaminzekavica/Projekte/lumo/docs/website-pricing-table.md`

Paste auf die Pricing-Seite:

1. **§1** Name glossary  
2. **§2** Page layout (3 Solo-Cards, Free-Strip, Teams)  
3. **§7** Card copy (paste-ready)

Checks auf der live Page:

- Solo Hosted ★ = Best Value; Agent Team **nicht** starred  
- Forge: **Included entitlement. Hosted Forge install not yet available.**  
- Kein „Ready for WP 7.1“  
- 30-day money-back bei Paid  

Checkout-Links → die 5 LS-Produkte (§9 derselben Datei).

---

## 6. Taggen — erst nach grünem Smoke

```
lumo           → v1.0.0-go-live
lumo-pro       → v1.0.0-go-live
lumo-agent-kit → v1.0.0-go-live
lumo-action    → @v1 pin bleibt (kein neuer Tag nötig)
```

---

## Was ohne dich 100 % fertig ist

- Hosted Paid-Gate, 401/402, kein Self-hosted Pro  
- Connect + Cursor-Rule: öffentliche Namen, Forge-Honesty, Vol.1  
- Katalog ~192 published · Free-Snapshot · WP-7.1-Welle (ohne Ready-Claim)  
- 69 `book-*` Reference-Lookups (nie Catch)  
- Agent Core + Pack Zip-Builder + heutige Zips in `dist/`  
- Free CLI / Action / WP-Plugin: Honesty-Copy, Pro-URL  
- Pricing-Matrix + Sales-Checklist + dieser START-HERE  

---

## Was du nicht verkaufen darfst (heute)

| Thema | Wahrheit |
| --- | --- |
| AI Forge **Hosted** Install | Nur Entitlement; Install noch nicht verfügbar |
| „Ready for WP 7.1“ | Verboten; Coverage expanding |
| Hosted Trial-Keys | Gibt es nicht; Free lokal = Trial |

---

## Optional nach Go-Live (blockiert Launch nicht)

Auf älteren Commits am Branch steht noch `Co-authored-by: Cursor <cursoragent@cursor.com>` (u. a. lumo `223f78a`). Nach Launch: History cleanup wenn du willst. **Heute nicht anfassen.**

---

## Ein-Sitzung-Checkliste

1. [ ] 5 LS-Produkte + Zips + 30-day money-back  
2. [ ] Mittwald `LUMO_LS_PRODUCT_IDS` (nur 3 Hosted) + Secrets  
3. [ ] Webhook URL + Secret  
4. [ ] Merge PRs (Reihenfolge oben) → Deploy / `job restart`  
5. [ ] Smoke curls grün  
6. [ ] www §1 + §2 + §7 pasted  
7. [ ] Tags setzen  
8. [ ] Ersten echten Checkout testen  

Fertig. Verkauf starten.
