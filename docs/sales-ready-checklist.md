# Sales-ready checklist (founder, Day 0)

English. Use with [START-HERE-GO-LIVE.md](./START-HERE-GO-LIVE.md) and [website-pricing-table.md](./website-pricing-table.md).
Do **not** invent Lemon Squeezy product ids. Create products first, then paste real ids.

**USP (say this first):** Knowledge curated from WordPress Core changes (Make/Core, Trac, handbooks, contributor pipeline), with wrong→correct, source, and version. Not AI training cutoffs. Free = local snapshot; Pro = live curated from Core. Quiet ≠ clean. Forge Hosted = entitlement only (install not yet available). Do not claim Ready for WP 7.1.

**Money-back:** Paid SKUs claim **14-day money-back** once Lemon Squeezy checkout is live
(already stated on pricing matrix footnotes and kit docs). Restate on LS product pages.
That refund line is the finance close for Abteilungsleiter when there is no hosted trial.

---

## Everyone buys (persona close map)

Canonical detail: [website-pricing-table.md §11](./website-pricing-table.md#11-everyone-buys-persona-close-map).

| Persona | Close SKU | One-line trigger |
| --- | --- | --- |
| Entwickler | Solo Hosted 149 or Agent Team 99 | After Free Aha: live catalogue vs files; Free freezes |
| Freelancer | Solo Hosted 149 ★ | Agent Team = files dead end; Solo includes Pack |
| Abteilungsleiter | Pro 199/seat | CI non-negotiable; Free proof + 14-day MB / dogfood key |
| Agentur-Chef | Team 20 · 599 | Default agency; ~4+ seats math |

**Founder actions still open (not code):**

| Action | Why |
| --- | --- |
| Share temporary dogfood / demo keys with Abteilungsleiter finance | No public hosted trial by design |
| Restate **14-day money-back** on every LS paid product page | Finance close without fake trial |
| Optional 60 s Free + Solo LOUD screenshot | Substitutes trial for deck/finance |
| **FOUNDERS-LOCKED:** refund window is **14 days** only | Do not advertise 30; do not cut price |

---

## Name glossary (canonical)

| Website name | LS / internal name | Price | Hosted MCP? |
| --- | --- | --- | --- |
| **Free** | Lumo Free | 0 € | Never |
| **Starter** | Lumo Agent Core | 39 €/yr | Never |
| **Agent Team** | Lumo Agent Pack | 99 €/yr | Never |
| **Solo Hosted** ★ | Lumo Freelancer | 149 €/yr | Yes · 1 seat |
| **Pro** | Lumo Pro | 199 €/seat/yr | Yes · 1 / seat |
| **Team 20** | Lumo Agency | 599 €/yr | Yes · 20 seats |

**Seat helper:** Pro for **1–3** seats with CI; **Team 20** from about **4** seats or one shop license (3×199 ≈ 599).

**Forge Hosted (Solo / Pro / Team 20):** Included entitlement. Hosted Forge install not yet available.

**WP 7.1:** From WordPress 7.1 the Post Editor is always iframed; Lumo watches `document`/`window` and admin-scoped CSS breaks. Coverage expanding. Do not claim Ready.

---

## Exact 5 Lemon Squeezy products to create


| # | LS product name (exact) | Website name | Price | Activations | Portal zip |
| --- | --- | --- | --- | --- | --- |
| 1 | **Lumo Agent Core** | Starter | 39 EUR / year | 1 | `lumo-agent-core-YYYY-MM-DD.zip` |
| 2 | **Lumo Agent Pack** | Agent Team | 99 EUR / year | 1 | `lumo-agent-pack-YYYY-MM-DD.zip` |
| 3 | **Lumo Freelancer** | Solo Hosted ★ | 149 EUR / year | **1** | Same Pack zip (included, no second charge) |
| 4 | **Lumo Pro** | Pro | 199 EUR / seat / year | **1** per seat key | Same Pack zip (included) |
| 5 | **Lumo Agency** | Team 20 | 599 EUR / year | **20** | Same Pack zip (included) |

---

## What goes in `LUMO_LS_PRODUCT_IDS`

**Only** the three hosted products (comma-separated Lemon Squeezy product ids):

```bash
LUMO_LS_PRODUCT_IDS=<freelancer_id>,<pro_id>,<agency_id>
```

| Product | In env? |
| --- | --- |
| Lumo Agent Core | **No** |
| Lumo Agent Pack | **No** |
| Lumo Freelancer | **Yes** |
| Lumo Pro | **Yes** |
| Lumo Agency | **Yes** |

Putting Core or Pack ids in that list would unlock hosted MCP for file-only buyers. Never do that.

---

## Day-0 click order (founder)

1. Create the **5** LS products above (names exact).
2. Attach Core zip to product 1, Pack zip to product 2; attach **Pack zip** to products 3–5 as included download.
3. Put Freelancer + Pro + Agency ids in Mittwald `LUMO_LS_PRODUCT_IDS` (exclude Core + Pack).
4. Webhook → `https://mcp.unleash-wp.com/webhooks/lemon-squeezy` + signing secret.
5. Deploy lumo-pro / `job restart`; seed knowledge if host DB lags branch.
6. Day-0 smoke: anonymous 401, free/core/pack 402, paid 200, connect names, Action unlicensed “did not run”.
7. Paste [website-pricing-table.md](./website-pricing-table.md) §2 + §7 (+ glossary §1) onto www pricing.
8. Tag `v1.0.0-go-live` only after smoke green.

---

## Free testers until npm publish

Published npm may lag this candidate.

| Goal | Command |
| --- | --- |
| Honesty demo (last published npm) | `npx @unleashwp/lumo demo` |
| Go-live candidate (demo / check / scan) | `npx -y github:unleash-wp/lumo#release/v1.0.0-go-live demo` (same for `check` / `scan`) |
| Local MCP from candidate | `npx -y -p github:unleash-wp/lumo#release/v1.0.0-go-live lumo-mcp` |

After npm publish of the go-live tag, prefer `npx @unleashwp/lumo …` again.

---

## Still not live (do not sell as shipped)

| Item | Status |
| --- | --- |
| AI Forge **Hosted** install | Entitlement only; install blocked until `ai-forge` unblocks |
| “Ready for WP 7.1” | Forbidden; say coverage expanding |
| Hosted trial keys | Not offered; Free local is the trial |

Canonical lock: [START-HERE-GO-LIVE.md](./START-HERE-GO-LIVE.md) · [website-pricing-table.md](./website-pricing-table.md) · [packages.md](./packages.md).
