# Lumo go-live plan (canonical)

English. Locked 2026-08-01. Founder gate for Lemon Squeezy + deploy.

> **Founder (DE):** Dogfood für diesen Release Candidate = **Agent-Team-Persona-Testing-Mode**
> (simulierte Käufer-Personas gegen die locked Leiter), nicht Warten auf externe Kunden-Mails.
> Ablauf: Persona-Feedback → Freigabe der Fix-Liste → umsetzen → **danach** formaler
> Code-Review-Pass. Kein Review-Gate jetzt.
>
> Artefakt: [`dogfood-persona-feedback-2026-08-01.md`](./dogfood-persona-feedback-2026-08-01.md).
> Manual smoke sheet (optional later / invitees): [`customer-dogfood-test.md`](./customer-dogfood-test.md).
> Branch: `release/v1.0.0-go-live`.

---

## 1. Product lock

One global EUR price. No PPP. Quiet ≠ clean. Not AppSec.

### Name glossary (canonical)

| Website name | LS / internal name | Price |
| --- | --- | --- |
| **Free** | Lumo Free | 0 € |
| **Starter** | Lumo Agent Core | 39 €/yr |
| **Agent Team** | Lumo Agent Pack | 99 €/yr |
| **Solo Hosted** ★ | Lumo Freelancer | 149 €/yr |
| **Pro** | Lumo Pro | 199 €/seat/yr |
| **Team 20** | Lumo Agency | 599 €/yr |

Same block on [website-pricing-table.md](./website-pricing-table.md) §1 and `GET /connect`. Day-0 clicks: [sales-ready-checklist.md](./sales-ready-checklist.md).


| Package (LS / internal) | Website name      | Price             | Hosted MCP         | Vol.1 living knowledge               | Agent files        | CI gate | Forge Hosted       |
| ----------------------- | ----------------- | ----------------- | ------------------ | ------------------------------------ | ------------------ | ------- | ------------------ |
| **Lumo Free**           | Free              | 0 €               | **Never**          | Teaser copy only                     | —                  | —       | ○ (self-host only) |
| **Agent Core**          | **Starter**       | **39 €/yr**       | **Never**          | No                                   | 2 agents           | —       | ○ (self-host only) |
| **Agent Pack**          | **Agent Team**    | **99 €/yr**       | **Never**          | No (files only; optional PDF week-1) | 6 agents + skills  | —       | ○ (self-host only) |
| **Freelancer**          | **Solo Hosted** ★ | **149 €/yr**      | Yes · **1 seat**   | **Yes** · 69 `lumo_lookup` entries   | Full Pack included | —       | **● entitlement**  |
| **Lumo Pro**            | **Pro**           | **199 €/seat/yr** | Yes · hosted only  | **Yes**                              | Full Pack included | Yes     | **● entitlement**  |
| **Agency**              | **Team 20**       | **599 €/yr**      | Yes · **20 seats** | **Yes**                              | Full Pack included | Yes     | **● entitlement**  |




### Hard rules (non-negotiable)

1. Free / Core / Pack / Community `uwp.free.…` → **zero bytes** from `mcp.unleash-wp.com`.
2. **No self-hosted Pro** for customers. Paid = done-for-you hosted MCP.
3. **Full Agent Pack** included in Freelancer / Pro / Agency — never double-sell.
4. Core + Pack Lemon Squeezy product ids **out** of `LUMO_LS_PRODUCT_IDS`.
5. Freelancer + Pro + Agency ids **in** `LUMO_LS_PRODUCT_IDS`.
6. Vol.1 living edition = **69 reference-lane** `book-`* **entries** in Pro MCP via `lumo_lookup` only — **never Catch**. Not the 345-page PDF.
7. **AI Forge Hosted** is included on **Freelancer (Solo Hosted), Pro, and Agency (Team 20)** — not Free / Core / Pack. Customer line: **Included entitlement. Hosted Forge install not yet available.** Never sell as live-installable while `ai-forge` is blocked.
8. **Do not claim Ready for WP 7.1.** Catalogue has WP 7.0 + a **growing 7.1 wave** (Free Catch slice + Pro depth). Full 7.1 pack still open.
9. **Seat helper:** Pro for 1–3 seats with CI; Team 20 from about 4 seats or one shop license (3×199 ≈ 599).
10. Solo Hosted is the only starred solo card. Agent Team stays secondary (files only, no hosted MCP).



