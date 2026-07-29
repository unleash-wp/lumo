# The Catch Demo — reproducible in 30–90 seconds

The flagship demo: AI-typical WooCommerce code that reads orders from the post
tables, caught LOUD by Lumo with a dated source and the correct pattern. Every
output block below is captured verbatim from `lumo-scan` 0.3.0 — nothing staged,
nothing shortened except where marked.

---

## Steps

**Prerequisite:** Node ≥ 22 and any git repository (an empty scratch repo works).
Use `npx @unleashwp/lumo scan` once the npm package is live; until then, clone
the repo, run `npm install && npm run build`, and substitute
`node /path/to/lumo/dist/scan.mjs` for the `npx` command.

**1. Create the file an AI assistant would plausibly write** (about 15 s):

```bash
mkdir -p includes
cat > includes/checkout.php <<'PHP'
<?php
// AI-suggested: fetch recent orders and tag the plan on each one.
$orders = get_posts( array( 'post_type' => 'shop_order', 'numberposts' => 10 ) );
foreach ( $orders as $order_post ) {
    $email = get_post_meta( $order_post->ID, '_billing_email', true );
    update_post_meta( $order_post->ID, '_subscription_plan', 'pro' );
}
PHP
git add includes/checkout.php
```

This is not a strawman — it is the pattern models trained before late 2023
produce for "get recent WooCommerce orders", and it silently reads stale data
on any store running WooCommerce 8.2+ (HPOS default).

**2. Run the scan** (about 5 s):

```bash
npx @unleashwp/lumo scan
```

**3. Expected output** (verbatim; the ✅ Correct block and test step are the
full snapshot entry — trimmed here at the marked spot only):

```
lumo scan: 1 LOUD finding in your current changes.

--- includes/checkout.php ---
> ⚠️ Your AI suggested code that broke in WooCommerce 8.2.
> This was deprecated or removed in WooCommerce 8.2 (2026-06-20).
> Your model's training likely predates this release.

## WooCommerce HPOS: reading and writing order data

Under WooCommerce High-Performance Order Storage (HPOS — the default since
WooCommerce 8.2) order data lives in dedicated order tables, not
wp_posts/wp_postmeta. Reading or writing orders with get_post_meta(),
get_post() or direct $wpdb against the post tables returns stale data or
writes where nothing reads. Always go through the WooCommerce order CRUD:
load with wc_get_order(), use the order object getters/setters and
get_meta()/update_meta_data(), then call save().

### ❌ Wrong (HPOS-unsafe)

// WRONG under HPOS — reads/writes wp_postmeta, which orders no longer use.
$email = get_post_meta( $order_id, '_billing_email', true );
update_post_meta( $order_id, '_subscription_plan', 'pro' );

// WRONG — querying the post tables for orders.
$orders = get_posts( array( 'post_type' => 'shop_order' ) );

### ✅ Correct

// Load the order through WooCommerce — works on the legacy post store AND HPOS.
$order = wc_get_order( $order_id );
$email = $order->get_billing_email();
$order->update_meta_data( '_subscription_plan', 'pro' );
$order->save();
[… full block also shows FeaturesUtil::declare_compatibility() for plugins …]

**Source:** https://github.com/woocommerce/woocommerce/wiki/High-Performance-Order-Storage-Upgrade-Recipe-Book

**Verify:** On staging, enable HPOS (WooCommerce -> Settings -> Advanced ->
Features -> "High-performance order storage") and confirm your order
reads/writes still work.

**Affected:** WooCommerce ≥ 8.2

_Knowledge current as of 2026-06-20._

_Lumo Pro has the full breakdown, the complete version range, and what breaks
in upcoming WP releases before they ship._

_Fix proven to run_

Fix the LOUD finding above before committing.
```

**Variant — in-chat catch:** in Claude Code with the plugin installed, paste
the snippet and ask "review this". The `wp-binding` skill routes it through
`lumo_check_code` and the same LOUD block appears in the reply.

**Precision note for a live audience:** paste only
`get_post_meta( $order_id, '_billing_email', true )` (no `shop_order` literal)
and Lumo answers SOFT — "Worth reviewing: if $order_id is a WooCommerce order…"
— because the blob alone cannot prove it is an order. The demo shows both the
alarm and the restraint. That restraint is the credibility of the alarm.

---

## README GIF storyboard (5 frames)

Record one terminal, default dark theme, ~90 columns. Total loop ≤ 30 s.

| Frame | Duration | Content |
|---|---|---|
| 1 | 3 s | Editor shows `includes/checkout.php` with the `get_posts( … 'shop_order' … )` snippet. Caption: "Your AI wrote this. It looks fine." |
| 2 | 2 s | Terminal: `npx @unleashwp/lumo scan` typed and entered. |
| 3 | 4 s | Output appears — hold on the three ⚠️ lead lines: "broke in WooCommerce 8.2 … Your model's training likely predates this release." |
| 4 | 5 s | Scroll to ❌ Wrong / ✅ Correct side of the block, ending on the **Source:** and **Affected: WooCommerce ≥ 8.2** lines. |
| 5 | 4 s | Final line "Fix the LOUD finding above before committing." Caption: "The manual answers when asked. The watcher fires when it's wrong." |

---

## Channel one-liners

**r/WordPress post**

> **Title:** I built a scanner that flags AI-written WordPress code that broke in a specific release — here's it catching the classic HPOS mistake
>
> **Body:** Every LLM I've tried still writes `get_posts( ['post_type' => 'shop_order'] )` and `get_post_meta( $order_id, … )` for WooCommerce orders — patterns that stopped working correctly when HPOS became the default in WooCommerce 8.2. The training data predates the change, and the code fails silently: no error, just stale reads.
>
> So I built Lumo: a local MCP server + CLI with 142 curated entries, each verified against a primary source. It scans your uncommitted diff and flags what broke, with the wrong-vs-correct fix, the source URL, and the version it broke in. It only goes LOUD when it can prove the version fact — otherwise it says "worth reviewing, if X" and states the condition.
>
> It's free and runs entirely locally (stdio MCP, no network call): https://github.com/unleash-wp/lumo — the reproducible demo is in docs/catch-demo.md. Honest limitation: the free knowledge is a dated snapshot, not a live feed. Curious what stale patterns your AI writes that I should cover next.

**X/Twitter thread opener**

> Your AI still writes WooCommerce code that broke in 8.2.
>
> It compiles. It looks right. It reads stale order data on every HPOS store — silently.
>
> I built a watcher that catches it the moment it's written, with the fix and a dated source. Free, local, open repo. Demo in 30 seconds:

*(frame 2: the GIF; frame 3: the repo link + "the official WordPress skills are the manual — Lumo is the watcher")*

**WP-dev Slack message**

> If your team uses AI for WooCommerce/WP code: I released a free local scanner that flags patterns which broke in a specific release — the classic one being `get_post_meta()` on orders (broken since HPOS default in Woo 8.2). It shows wrong vs. correct plus the source and version, and it only alarms when it can prove the version fact. `npx @unleashwp/lumo scan` on your diff, or as an MCP server / GitHub Action. Repo: https://github.com/unleash-wp/lumo — 30-second repro in docs/catch-demo.md. Feedback welcome, especially false-alarm reports.
