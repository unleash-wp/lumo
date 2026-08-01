# Dogfood — Buy/Access NOW (alle SKUs) — 2026-08-01

Deutsch für Benjamin. Simuliertes Käufer-Panel: würde die Zielgruppe **jetzt**
zugreifen/kaufen — nach Quotas, Solo-CI-Block, Performance-Batch und
Core-sourced USP?

**Annahme:** Lemon Squeezy + Mittwald `/connect` gehen morgen live. Preise =
**locked table** (nicht die Founder-Empfehlung Pack 149 / Solo 229). Optional
Sensitivität: Solo **229 €** statt 149 €.

**Method:** Vier Close-Personas (Freelancer, Entwickler, Abteilungsleiter,
Agentur-Chef). Gleiches Set wie vorherige Dogfood-Runden. Jede Persona sieht die
volle Leiter ehrlich — inkl. Limits, Forge nicht live, 429 = Check lief nicht.

---

## Angebots-Tabelle (ehrlich präsentiert)

| Website | Preis | Was sie bekommen | Limits |
| --- | --- | --- | --- |
| **Free** | 0 | Lokaler Snapshot CLI/MCP, kein Pro-Server | — |
| **Starter** (Agent Core) | 39 €/J | 2 uwp-Agents + 2 Skills, **Dateien via R2**, teilbar | Kein Hosted MCP |
| **Agent Team** (Pack) | 99 €/J | 6 uwp + 9 Skills + 5 Cmds, R2-Dateien | Kein Hosted MCP |
| **Solo Hosted** ★ | 149 €/J · 1 Seat | Hosted MCP (Editor), Pack inkl., Forge-Entitlement (**Install nicht live**) | **1500 req/Tag · 30/min · kein GitHub-Action-CI** |
| **Pro** | 199 €/Seat/J | Hosted MCP + CI Action + Pack | **5000/Tag · 60/min · CI ja** |
| **Team 20** | 599 €/J · 20 Seats | Multi-Seat + CI | **20000/Tag · 120/min** |

**Querschnitt (allen Personas erklärt):**

- 14-Tage-Geld-zurück
- Tagesquota = Bremse gegen Key-Sharing; **429 = Check lief nicht** (kein „clean“)
- USP: Wissen aus WordPress-Core-Änderungen mit falsch→korrekt + Quelle + Version
- Skills/Agents auf File-Packs **teilbar auf Disk**; Hosted-Seats = **Aktivierungen** (Installationen), nicht Menschen
- Updates: Hosted live bei Deploy; Packs = Re-Download
- Performance-Batch (Catch/Quota-Gate): schnellerer Scan, ehrliche Caps sichtbar — kein neues Feature, aber Vertrauen

**Founder-Hinweis (nur Sensitivität):** Panel empfahl früher Pack 149 / Solo 229.
Diese Runde bewertet die **locked** Tabelle; Solo-229 wird extra gefragt.

---

## Executive Summary (DE) — blunt

**Würde die ICP jetzt zugreifen/kaufen? Ja — mit Reibung, nicht mit Applaus.**

| Persona | Jetzt? | Erste SKU | Blocker #1 |
| --- | --- | --- | --- |
| Freelancer | **YES** | Solo Hosted 149 | Forge nicht live (akzeptiert) |
| Entwickler | **LEAN YES** | Free → Solo 149 *oder* Pack 99 | Free-first-Gewohnheit; Pack-Teilbarkeit |
| Abteilungsleiter | **LEAN YES** | Pro 199/Seat | Kein Hosted-Trial; Finance-Beweis |
| Agentur-Chef | **YES** | Team 20 · 599 | Team-20k knapp bei Heavy-CI-Woche |

**Score:** 2× YES · 2× LEAN YES · 0× LEAN NO · 0× NO → **4/4 Kaufbereitschaft**
(sobald Checkout wirklich da ist).

**Was die neuen Hebel bewegen:**

1. **Quotas + Solo-CI-Block** — einstimmig **positiv**. Solo 1500/30 ohne CI ist
   kein Dealbreaker für Freelancer; für Abteilung/Agentur ist es der **richtige
   Push** Richtung Pro/Team. 429-Text als „did not run“ hält Vertrauen.
2. **Core-sourced USP** — differenziert gegen generische AI-Reviews; Entwickler
   und Abteilungsleiter kaufen deshalb **Hosted**, nicht nur Pack-Dateien.
3. **Pack-Teilbarkeit (R2)** — bleibt das **größte Leck**: 99 € für 6 Agents
   fürs Büro konkurriert mit Solo/Pro. Quotas stoppen MCP-Key-Sharing, **nicht**
   Disk-Kopie.