### Ladder (single line)

```
Free (local) → Starter 39 € → Agent Team 99 € → Solo Hosted 149 € → Pro 199 € → Team 20 · 599 € (20 seats)
```

Internal LS names: Agent Core · Agent Pack · Freelancer · Agency.

**Website display names + 3-card psychology:** [website-pricing-table.md](./website-pricing-table.md)
**Founder Day-0 sales clicks:** [sales-ready-checklist.md](./sales-ready-checklist.md)

---



## 2. Checklist status (engineering vs founder)

Legend: **DONE** = verified in this pass · **CODE-DONE** = in repo, needs deploy/credentials · **FOUNDER-ONLY** · **BLOCKED**

### Engineering (repos) — DONE

- [x] **DONE** Hosted paid gate (`hostedRequiresPaid`, 401/402 paths) — tests green
- [x] **DONE** No self-hosted Pro (`no-self-hosted-pro` tests)
- [x] **DONE** Community Free token → 402 on hosted
- [x] **DONE** Key quota + rate limits (paid tiers)
- [x] **DONE** Connect page + Cursor rule: public names + Forge Hosted on Solo/Pro/Team 20 + Vol.1 honesty (English only)
- [x] **DONE** Auth/copy: retired “Skills Pack 19” / “Freelancer Pack 39” language removed from shop-architecture, server-load, require-auth
- [x] **DONE** 69 `book-`* reference entries in Pro DB (reference lane, no Catch)
- [x] **DONE** WP 7.1 growing wave: Free Catch slice (6) + Pro depth (10) + catch tests; not Ready claim
- [x] **DONE** Abilities reference: `wp-abilities-domain-vs-projection` (lookup only)
- [x] **DONE** Agent Core + Pack zip scripts + COMMERCIAL public names + dated zips in `lumo-agent-kit/dist/`
- [x] **DONE** Free CLI help matches public ladder
- [x] **DONE** Product docs ladder locked (`packages.md`, harmony, personas, website-pricing-table, RELEASE)
- [x] **DONE** lumo-action: Pro / Team 20 CI; examples point at `https://mcp.unleash-wp.com` (not a fake self-host domain)
- [x] **DONE** lumo-wp: socket-only; README states no customer self-hosted Pro
- [x] **DONE** website-pricing-table catalogue counts match capability-inventory (177 / 95 / 42)



### Must-do before public checkout — CODE-DONE / FOUNDER-ONLY

- [ ] **CODE-DONE** Deploy lumo-pro with updated `/connect` + Vol.1 honesty + new knowledge seed
- [ ] **FOUNDER-ONLY** Smoke: anonymous 401, free/core/pack 402, paid key 200 (needs live LS key)
- [ ] **CODE-DONE** `GET /connect` shows Starter 39 / Agent Team 99 / Solo Hosted 149 / Pro 199 / Team 20 · 599 + Vol.1 + Forge Hosted (verified in source; confirm after deploy)
- [ ] **FOUNDER-ONLY** `npm run verify:knowledge` on production DB after seed (Docker on host)

---



## 3. FOUNDER-ONLY remaining (blocks revenue, not more product code)


| #   | Action                                                                                                       | Why              |
| --- | ------------------------------------------------------------------------------------------------------------ | ---------------- |
| 1   | Create **5** Lemon Squeezy products (Core 39, Pack 99, Freelancer 149, Pro 199, Agency 599 · 20 activations) | Checkout SKUs    |
| 2   | Set Mittwald `LUMO_LS_PRODUCT_IDS=<freelancer>,<pro>,<agency>` — **exclude** Core + Pack                     | Hosted unlock    |
| 3   | Webhook → `https://mcp.unleash-wp.com/webhooks/lemon-squeezy` + signing secret                               | Entitlement sync |
| 4   | LS portal: Core zip + Pack zip download links; paid buyers get Pack without second charge                    | File delivery    |
| 5   | www pricing page paste from [website-pricing-table.md](./website-pricing-table.md)                           | Marketing match  |
| 6   | Tag `v1.0.0-go-live` on lumo + lumo-pro + lumo-agent-kit after deploy smoke                                  | Release marker   |
| 7   | Day-0 smoke table (§6) including Action unlicensed green + visible “did not run”                             | Honesty          |


