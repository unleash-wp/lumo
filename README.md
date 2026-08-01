# UnleashWP Lumo

<p align="center">
  <img src="assets/lumo-owl-128.png" alt="Lumo owl - the WordPress code watcher" width="96" height="96" />
</p>

**The WordPress agent skills are the manual. Lumo is the watcher.**

**Knowledge curated from WordPress Core changes** (Make/Core, Trac, handbooks, contributor pipeline), with wrong→correct, source, and version. Not AI training cutoffs.

Your AI stopped at its training cutoff. WordPress kept shipping. Lumo watches AI-written WordPress code and flags patterns that broke in a specific release, across Core APIs, block and theme APIs, and security fundamentals, the moment they are written. Quiet ≠ clean.

**Free = local snapshot.** Run Lumo + AI Forge on your machine; **no** UnleashWP hosted MCP.
**Paid = live curated from Core.** Solo Hosted / Pro / Team 20 → [connect](https://mcp.unleash-wp.com/connect) with a Lemon Squeezy license. **Starter** (39 €) / **Agent Team** (99 €) = files only. See [docs/packages.md](docs/packages.md).

**MCP tools:** `lumo_audit` · `lumo_lookup` · `lumo_check_code` · **Free:** local `lumo-mcp` · **Paid:** hosted MCP · **Knowledge:** Free snapshot vs Pro live catalogue

---

## Start here - become a believer in 30 seconds

```bash
npx @unleashwp/lumo demo
```

Real engine. Four samples. LOUD findings with sources. No account required for this proof.

Then: **Free** → local MCP (`npx -y -p @unleashwp/lumo lumo-mcp`) + AI Forge self-host.
**Paid** → Agent Team (files only) or [connect](https://mcp.unleash-wp.com/connect) with Solo Hosted / Pro / Team 20 → hosted MCP + **Forge Hosted entitlement** (install not yet available) + (Pro / Team 20) CI.

**Free testers of this go-live candidate** (until npm publish catches up):

```bash
npx -y github:unleash-wp/lumo#release/v1.0.0-go-live demo
npx -y github:unleash-wp/lumo#release/v1.0.0-go-live check path/to/file.php
```

Published `npx @unleashwp/lumo demo` still works for the honesty demo on the last npm release.

Products (do not mix): **Lumo** = watcher (English). **AI Forge** = tool shelf (DE optional in local UI). **Vol.1 living edition** = 69 MCP lookups on paid hosted seats (not PDF). Bookstore PDF = optional separate SKU.

**MCP tools:** `lumo_audit` · `lumo_lookup` · `lumo_check_code`

---

## Cursor / Claude

**Free (local):**

```bash
npx -y -p @unleashwp/lumo lumo-mcp
# + AI Forge self-host for the tool shelf
```

**Paid (hosted)** — Solo Hosted / Pro / Team 20 license:

1. Buy / open Lemon Squeezy portal.
2. Open https://mcp.unleash-wp.com/connect — paste MCP JSON + download `lumo.mdc`.
3. Whole files: `lumo check path/to/file.php` (scan is **diff-only**).

```json
{
  "mcpServers": {
    "lumo": {
      "url": "https://mcp.unleash-wp.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
    }
  }
}
```

Full install matrix: [docs/install.md](docs/install.md) · Product definition: [docs/lumo-product.md](docs/lumo-product.md)

---

## CLI

| Command | What it does |
| --- | --- |
| `lumo demo` | First-win proof on samples |
| `lumo check <file>` | Whole-file catch |
| `lumo scan` | Git **diff** only |
| `lumo mcp` | Local stdio MCP (air-gap) |

---

## The 30-second proof (demo)

```bash
npx @unleashwp/lumo demo
```

Then on your diff: `npx @unleashwp/lumo scan`. On a full file: `npx @unleashwp/lumo check file.php`.

Official [WordPress/agent-skills](https://github.com/WordPress/agent-skills) = the manual; Lumo = the watcher. Run both.

---

## Other install paths

### Claude Code plugin

```
/plugin marketplace add unleash-wp/lumo
/plugin install lumo@unleashwp-lumo
```

### Local MCP (offline Free snapshot)

```bash
npm install -g @unleashwp/lumo
# MCP: "command": "lumo-mcp", "args": [], "type": "stdio"
```

Full matrix: [docs/install.md](docs/install.md).

### CI (pull request review): Lumo Pro

[unleash-wp/lumo-action](https://github.com/unleash-wp/lumo-action) — licence
required; without one it checks nothing and says so rather than reporting a
pass. Same UnleashWP account / key as hosted Pro.

---

## What Free does

Every catch shows five things: the wrong pattern, the correct replacement, the source URL, the affected version range, and a test step to run before shipping.

**Coverage: 42 entries, each verified against a primary source:**

- WordPress Core deprecations and removals, through WordPress 7.0 (PHP minimum, Interactivity API changes)
- Block editor basics: removed block APIs, `apiVersion` migration
- WordPress Abilities API: exposing abilities to MCP clients correctly
- Plugin standards: prefixing, ABSPATH guards, text domains, capability and nonce checks
- Security and repo hygiene: output escaping, committed `.env` files, hardcoded API keys
- Secure Custom Fields: what the WordPress fork actually ships

Not in Free: WooCommerce, ACF Pro, Elementor, Gravity Forms, Meta Box, Carbon Fields, the
block-theme and FSE currency layer, and the deprecation timeline. Lumo tells you when it
detects one of those rather than reporting a clean bill of health it cannot vouch for.

**Where it fires (account-first):**

- Cursor / Claude after sign-in: hosted MCP + project rules → `lumo_check_code` /
  `lumo_audit` / `lumo_lookup` while you code
- Same account unlocks Pro depth and the CI Action — no second login
- Optional air-gap: `npx @unleashwp/lumo scan`, local `lumo-mcp`, Claude plugin
- Claude Code `PreToolUse` hook / `/lumo:wp-check` when using the plugin path

**The precision model:** three tiers, no false alarms:

| Tier | Meaning | Action |
|---|---|---|
| **LOUD** | Certain, breaking, dated; version fact verified against source | Blocks (hook, Action) |
| **SOFT** | Real risk that depends on context; the condition is stated | Advisory |
| **SILENT** | Repository-state noise | Suppressed |

A LOUD catch requires a verified version fact. Without one it structurally degrades to SOFT.

**Honest bounds:** Free depth is limited; quiet ≠ clean. Commercial plugins are
detected and named, not fully covered on Free. Live catalogue + evidence + CI
gate = Pro on the same UnleashWP account.

---

## Lumo Pro: same account, paid job

Free proves the watcher **locally**. Paid is the job on **our** host: full evidence,
deeper catalogue, pre-release briefings, commercial-plugin coverage, upgrade
compat reports, and (Pro / Team 20) the CI gate. **AI Forge Hosted** is an included
entitlement on **Solo Hosted / Pro / Team 20** (Hosted Forge install not yet available);
Free self-hosts AI Forge locally.

**Ladder (website names):**

| Tier | Price | For |
| --- | --- | --- |
| Free | 0 € | **Local** CLI + local MCP + Forge self-host (**no** hosted MCP) |
| **Starter** (Agent Core) | **39 €/yr** | 2 agents (Currency Guard + Reviewer) — entry under Agent Team |
| **Agent Team** (Agent Pack) | **99 €/yr** | 6 agents + skills + commands · **files only** (included free in Solo Hosted / Pro / Team 20) |
| **Solo Hosted** ★ (Freelancer) | **149 €/yr** · 1 seat | **Hosted** Pro MCP + **Vol.1 living lookups** + Forge Hosted entitlement (install not yet available) · **no CI** · Agent Team included |
| **Pro** | **199 €/yr** per seat | **Hosted only** + **CI Action** + **Vol.1 lookups** + Forge Hosted entitlement (install not yet available) · Pack included - no self-hosted Pro |
| **Team 20** (Agency) | **599 €/yr** | **20 seats** + Forge Hosted entitlement (install not yet available) · **Pack + Vol.1 lookups** · CI |

**Seat helper:** Pro for 1–3 seats with CI; Team 20 from about 4 seats (3×199 ≈ 599).

Pack details: [docs/packages.md](docs/packages.md) (canonical), [docs/website-pricing-table.md](docs/website-pricing-table.md), [docs/sales-ready-checklist.md](docs/sales-ready-checklist.md). 30-day money-back.
**Not sold as AppSec.** Checkout: Lemon Squeezy when variants are live.

---

## License

MIT for this repository. The Lumo Pro knowledge base is licensed separately.