4. **Solo 229 €:** Freelancer → **LEAN YES** (kauft noch, meckert); Rest
   unverändert. Bei 149 € fühlt Solo wie ein Schnäppchen — Panel bestätigt
   Founder-Druck (+50 Pack→Solo zu wenig).

**Blunt ICP-Urteil:** Solo-Freelancer und Agentur-Chef zahlen **diese Woche**.
Entwickler und Abteilungsleiter brauchen **Free-Aha oder Finance-Beweis** — nicht
niedrigere Preise. Ohne live Checkout: **0 € Umsatz**, aber **kein „Markt sagt
Nein“**. Produkt + Preisleiter verkaufen; Delivery und Pack-Shareability sind
die echten Risiken.

---

## Matrix — Persona × Intent × SKU

| Persona | 1. Jetzt? | 2. Erste SKU | 3. Haupt-Blocker | 4. Quota stoppt Sharing? | 5. Free→Paid klar? |
| --- | --- | --- | --- | --- | --- |
| **Freelancer** | **YES** | Solo Hosted 149 | Forge nicht live (minor) | Ja (casual 2. User) | Ja |
| **Entwickler** | **LEAN YES** | Free → Solo 149 / Pack 99 | Pack-Kopie; npm vs RC | Ja (5× Solo-Paste tot) | Ja, Fork muss laut sein |
| **Abteilungsleiter** | **LEAN YES** | Pro 199/Seat | Kein Hosted-Trial | Ja (1 Key fürs Dept.) | Ja für CI-Story |
| **Agentur-Chef** | **YES** | Team 20 · 599 | 20k/Tag knapp; CI-Ops | Ja (Solo/Pro-Sharing tot) | Ja |

### Kompakt — Persona × SKU-Votes (YES / LEAN / NO)

| Persona ↓ · SKU → | Free | Starter 39 | Pack 99 | Solo 149 | Pro 199 | Team 599 |
| --- | --- | --- | --- | --- | --- | --- |
| **Freelancer** | YES | LEAN | LEAN | **YES ★** | NO | NO |
| **Entwickler** | **YES** | LEAN | YES (files) | **YES** (live) | LEAN | NO |
| **Abteilungsleiter** | YES | NO | LEAN (Risk) | LEAN | **YES ★** | YES (4+) |
| **Agentur-Chef** | LEAN | NO | LEAN (Risk) | NO | LEAN (1–3) | **YES ★** |

★ = erste bezahlte SKU bei „Jetzt kaufen“.

---

## Persona-Detail (5 Fragen je Persona)

### 1. Freelancer

**Job:** Stale-AI-Code in Cursor auf Kundenprojekten; eine Jahresrechnung.

| # | Antwort |
| --- | --- |
| **1. Jetzt?** | **YES** — Solo Hosted 149 €/J diese Woche, wenn Checkout + Key in 10 Min. |
| **2. Erste SKU** | **Solo Hosted 149**. Starter 39 nur bei knappem Cash; Pack 99 Sackgasse ohne Live-MCP. |
| **3. Blocker** | **Forge nicht live** — nervt, killt Kauf nicht, wenn Entitlement ehrlich. Quota **nicht** zu eng (1500 OK). Solo ohne CI **gewollt**. Preis 149 fühlt sich fair an. Trust: Free-`demo` reicht. |
| **4. Quotas vs. Sharing** | **Ja.** 1500/Tag + 429 „did not run“ stoppt „Key an Subcontractor“. Würde keinen zweiten Seat kaufen solange einer reicht — aber teilt nicht mehr leichtfertig. |
| **5. Free→Paid** | **Klar:** `demo` → LOUD → „live ACF/Woo/GF → Solo“. Pack-included verhindert Doppelkauf. |

**Solo 229 €?** **LEAN YES** — kauft noch, liest +80 € als „immer noch OK vs. Cursor-Pro“, vermisst das Schnäppchen-Gefühl von 149.

---

### 2. Entwickler

**Job:** Watcher auf Köder-PHP/`block.json` beweisen; dann Files vs. Hosted.