---



## 4. Positioning / GTM one-pagers



### Hero lines (site + connect)


| Surface             | Line                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary hero**    | The WordPress AI code watcher. Stops stale patterns before they ship — with a dated source, every time.                                                  |
| **30-second proof** | `npx @unleashwp/lumo demo` — real engine, four samples, LOUD findings. No account.                                                                       |
| **Paid hero**       | Done-for-you hosted MCP. Paste your license, catch stale AI code in Cursor — UnleashWP hosts the knowledge.                                              |
| **Vol.1 honesty**   | UnleashWP Learn Vol.1 lives inside paid MCP as **69 living lookups** — queryable in your IDE, updated per release. Not a PDF download. Not a Catch rule. |




### Persona pitches


| Persona                  | Pitch                                                                                                   | SKU                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Price-sensitive solo** | Two specialists that catch stale block/theme code — 39 €/year. Upgrade when you need the full team.     | Starter 39                  |
| **Kit buyer**            | Your WordPress agent team - 6 specialists + skills + commands, 99 €/year. Files only; no hosted MCP. Need live catalogue? Solo Hosted 149. | Agent Team 99               |
| **Freelancer in Cursor** | Live Pro depth in the editor + full Agent Pack. Forge Hosted entitlement (install not yet available). 149 €/year, one seat, no CI tax. | Solo Hosted 149             |
| **Senior / DevOps**      | Hosted MCP + merge gate + Vol.1 engineering lookups. Forge Hosted entitlement. 199 €/seat. Prefer Pro for 1–3 CI seats. | Pro 199                     |
| **Agency chef**          | Twenty hosted seats + full Pack + CI. Forge Hosted entitlement. 599 €/year. From ~4 seats choose Team 20 (3×199 ≈ 599). | Team 20 · 599               |
| **Security lead**        | Lumo catches known-bad engineering patterns with sources. It is **not** AppSec, pentest, or compliance. | Any tier (set expectations) |




### Competitive frame

- WordPress agent-skills = the manual (how to build).
- Lumo = the watcher (what breaks on your stack).
- AI Forge = the tool shelf (local Free; **Hosted entitlement** on Solo Hosted / Pro / Team 20 — install not yet available).
- Bookstore PDF = optional static anchor; living Vol.1 = paid MCP lookups.

---



## 5. Vol.1 honest packaging



### What it is (codebase fact)

- **69 reference-lane entries** (`book-`* slugs) in lumo-pro knowledge DB.
- Retrieval via `lumo_lookup` **only** — advisory/reference lane, **never fires as Catch**.
- Distils **32 of 37** UnleashWP Learn Vol.1 chapters into queryable MCP answers.
- Full Pro catalogue ~**177** published entries (frontier + plugins + book reference + 7.1 first wave + Abilities reference).



### What it is not

- Not the 345-page PDF (bookstore may sell that separately).
- Not included in Free, Agent Core, or Agent Pack (files-only tiers).
- Not a Catch scan — agents do not auto-flag book patterns in diffs.



### Customer-facing honesty line (use everywhere)

> **UnleashWP Learn Vol.1 (living edition)** — 69 engineering reference lookups in hosted MCP, updated as WordPress ships. Query in your IDE via `lumo_lookup`. This is not the print/PDF edition and does not run as automatic code checks.

---



## 6. Day-0 smoke tests

Run in order after deploy + LS products live.


