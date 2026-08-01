# Lumo — the best WordPress AI product (product definition)

English. This is the watcher product — not the ebook, not WordCamp promo.

## One sentence

**Lumo watches AI-written WordPress code and stops stale patterns before they ship — with a dated source, every time.**

## What is what

| Name | Job | Who |
| --- | --- | --- |
| **Lumo Free** | Local CLI + local MCP + AI Forge self-host (**no** UnleashWP hosted MCP) | Everyone trials on their machine |
| **Agent Core** | 39 €/yr · Currency Guard + Code Reviewer | Price-sensitive entry — files only |
| **Agent Pack** | 99 €/yr · 6 agents + skills + commands | Full team files — **free inside** Freelancer / Pro / Agency |
| **Freelancer** | 149 €/yr · 1 seat · **hosted** Pro MCP · no CI · Agent Pack · **Vol.1 living lookups** · **Forge Hosted** (entitlement; install not yet available) | Solos who need hosted depth |
| **Lumo Pro** | Hosted MCP only + CI gate · Pack · **Vol.1 lookups** · **Forge Hosted** (entitlement; install not yet available) — **no self-hosted Pro** | Senior, DevOps (~199 €/seat) |
| **Agency** | **20 seats** · Forge Hosted entitlement (install not yet available) · Pack · **Vol.1 lookups** - hosted MCP, not DIY Pro | Agency chef (~599 €) |
| **AI Forge** | Tool shelf. **Local** for Free; **Hosted entitlement** on **Freelancer / Pro / Agency** (install not yet available). Local UI may offer **DE** | Free self-host / paid hosted |
| **WordPress agent-skills** | The manual (how to build) | Complementary, not a rival |
| **Bookstore PDF (UnleashWP Learn Vol.1)** | Optional static print/PDF on Digistore24 — separate SKU | Readers who want paper |
| **Vol.1 living edition (MCP)** | **69 `lumo_lookup` reference entries** on Freelancer / Pro / Agency — not Catch, not PDF | Paid hosted seats |

## Why it wins

1. **Honesty first** — quiet ≠ clean; DID NOT RUN ≠ pass; Free ≠ Pro catalogue.
2. **Proof in 30 seconds** — `lumo demo` uses the real engine on samples.
3. **Whips the AI** — three layers (see below), not a polite suggestion.
4. **Paid job is clear** — CI gate + depth. Not a vague “AI suite”.
5. **One account** — Free → Skills / Freelancer → Pro → Agency / Forge without a second signup.

## How Lumo whips the AI (technical bar)

Erste Sahne means the model cannot casually ignore Lumo.

| Layer | Mechanism | Skip-proof? |
| --- | --- | --- |
| **1. Instruction** | Cursor `lumo.mdc` + `wp-binding` skill — MUST call `lumo_check_code` / `lumo_lookup` / `lumo_audit` | Soft (model can still cheat) |
| **2. Harness** | Claude PreToolUse `wp-enforce` — catch runs on Write/Edit before the edit lands | **Hard** (hook fires) |
| **3. Merge gate** | Pro GitHub Action — LOUD can fail the PR | **Hard** (CI) |

Product quality bar: catch engine precision (no false LOUD), honest coverage gaps,
dated sources, and layers 2–3 enabled wherever the customer can take them.
Layer 1 alone is not enough — ship connect + skills + hook path + CI path.

## First-win path (best product, not best brochure)

1. `npx @unleashwp/lumo demo` (Free proof, €0 host)
2. Free: local `lumo-mcp` + AI Forge self-host — **not** hosted MCP
3. Paid: https://mcp.unleash-wp.com/connect → Lemon Squeezy license → Cursor
4. Whip: rules / `wp-enforce` / (Pro) CI
5. Upgrade when they need hosted depth, CI, or Forge Hosted entitlement (install not yet available)

## Non-goals (Security and honesty)

- Not a linter for style.
- **Not a security / AppSec / pentest / compliance product.** Some always-wrong
  patterns (e.g. unprepared `$wpdb`) are engineering hygiene — they do not mean
  “your site is secure.” CISOs should not own this PO; DevOps/Quality should.
- Not “AI writes your plugin for you.”
- Not German as the Lumo product language (Forge UI may be DE).

## Who pays what (happy panel)

See [pricing-personas.md](./pricing-personas.md) and
[skills-pack.md](./skills-pack.md) · [freelancer-pack.md](./freelancer-pack.md):
Free (**local**) → **Agent Core 39 €** → **Agent Pack 99 €** → **Freelancer 149 €** (hosted) → Pro 199 € → Agency 599 € (20 seats).
Hosted MCP = paid only.

## Homepage rule

If removing the nav leaves a page that could be an ebook landing, the watcher brand is too weak. Hero must say **watcher**, show the owl as Lumo-the-product, and CTA to **demo** or **connect**.

**Vol.1 on homepage:** mention living edition as a **paid hosted benefit** (69 queryable lookups), not as the hero product. Bookstore PDF stays a separate link if sold.
