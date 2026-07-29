# UnleashWP Lumo

**The official WordPress skills are the manual. Lumo is the watcher.**

Your AI's WordPress knowledge stopped at its training cutoff. WordPress kept shipping. Lumo watches AI-written WordPress code and flags patterns that broke in a specific release — Core APIs, block.json/apiVersion, theme.json, WooCommerce/HPOS — the moment they are written, with the wrong-vs-correct fix and a dated source. Without being asked.

**MCP tools:** `lumo_audit` · `lumo_lookup` · `lumo_check_code` · **Transport:** stdio, runs locally · **Knowledge:** 142 curated, source-verified entries

---

## The 30-second proof

Ask any AI assistant for WooCommerce code that touches orders. Sooner or later it writes this:

```php
$orders = get_posts( array( 'post_type' => 'shop_order', 'numberposts' => 10 ) );
foreach ( $orders as $order_post ) {
    $email = get_post_meta( $order_post->ID, '_billing_email', true );
}
```

It looks fine. It compiles. It reads stale data on every store running WooCommerce 8.2 or later. Run the scan on your uncommitted changes and Lumo catches it — unprompted:

```
$ npx @unleashwp/lumo scan
lumo scan: 1 LOUD finding in your current changes.

--- includes/checkout.php ---
> ⚠️ Your AI suggested code that broke in WooCommerce 8.2.
> This was deprecated or removed in WooCommerce 8.2 (2026-06-20).
> Your model's training likely predates this release.

## WooCommerce HPOS: reading and writing order data

### ❌ Wrong (HPOS-unsafe)
$email = get_post_meta( $order_id, '_billing_email', true );
$orders = get_posts( array( 'post_type' => 'shop_order' ) );

### ✅ Correct
$order = wc_get_order( $order_id );
$email = $order->get_billing_email();
$order->update_meta_data( '_subscription_plan', 'pro' );
$order->save();

**Source:** https://github.com/woocommerce/woocommerce/wiki/High-Performance-Order-Storage-Upgrade-Recipe-Book
**Affected:** WooCommerce ≥ 8.2

Fix the LOUD finding above before committing.
```

(Output trimmed — the full catch includes the summary, a staging test step, and the knowledge date. Reproduce it yourself: [docs/catch-demo.md](docs/catch-demo.md).)

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

### GitHub Action (PR review)

```yaml
- uses: unleash-wp/lumo@v1
  with:
    fail_on_loud: 'true'   # LOUD findings fail the check; SOFT stays advisory
```

Full options, Cursor setup, the `wp-binding` skill, and the edit-time enforcement hook: [docs/install.md](docs/install.md)

---

## What Free does

Every catch shows five things: the wrong pattern, the correct replacement, the source URL, the affected version range, and a test step to run before shipping.

**Coverage — 142 entries, each verified against a primary source:**

- WordPress Core deprecations and removals, through WordPress 7.0 (PHP minimum, Interactivity API changes)
- Block editor: `apiVersion` 2→3, `useSetting()` → `useSettings()`, removed block APIs
- block.json and theme.json: v3 schema, `viewScriptModule`, per-block settings, style variations
- Block themes / FSE: template parts, patterns, the `get_header()`/`get_footer()` no-op trap
- Security and repo hygiene: output escaping, committed `.env` files, hardcoded API keys
- WooCommerce HPOS: order access via post tables vs. the order CRUD

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