| #   | Test                                                      | Expected                                                                                  |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | `npx @unleashwp/lumo demo`                                | LOUD findings, sources, no account                                                        |
| 2   | `POST /mcp` no Bearer                                     | **401** + connect URL                                                                     |
| 3   | Community Free / Core / Pack-only Bearer                  | **402** + local fallback message                                                          |
| 4   | Freelancer test key + `X-Lumo-Instance`                   | **200** · tools list                                                                      |
| 5   | `lumo_lookup` slug `book-test-philosophy` (paid)          | Reference answer, not Catch                                                               |
| 6   | `lumo_check_code` on HPOS-bad snippet (paid)              | LOUD finding                                                                              |
| 7   | `GET /connect`                                            | Starter 39, Agent Team 99, Solo Hosted 149, Pro 199, Team 20 · 599 · Vol.1 · Forge Hosted |
| 8   | `GET /cursor/lumo.mdc`                                    | English, MUST call tools, public ladder                                                   |
| 9   | Refund test order → webhook                               | Next MCP call → free/402                                                                  |
| 10  | GitHub Action without licence                             | Green check + visible “did not run” (not false pass)                                      |
| 11  | `lumo_lookup` `wp-abilities-domain-vs-projection`         | Reference answer                                                                          |
| 12  | `lumo_check_code` on `wp_classic_block_supports_inserter` | Finding for 7.1 reversal                                                                  |


---



## 6b. Buyer verification (per tier)

Honest ICP smoke path. **Free is the trial** (no hosted trial keys, no sandbox seats).
Money-back **30 days** is claimed on paid SKUs after LS checkout exists; it is not a
pre-purchase hosted demo. Quiet ≠ clean on every path below.


