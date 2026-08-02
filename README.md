# UnleashWP Lumo

<p align="center">
  <img src="assets/lumo-owl-128.png" alt="Lumo owl - the WordPress code watcher" width="96" height="96" />
</p>

Lumo watches AI-written WordPress code and flags patterns that broke in a real release. Each finding includes the wrong pattern, the fix, a source URL, and the affected version.

Knowledge comes from WordPress Core changes (Make/Core, Trac, handbooks), not from model training cutoffs.

**Free:** Lumo plugin in [AI Forge](https://github.com/unleash-wp/ai-forge) plus `@unleashwp/lumo` for the local catch engine. No hosted MCP.

**Paid:** Hosted MCP at [mcp.unleash-wp.com](https://mcp.unleash-wp.com/connect) with a Lemon Squeezy license (Solo Hosted, Pro, Team 20). Starter and Agent Team are file packs only.

See [docs/packages.md](docs/packages.md) for the full ladder.

**MCP tools:** `lumo_audit` · `lumo_lookup` · `lumo_check_code`

---

## 30-second proof

```bash
npx @unleashwp/lumo demo
```

Then install Free locally or connect paid hosted MCP.

```bash
npm install -g @unleashwp/ai-forge @unleashwp/lumo
```

Open AI Forge → Plugins → paste `github:unleash-wp/lumo` → Install.

---

## Cursor / Claude

**Free (Forge plugin):**

1. `npm install -g @unleashwp/ai-forge @unleashwp/lumo`
2. AI Forge → Plugins → `github:unleash-wp/lumo`
3. Connect `uwp mcp` to your editor ([Forge handbook](https://unleash-wp.github.io/ai-forge/))

**Free (air-gap, no Forge):**

```bash
npx -y -p @unleashwp/lumo lumo-mcp
```

**Paid (hosted):**

1. Buy Solo Hosted, Pro, or Team 20.
2. Open https://mcp.unleash-wp.com/connect and paste the MCP JSON.

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

Full matrix: [docs/install.md](docs/install.md)

---

## CLI

| Command | What it does |
| --- | --- |
| `lumo demo` | Proof on sample files |
| `lumo check <file>` | Whole-file catch |
| `lumo scan` | Git diff only |
| `lumo mcp` | Local stdio MCP |

---

## Claude Code plugin

```
/plugin marketplace add unleash-wp/lumo
/plugin install lumo@unleashwp-lumo
```

---

## CI (Pro / Team 20)

[unleash-wp/lumo-action](https://github.com/unleash-wp/lumo-action) needs a license. Without one it checks nothing and says so.

---

## What Free covers

42 snapshot entries verified against primary sources: Core deprecations through WP 7.0, block basics, Abilities API, plugin standards, security fundamentals, Secure Custom Fields.

Commercial plugins (WooCommerce, ACF Pro, Elementor, and similar) are named when detected but not fully covered on Free. Live catalogue depth and CI are on paid hosted tiers.

**Precision tiers:**

| Tier | Meaning |
| --- | --- |
| LOUD | Breaking pattern with verified version fact |
| SOFT | Real risk; context stated |
| SILENT | Repo-state noise; suppressed |

A limit the scan hits is stated in the output. Silence is not a pass.

---

## Paid tiers (summary)

| Tier | Price | For |
| --- | --- | --- |
| Free | 0 € | Forge plugin + local engine |
| Starter | 39 €/yr | 2 agents on disk |
| Agent Team | 99 €/yr | 6 agents on disk |
| Solo Hosted ★ | 149 €/yr | Hosted MCP + Pack + Vol.1 |
| Pro | 199 €/seat/yr | + CI Action |
| Team 20 | 599 €/yr | 20 hosted seats + CI |

Details: [docs/packages.md](docs/packages.md) · [docs/website-sell-sheet.md](docs/website-sell-sheet.md)

14-day money-back when checkout is live. Lumo is not sold as AppSec.

---

## License

MIT for this repository. The Lumo Pro knowledge base is licensed separately.