| # | Antwort |
| --- | --- |
| **1. Jetzt?** | **LEAN YES** — nicht Tag 1 ohne Free-Aha; **diese Woche** nach `demo` + einem echten `check`. |
| **2. Erste SKU** | **Free** → Fork: **Solo 149** (Live-Katalog) **oder** **Pack 99** (nur Disk, teilbar). |
| **3. Blocker** | **Pack-Teilbarkeit:** „Einmal 99 €, Ordner kopieren.“ Quota blockiert MCP-Key, nicht Zip. **Solo kein CI:** korrekt — würde Pro nur mit Merge-Pflicht. **Preis:** Pack 99 wirkt billig fürs ganze Team. npm vs. go-live-Branch Rest-Reibung. Forge: egal. |
| **4. Quotas vs. Sharing** | **Ja, Verhalten ändert sich.** Solo 1500 killt 5-Laptop-`mcp.json`. Empfiehlt dann Pack für Nicht-MCP-Juniors + Solo/Pro für Live. Soft-Warn @ 70 % erwartet. |
| **5. Free→Paid** | **Klar** wenn eine Zeile nach Aha: „Live Plugin-Katalog → Solo; nur Dateien → Pack (einfrieren am Kit-Datum).“ Core-USP (Version + Quelle) ist der Hosted-Grund. |

**Solo 229 €?** **LEAN YES** — tippt eher zu Solo statt Pack wenn Live nötig; bei 229 € lauter „Pack reicht fürs Büro“-Empfehlung an den Lead.

---

### 3. Abteilungsleiter

**Job:** Merge-Gate auf WordPress-PRs; Hosted-Tiefe; Budget pro Seat.

| # | Antwort |
| --- | --- |
| **1. Jetzt?** | **LEAN YES** — Job-Fit sofort; Kauf nach Free-LOUD-Screenshot + 14-Tage-MB-Zeile für Finance (1–2 Tage). |
| **2. Erste SKU** | **Pro 199 €/Seat**. Team 20 ab ~4 Seats. Solo nur ohne CI-Pflicht — dann trotzdem selten (1500 + kein Action). |
| **3. Blocker** | **Kein Hosted-Trial** (by design) — größter Blocker, nicht Quota. **Pro 5000/Tag:** OK pro Seat bei moderatem CI; **TOO LOW** wenn Finance einen Key fürs Team will (gewollter Push). Solo-CI-Block + niedrige Solo-Cap = **gute Budget-Story**. Forge: egal. Preis +50 € Solo→Pro für CI: vertretbar. |
| **4. Quotas vs. Sharing** | **Ja.** Ohne Tageslimit wäre ein Pro-Key fürs Dept. Standard. 5000/Seat → zweiter Seat oder Team 20. |
| **5. Free→Paid** | **Klar für CI:** Free beweist LOUD; Pro = Gate + höhere Cap. Pack-99-„ein Zip fürs Büro“ ist Finance-Risiko — Gegenargument: CI + Live-Updates + Bearer-Seats. |

**Solo 229 €?** **Unberührt** (kauft Pro). Bestätigt: Solo teurer macht Abteilung **nicht** zu Solo-Käufern.

---

### 4. Agentur-Chef

**Job:** Eine Shop-Lizenz; Seats für Devs; CI auf Client-Repos.

| # | Antwort |
| --- | --- |
| **1. Jetzt?** | **YES** — Team 20 · 599 €/J sobald Checkout + Seat-Smoke; kein Preis-Blocker. |
| **2. Erste SKU** | **Team 20 · 599**. Pro × 1–3 nur für Mini-Shop. Pack 99 = **Angriffsvektor** (ein Zip, ganze Agentur). |
| **3. Blocker** | **Quota 20k/Tag:** OK, an schweren CI-Tagen **knapp** (Panel: 25k wäre ruhiger — kein NO). **CI-Ops:** Secrets pro Client-Repo = echter Kostenfaktor (nicht auf Karte). Forge nicht live: akzeptiert. Solo/Pro-Sharing: durch Caps tot — **Feature, kein Bug**. |
| **4. Quotas vs. Sharing** | **Ja.** Historisch: ein Key, 20 Laptops. Solo 1500 / Pro 5000 erzwingen Team 20 oder ehrliche Seat-Zahl. Team-Bucket bleibt shared by design. |
| **5. Free→Paid** | **Klar:** Free für Dogfood; Agency-Close = Team 20. Pack nur für Juniors ohne MCP — nicht als Ersatz für Hosted. |

**Solo 229 €?** **Unberührt.** Pack 99 bleibt größere Commercial-Gefahr als Solo-Preis.

---

## Querschnitt — die 5 Fragen aggregiert

### 1. Jetzt kaufen/zugreifen?

| Intent | Anzahl |
| --- | --- |
| YES | 2 (Freelancer, Agentur-Chef) |
| LEAN YES | 2 (Entwickler, Abteilungsleiter) |
| LEAN NO | 0 |
| NO | 0 |