| Tier                | Pre-purchase                                                     | After purchase (when LS + portal live)                                                                                                                                           | Verdict today                                                                  |
| ------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Free**            | `npx @unleashwp/lumo demo` · `check` · `scan` · local `lumo-mcp` | Same                                                                                                                                                                             | **Yes**                                                                        |
| **Starter 39**      | Free path only                                                   | Unzip Core → attach Currency Guard / Code Reviewer → review a known-bad `block.json` / PHP file                                                                                  | **Partial** (files; no live MCP)                                               |
| **Agent Team 99**   | Free path only                                                   | Unzip Pack → invoke Woo / Plugin / Security role on bait file                                                                                                                    | **Partial** (bundled patterns frozen at kit date)                              |
| **Solo Hosted 149** | Free path only · no trial key                                    | Paste LS key on [connect](https://mcp.unleash-wp.com/connect) → Cursor MCP → `lumo_check_code` on HPOS-bad PHP · `lumo_lookup book-test-philosophy` · optional lumo-wp abilities | **Partial** until LS + deploy smoke; **Forge Hosted not testable**             |
| **Pro 199**         | Same as Solo                                                     | Solo steps + Action with `LUMO_LICENSE_KEY` on a PR with bad PHP → LOUD comment / fail when enforced                                                                             | **Partial** (CI needs secrets + paid seat)                                     |
| **Team 20 · 599**   | Same as Pro                                                      | Pro steps × second seat (activation limit)                                                                                                                                       | **Partial** (same blockers; seat math untested by buyers without two machines) |




### What proves “it works” vs “files installed”


| Proof               | Means                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Works (watcher)** | LOUD finding with source on a known-bad snippet (`demo`, `check`, hosted `lumo_check_code`, Action review comment)      |
| **Works (lookup)**  | Paid `lumo_lookup` returns a reference answer for a real slug (e.g. `book-test-philosophy`)                             |
| **Works (honesty)** | Unlicensed Action stays green and says gate **did not run**; Free quiet scan states scope, not cleanliness              |
| **Files only**      | Agents / rules / skills appear in Claude / Cursor / Codex after copy — does **not** prove catch depth or live catalogue |




### ICP smoke steps (<15 min each, when delivery exists)

1. **Free (everyone’s honesty demo):** `npx @unleashwp/lumo demo` → four LOUD samples. Optional: drop bad HPOS PHP → `lumo check that-file.php`.
2. **Starter / Agent Team:** Install zip per `lumo-agent-kit` INSTALL-CROSS-TOOL.md → ask the agent to review bait code → expect bundled-pattern finding **or** explicit “MCP not connected” note. Hosted `/mcp` with Core/Pack key must **402**.
3. **Solo Hosted:** Connect page → Bearer in Cursor → tool list **200** → `lumo_check_code` (LOUD) + `lumo_lookup` Vol.1 slug. Do **not** expect Forge Hosted until `ai-forge` install is unblocked.
4. **Pro / Team 20:** Solo steps + workflow with `unleash-wp/lumo-action@v1` + secrets → LOUD on bad PR; second run without secrets → green + “did not run”.
5. **lumo-wp (paid hosted):** Settings → licence + server → status endpoint honest on failure → `lumo/check-code` ability returns findings (not empty `findings` with a false clean flag).



### Gaps that block “target audience can verify” today

- Lemon Squeezy **five products + webhook + portal zip links** still founder-gated (go-live §3) — buyers cannot buy or download kits from production yet.
- **No trial / sandbox hosted keys.** Free local is the only zero-card proof.
- **AI Forge Hosted** entitlement on Solo/Pro/Team 20 is packaging-only; install path blocked (`ai-forge#20`).
- **Automated LS → zip entitlement** still Week-1 P1 — Pack-included-with-hosted may be manual.
- CI verification needs a GitHub repo + secrets; fork PRs never get a key.
- Community Free token issuance is backlog P3; even if issued, hosted returns **402** by design.
- Day-0 founder smoke (§6) is not yet a public buyer checklist on www.

---



## 7. Week-1 backlog


| Item                                                                        | Priority | Owner               |
| --------------------------------------------------------------------------- | -------- | ------------------- |
| Automated LS → zip download entitlement API                                 | P1       | Engineering         |
| Optional Vol.1 PDF bundle for Pack buyers (manual LS file)                  | P2       | Founder             |
| Checkout upsell Starter → Agent Team                                        | P2       | Founder + marketing |
| First Core/Block pre-release briefing (retention moat)                      | P1       | Founder voice       |
| www homepage hero refresh (watcher-first, not ebook)                        | P1       | Marketing           |
| WP 7.1 wave 2 (router replacement when API ships; DataViews; knowledge CPT) | P1       | Curation            |
| Abilities: category hook timing + readonly-but-mutates Catch                | P2       | Curation            |
| Community token issuance flow (if still offered)                            | P3       | Engineering         |
| Self-service seat deactivate in portal                                      | P3       | Engineering         |


---



## 8. Release version checklist


| Repo                        | Tag              | Ships                                                                         |
| --------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| `unleash-wp/lumo`           | `v1.0.0-go-live` | CLI, local MCP, docs, demo, Free snapshot                                     |
| `unleash-wp/lumo-pro`       | `v1.0.0-go-live` | Hosted MCP, connect page, Pro DB (~177 entries incl. 69 book refs), auth gate |
| `unleash-wp/lumo-agent-kit` | `v1.0.0-go-live` | Core + Pack zips, COMMERCIAL.md                                               |
| `unleash-wp/lumo-action`    | pin `@v1`        | CI manifest (Pro / Team 20 same licence path)                                 |


Pre-tag commands: see [RELEASE.md](./RELEASE.md).

---



## 9. Day 0 execute (founder copy-paste)

**Sales path only.** Short checklist: [sales-ready-checklist.md](./sales-ready-checklist.md).
Do these in order. Do **not** invent Lemon Squeezy product ids — create products first, then paste real ids.

**Money-back:** Paid SKUs claim **30-day money-back** on LS product pages once checkout is live (already in the pricing matrix).

### A. Lemon Squeezy — create exactly 5 products


| #   | LS product name (exact) | Website name | Price                 | License activations | Portal file |
| --- | ----------------------- | ------------ | --------------------- | ------------------- | ----------- |
| 1   | **Lumo Agent Core**     | Starter      | 39 EUR / year         | 1                   | `lumo-agent-core-YYYY-MM-DD.zip` |
| 2   | **Lumo Agent Pack**     | Agent Team   | 99 EUR / year         | 1                   | `lumo-agent-pack-YYYY-MM-DD.zip` |
| 3   | **Lumo Freelancer**     | Solo Hosted ★ | 149 EUR / year       | **1**               | Pack zip included (no second charge) |
| 4   | **Lumo Pro**            | Pro          | 199 EUR / seat / year | **1** per seat key  | Pack zip included |
| 5   | **Lumo Agency**         | Team 20      | 599 EUR / year        | **20**              | Pack zip included |


Portal: attach Core zip to product 1, Pack zip to product 2. On products 3–5, attach the **same Pack zip** as a free download (included, no second charge).

### B. Mittwald env — only three ids in `LUMO_LS_PRODUCT_IDS`

After you have the three **hosted** product ids from LS (Freelancer, Pro, Agency):

```bash
# Replace <…> with real Lemon Squeezy product ids.
# ONLY Freelancer + Pro + Agency. Do NOT put Core or Pack ids here.
LUMO_LS_PRODUCT_IDS=<freelancer_id>,<pro_id>,<agency_id>

LEMON_SQUEEZY_API_KEY=<ls_api_key>
LUMO_LS_STORE_ID=<store_id>
LEMON_SQUEEZY_WEBHOOK_SECRET=<webhook_signing_secret>

LUMO_ENV=production
LUMO_REQUIRE_AUTH=true
LUMO_TRUSTED_PROXY=1
LUMO_DB_PATH=<path_to_knowledge.db>
```

| LS product | In `LUMO_LS_PRODUCT_IDS`? |
| --- | --- |
| Lumo Agent Core | **No** |
| Lumo Agent Pack | **No** |
| Lumo Freelancer | **Yes** |
| Lumo Pro | **Yes** |
| Lumo Agency | **Yes** |

Webhook URL in LS dashboard:

```
https://mcp.unleash-wp.com/webhooks/lemon-squeezy
```

Then: deploy / `job restart` per lumo-pro `docs/deployment-runbook.md`. Seed knowledge if the host DB is behind branch seed.

### C. Smoke curls (after deploy)

```bash
# 1) Free proof (local, no account) — published npm for demo;
#    go-live candidate until npm publish:
#    npx -y github:unleash-wp/lumo#release/v1.0.0-go-live demo
npx @unleashwp/lumo demo

# 2) Anonymous hosted → 401
curl -sS -o /tmp/lumo-401.txt -w '%{http_code}\n' \
  -X POST 'https://mcp.unleash-wp.com/mcp' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}'
# expect: 401 ; body mentions /connect

# 3) Connect page public names + Forge honesty
curl -sS 'https://mcp.unleash-wp.com/connect' | grep -E 'Starter|Agent Team|Solo Hosted|Team 20|Forge Hosted|install not yet|Vol\.1|149|199|599|39|99|Name glossary'

# 4) Cursor rule
curl -sS 'https://mcp.unleash-wp.com/cursor/lumo.mdc' | head -40

# 5) Paid key (replace YOUR_LS_KEY) → 200 / tools
curl -sS -o /tmp/lumo-paid.txt -w '%{http_code}\n' \
  -X POST 'https://mcp.unleash-wp.com/mcp' \
  -H "Authorization: Bearer YOUR_LS_KEY" \
  -H 'X-Lumo-Instance: smoke-day0' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}'
```

Then run the full Day-0 table in §6 (lookup `book-test-philosophy`, check HPOS-bad PHP, Action unlicensed green + “did not run”).

### D. www

Paste [website-pricing-table.md](./website-pricing-table.md) **§1 glossary + §2 layout + §7 cards** into the pricing page. Hero: §4 of this file.
Confirm Forge line reads **included entitlement / Hosted Forge install not yet available**. Confirm Solo Hosted ★ is Best Value; Agent Team not starred.

### E. Tags (only after smoke green)

```
lumo           → v1.0.0-go-live
lumo-pro       → v1.0.0-go-live
lumo-agent-kit → v1.0.0-go-live
lumo-action    → keep @v1 pin
```



### Still BLOCKED (not founder clicks)


| Item                               | Status                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| **AI Forge Hosted** live install   | **BLOCKED** — entitlement packaging only on Solo/Pro/Team 20; customer line: install not yet available |
| Full WP **7.1** curated pack       | Open curation (first wave shipped; do not claim ready)                                |
| Automated LS → zip entitlement API | Week-1 P1                                                                             |
| Hosted trial / sandbox keys        | Not offered; Free local is the trial                                                  |


Canonical ladder doc: [packages.md](./packages.md). Ops mirror: lumo-pro `docs/packages.md`. Licensing: lumo-pro `docs/licensing-runbook.md`. Sales checklist: [sales-ready-checklist.md](./sales-ready-checklist.md).