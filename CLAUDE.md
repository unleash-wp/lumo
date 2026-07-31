# UnleashWP Lumo — Free Agent (Claude Code: ZUERST lesen)

> Dieses Repo (`lumo`, **public**) = der **Free Agent**. Kanonische Spezifikation: Issue
> [unleash-wp/lumo-pro#1](https://github.com/unleash-wp/lumo-pro/issues/1) („Briefing") + die 4 dort angehängten
> KANONISCH-Docs. Der monetarisierbare MCP-Server + Directus liegt **separat in `unleash-wp/lumo-pro` (private)**.

## Arbeitsmodus — AUSNAHMSLOS

- **Antwortsprache: Deutsch** (mit Benjamin). **Produkt, Code, Content, GitHub-Tickets: Englisch.**
- **„Das Team" (claudekit) vor jeder Entscheidung konsultieren** (`ck-*` Engineering, `ckm-*` Marketing). Repo
  wird mit **claudekit-engineer** gescaffoldet.
- **Local-first.** Kein `git commit`/`push`/Deploy ohne ausdrückliche Freigabe. Nie direkt auf `main` —
  Feature-Branch → **`code-reviewer` (Pflicht) + `tester`** → Merge.

## BREAKING: Commit-Regel (verbindlich)

**In den Git-Commits darf NICHT erkennbar sein, dass eine KI gearbeitet hat.** Kein `Co-Authored-By: Claude …`,
kein „Generated with Claude Code", keine KI-Footer. Author/Committer = **Benjamin Zekavica**. Messages im
menschlichen Senior-Stil (englisch, knapp, WHY-not-WHAT, keine KI-Tells). Gilt auch für PR-Texte + Kommentare.

## Was das ist

**Lumo Free Agent** — ein **Claude-Code-Plugin** (public, GPL/MIT). Es auditiert/testet den WordPress-Dev-Code,
ist der **Distributionsmotor** der ganzen Strategie und **bewirbt aktiv das Pro-Upgrade** (Loss-Aversion).
- **Kein Pro-Inhalt, keine Server-Logik in diesem Repo.** Pro-Wissen + MCP-Server + Lizenz-Gating leben in
  `lumo-pro`.
- Verhältnis: Der Free Agent verteilt sich entwicklergetrieben und führt den **HPOS-Aha** vor; Lumo Pro ist die
  monetarisierbare Wissens-DB dahinter.
- **4 Säulen:** Wedge = **HPOS** · Defensibility = **Evidence-Layer** · Retention = **Pre-Release-Core-Briefings**
  · Gate = **founder-led Validierung (M4)**, Stopp-Regel Free→Paid < 2 %. ICP = WooCommerce-Agentur mit Custom
  Code + KI-Nutzung. Nie gegen Copilot/Cursor.

## Tech-Stack

**TypeScript / Node 22.** Claude-Code-Plugin, **Ein-Zeilen-Install**, vorkonfigurierte `.mcp.json` →
`https://mcp.unleashwp.de/mcp`. Lokaler Free-Snapshot. `/wp-check`-Command. Geteilte Tool-Signatur/Slug-**Typen**
als schlank **dupliziertes** File (kein privater Registry-Zwang im Open-Source-Repo).

## Free-Agent-Bausteine (Milestone M3)

- **Plugin-Erkennung:** `composer.json` → Verzeichnis-Scan → WP-CLI → Heuristik → `lumo_plugin_advice`-Matching.
- **Onboarding erzwingt den HPOS-Aha** (Falsch-vs-Korrekt aktiv vorführen, < 10 min).
- **Kontextueller Pro-Upgrade-Prompt:** Schwelle **3** gegated-Berührungen, **24h-Cooldown**, Loss-Aversion,
  Ein-Klick-Checkout, gedämpft nach Nicht-Klick. **Value-before-ask** — gegated wird *Tiefe*, nie die Antwort.
- **Tracking (opt-in, DSGVO):** install · activation (Aha) · PQL · checkout.
- **Caveat:** Plugin-Distribution ist 2026 noch jung — Fallback dokumentieren
  (`claude mcp add --transport http`, inkl. Windows).

## Wo liegt was

- **GitHub-Board:** [Lumo Launch (org/projects/1)](https://github.com/orgs/unleash-wp/projects/1). Issues in
  diesem Repo = **M3 — Free Agent**. Kanonische Spec: `lumo-pro#1`.
- **Pro-Repo (private):** `unleash-wp/lumo-pro` (MCP-Server + Directus + Lizenz-Gating).
- **WP-Konventionen (separater Website-Track, NICHT Teil von Lumo):** `Kreo-Pulse/gamesary-website`.

## Standards (kurz)

Public/GPL-MIT — **keine Pro-Inhalte, keine Secrets** ins Repo. Upgrade-Werbung ehrlich + hilfreich
(Cobra-Effekt vermeiden). Halluziniertes Wissen ist fataler als ein Code-Bug. SDK-Versionen pinnen.

## Arbeitsanweisung (kanonisch, repo-uebergreifend)

Die Orchestrierungs- und Ablaufregeln fuer alle UnleashWP-Arbeiten (Rollen,
Reviewer-Werkzeuge, Arbeitszyklus pro Paket, Eskalation, Produktgesetze) stehen an
einer Stelle: `/Users/benjaminzekavica/ai-forge-test/CLAUDE.md`. Bei Arbeiten in
diesem Repo zuerst lesen. Die repo-eigenen Standards oben haben Vorrang.
