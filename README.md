# UnleashWP Lumo

**The official WordPress skills are the manual. Lumo is the watcher.**

Your AI's WordPress knowledge stopped at its training cutoff. WordPress kept shipping. Lumo watches AI-written WordPress code and flags patterns that broke in a specific release — Core APIs, block and theme APIs, security fundamentals — the moment they are written, with the wrong-vs-correct fix and a dated source. Without being asked.

**MCP tools:** `lumo_audit` · `lumo_lookup` · `lumo_check_code` · **Transport:** stdio, runs locally · **Knowledge:** 42 curated, source-verified entries in Free; the full catalogue in Pro

---

## The 30-second proof

Nothing to paste, nothing to set up — this runs the real engine over four
bundled samples and prints what it finds:

```bash
npx @unleashwp/lumo demo
```

It says in its first line that those are samples, not your project. When you
want it on your own code, read on.

Ask any AI assistant for a WordPress image filter. Sooner or later it writes this:

```php
function my_theme_filter_images( $html ) {
    return wp_img_tag_add_decoding_attr( $html, 'the_content' );
}
add_filter( 'the_content', 'my_theme_filter_images' );
```

It looks fine. It compiles. It has been deprecated since WordPress 6.4 and throws a
deprecation notice on every modern install. Run the scan on your uncommitted changes
and Lumo catches it — unprompted:

```
$ npx @unleashwp/lumo scan
lumo scan: 1 LOUD finding in your current changes.

--- images.php ---
> ⚠️ Your AI suggested code that broke in WordPress 6.4.0.
> This was deprecated or removed in WordPress 6.4.0 (2026-06-21).
> Your model's training likely predates this release.

## wp_img_tag_add_decoding_attr() deprecated in WP 6.4 — use wp_img_tag_add_loading_optimization_attrs()

### ❌ Wrong
$img_html = wp_img_tag_add_decoding_attr( $img_html, 'custom-context' );

### ✅ Correct
$img_html = wp_img_tag_add_loading_optimization_attrs( $img_html, 'custom-context' );

**Source:** https://developer.wordpress.org/reference/functions/wp_img_tag_add_decoding_attr/
**Affected:** WordPress ≥ 6.4.0

Fix the LOUD finding above before committing.
```

(Output trimmed — the full catch includes the summary, a test step, and the knowledge
date. Reproduce it yourself: [docs/catch-demo.md](docs/catch-demo.md).)

Nobody asked Lumo to check. That is the product. The official [WordPress/agent-skills](https://github.com/WordPress/agent-skills) answer when your AI consults them; Lumo fires when your AI is wrong. Run both.

---

## Install

### Claude Code (primary)

```
/plugin marketplace add unleash-wp/lumo
/plugin install lumo@unleashwp-lumo
```

Then run once in your project to check your current changes:

```bash
npx @unleashwp/lumo scan
```

Lumo scans your uncommitted diff and prints either the flagged patterns (LOUD first) or an honest "scanned N files — clean as of {date}".

### Any MCP client (Cursor, Claude Desktop, …)

```bash
npm install -g @unleashwp/lumo
# MCP config: "command": "lumo-mcp", "args": [], "type": "stdio"
```

Or run from source without a global install:

```bash
git clone https://github.com/unleash-wp/lumo.git
cd lumo && npm install && npm run build
# MCP config: "command": "node", "args": ["/absolute/path/to/lumo/dist/mcp.mjs"]
```

Cursor setup, the `wp-binding` skill, and the edit-time enforcement hook: [docs/install.md](docs/install.md)

### CI (pull request review) — Lumo Pro

The GitHub Action is part of Lumo Pro and lives in its own repository:
[unleash-wp/lumo-action](https://github.com/unleash-wp/lumo-action). It needs a
licence key; without one it checks nothing and says so rather than reporting a
pass. The runner ships in this package as `lumo action`, so the free install
carries it, but running the gate is the paid part.

Locally, `lumo scan` checks your working tree with no licence at all.

---

## What Free does

Every catch shows five things: the wrong pattern, the correct replacement, the source URL, the affected version range, and a test step to run before shipping.

**Coverage — 42 entries, each verified against a primary source:**

- WordPress Core deprecations and removals, through WordPress 7.0 (PHP minimum, Interactivity API changes)
- Block editor basics: removed block APIs, `apiVersion` migration
- WordPress Abilities API: exposing abilities to MCP clients correctly
- Plugin standards: prefixing, ABSPATH guards, text domains, capability and nonce checks
- Security and repo hygiene: output escaping, committed `.env` files, hardcoded API keys
- Secure Custom Fields: what the WordPress fork actually ships

Not in Free: WooCommerce, ACF Pro, Elementor, Gravity Forms, Meta Box, Carbon Fields, the
block-theme and FSE currency layer, and the deprecation timeline. Lumo tells you when it
detects one of those rather than reporting a clean bill of health it cannot vouch for.

**Where it fires:**

- In chat — `lumo_check_code` runs over WordPress code as the AI writes it (`wp-binding` skill)
- `npx @unleashwp/lumo scan` — your uncommitted diff, from any terminal
- GitHub Action — review comment per finding on every PR; LOUD blocks the merge
- Claude Code `PreToolUse` hook — a stale edit is blocked before the file changes
- `/lumo:wp-check` (audit the project) and `/lumo:wp-onboard` (first-run walk-through)

**The precision model** — three tiers, no false alarms:

| Tier | Meaning | Action |
|---|---|---|
| **LOUD** | Certain, breaking, dated — version fact verified against source | Blocks (hook, Action) |
| **SOFT** | Real risk that depends on context — the condition is stated | Advisory |
| **SILENT** | Repository-state noise | Suppressed |

A LOUD catch requires a verified version fact. Without one it structurally degrades to SOFT — this is enforced in the data model, not by convention.

**Honest bounds:** Free is a snapshot — verified as of its release date, frozen until the next one. Commercial plugins (ACF Pro, Elementor Pro, Gravity Forms, Meta Box) are detected and named, not covered. The live layer is Pro.

---

## Lumo Pro — the flow

Free catches what already broke. Pro keeps your team ahead of what breaks next. Built for agencies: every employee and freelancer writing WordPress code with AI gets a seat, and every seat gets the same current knowledge.

**1. Live currency.** The Pro catalog is re-checked against every WordPress and WooCommerce release. Free's snapshot has a date on it; Pro doesn't need one.

**2. Pre-release Core briefings.** What breaks in the next WordPress release, before it ships. Your team stops writing a soon-dead pattern while it is still a warning, not a client incident.

**3. Commercial-plugin coverage.** Curated, source-verified entries for ACF Pro, Elementor Pro, Gravity Forms, and Meta Box — the plugins agency code actually touches, which the official GPL skills cannot cover by design.

**4. Upgrade compat reports.** `wp_compat_check` runs a site's detected stack against the full version matrix and produces the upgrade report you hand to the client — what breaks, where, and the fix for each item. The report you bill for.

**Terms:** annual license, per seat. 30-day money-back guarantee, no questions asked. Founding members get the founding rate and keep it for as long as their license renews.

**Founding access opens soon — watch this repo.** Checkout is not live yet; watchers are notified first when it opens.

---

## License

MIT for this repository. The Lumo Pro knowledge base is licensed separately.