### 2. Erste SKU (Paid)

| SKU | Personas |
| --- | --- |
| Solo Hosted 149 | Freelancer (primary); Entwickler (live fork) |
| Pro 199/Seat | Abteilungsleiter |
| Team 20 · 599 | Agentur-Chef |
| Pack 99 | Entwickler (files-only path); **Risk-SKU** für Abteilung/Agentur |
| Starter 39 | Budget-Fallback only |
| Free | Entwickler wedge; alle Proof |

### 3. Blocker-Ranking (wie oft genannt)

| Blocker | Wer | Killt Kauf? |
| --- | --- | --- |
| Kein Hosted-Trial / Finance-Beweis | Abteilungsleiter | Verzögert, nicht NO |
| Pack teilbar (R2, kein MCP) | Entwickler, Abteilung, Agentur | Untergräbt Solo/Pro/Team |
| Forge nicht live | Alle Hosted | Nein, wenn ehrlich |
| Team 20k knapp | Agentur-Chef | Nein, Support-Thema |
| Quota zu eng | **Niemand** auf dem **richtigen** SKU | Nein |
| Solo kein CI | Nur wer CI braucht | Push zu Pro (gewollt) |
| Preis Solo 149 zu niedrig | Seller-Perspektive | Freelancer freut sich |

### 4. Quotas → weniger Key-Sharing / mehr Seats?

**Ja (4/4).** Solo 1500 und Pro 5000 sind die kommerzielle Bremse. File-Pack-Kopie
bleibt separater Kampf (Preis/Framing, nicht Quota).

### 5. Free → Paid klar?

**Ja (4/4)** mit Bedingung: Fork „Live vs. Files“ und CI-Story müssen **laut** bleiben
(Agent Team = files only · no hosted MCP · patterns freeze).

---

## Sensitivität Solo Hosted **229 €** (Founder-Empfehlung)

| Persona | Bei 149 € (locked) | Bei 229 € |
| --- | --- | --- |
| Freelancer | YES | **LEAN YES** — kauft, vermisst Deal |
| Entwickler | LEAN YES | LEAN YES — empfiehlt Pack öfter an Team |
| Abteilungsleiter | LEAN YES (Pro) | unverändert |
| Agentur-Chef | YES (Team) | unverändert |

**Fazit:** 229 € würde **nicht** die ICP killen; es schwächt Solo-Hero-Psychologie
und verstärkt Pack-99-Teilbarkeit. Locked 149 € maximiert Freelancer-YES.

---

## Was „Jetzt“ wirklich braucht (nicht Preis)

| P0 | Warum |
| --- | --- |
| LS Checkout + Portal-Zips live | Sonst 0 € trotz YES |
| `/connect` + Hosted-Smoke | Sonst Trust-Kollaps nach Kauf |
| Solo-CI-Gate + 429-Copy in Prod | Quota-Story muss Code matchen |
| Soft-Warn @ 70 % | 4/4 erwarten |
| Agent-Team „files only“ laut | Stoppt 99 €-Sackgasse |
| Free-LOUD-Media für Finance | Abteilungsleiter LEAN→YES |

---

## Blunt Schluss

**Die ICP würde jetzt zugreifen** — 4/4 YES oder LEAN YES auf der locked Tabelle,
**wenn** Lemon + Mittwald morgen wahr sind. Quotas und Solo-CI-Block **helfen**
dem Verkauf (Anti-Sharing, klare Leiter), sie blockieren nicht. Core-sourced USP
ist der Grund, Hosted zu kaufen statt nur Pack zu kopieren.

**Was noch fehlt für Umsatz:** Checkout, nicht Überzeugung. **Was langfristig
wehtut:** Pack 99 € als teilbares Team-Produkt — Quotas fixen das nicht.

Keine Preisänderung in diesem Dokument. Canonical Lock:
[website-pricing-table.md](./website-pricing-table.md) ·
[packages.md](./packages.md).

Vorläufer:
[dogfood-buy-intent-annual-2026-08-01.md](./dogfood-buy-intent-annual-2026-08-01.md) ·
[dogfood-daily-quota-panel-2026-08-01.md](./dogfood-daily-quota-panel-2026-08-01.md) ·
[dogfood-all-skus-buy-panel-2026-08-01.md](./dogfood-all-skus-buy-panel-2026-08-01.md) ·
[quota-sku-heart-test-2026-08-01.md](./quota-sku-heart-test-2026-08-01.md).
