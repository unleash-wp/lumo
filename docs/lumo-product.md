# Lumo — the best WordPress AI product (product definition)

English. This is the watcher product — not the ebook, not WordCamp promo.

## One sentence

**Knowledge curated from WordPress Core changes (Make/Core, Trac, handbooks, contributor pipeline), with wrong→correct, source, and version. Not AI training cutoffs.**

Lumo watches AI-written WordPress code and stops stale patterns before they ship. Free = local snapshot. Pro = live curated knowledge that tracks Core. Quiet ≠ clean.

## What is what

| Name | Job | Who |
| --- | --- | --- |
| **Lumo Free** | **AI Forge plugin** (`github:unleash-wp/lumo`) + `@unleashwp/lumo` catch engine on local Forge (**no** UnleashWP hosted MCP) | Everyone trials on their machine |
| **Agent Core** | 39 €/yr · Currency Guard + Code Reviewer | Price-sensitive entry — files only |
| **Agent Pack** | 99 €/yr · 6 agents + skills + commands | Full team files — **free inside** Freelancer / Pro / Agency |
| **Freelancer** | 149 €/yr · 1 seat · **hosted** Pro MCP · no CI · Agent Pack · **Vol.1 living lookups** · **Forge Hosted** (entitlement; install not yet available) | Solos who need hosted depth |
| **Lumo Pro** | Hosted MCP only + CI gate · Pack · **Vol.1 lookups** · **Forge Hosted** (entitlement; install not yet available) — **no self-hosted Pro** | Senior, DevOps (~199 €/seat) |
| **Agency** | **20 seats** · Forge Hosted entitlement (install not yet available) · Pack · **Vol.1 lookups** - hosted MCP, not DIY Pro | Agency chef (~599 €) |
| **AI Forge** | **Host / plugin runtime.** Local for Free; **Hosted entitlement** on **Freelancer / Pro / Agency** (install not yet available). Local UI may offer **DE** | Lumo Free installs here as a plugin |
| **WordPress agent-skills** | The manual (how to build) | Complementary, not a rival |
| **Bookstore PDF (UnleashWP Learn Vol.1)** | Optional static print/PDF on Digistore24 — separate SKU | Readers who want paper |
| **Vol.1 living edition (MCP)** | **69 `lumo_lookup` reference entries** on Freelancer / Pro / Agency — not Catch, not PDF | Paid hosted seats |

## Why it wins

1. **Core-sourced knowledge:** curated from Core release notes, Make/Core, Trac, handbooks, and the contributor pipeline; evidence is wrong→correct + source + version absorbed in the answer (not a cited blog post or slug alone). Agents and MCP callers must relay the patterns, not defer with "read the dev note".
2. **Honesty first:** quiet ≠ clean; DID NOT RUN ≠ pass; Free snapshot ≠ Pro live catalogue.
3. **Proof in 30 seconds:** `lumo demo` uses the real engine on samples.
4. **Whips the AI:** three layers (see below), not a polite suggestion.
5. **Paid job is clear:** live Core-tracking depth + CI gate. Not a vague “AI suite”.
6. **One account:** Free → Skills / Freelancer → Pro → Agency / Forge without a second signup.

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
2. Free: AI Forge host + Lumo plugin (`github:unleash-wp/lumo`) + `@unleashwp/lumo` engine — **not** hosted MCP
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

See [website-pricing-table.md](./website-pricing-table.md) and
[skills-pack.md](./skills-pack.md) · [freelancer-pack.md](./freelancer-pack.md):
Free (**local**) → **Agent Core 39 €** → **Agent Pack 99 €** → **Freelancer 149 €** (hosted) → Pro 199 € → Agency 599 € (20 seats).
Hosted MCP = paid only.

## Homepage rule

If removing the nav leaves a page that could be an ebook landing, the watcher brand is too weak. Hero must say **watcher**, show the owl as Lumo-the-product, and CTA to **demo** or **connect**.

**Vol.1 on homepage:** mention living edition as a **paid hosted benefit** (69 queryable lookups), not as the hero product. Bookstore PDF stays a separate link if sold.
