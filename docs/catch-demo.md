# The Catch Demo — reproducible in 30–90 seconds

The flagship demo: AI-typical WordPress code calling a function that WordPress
retired in 6.4, caught LOUD by Lumo with a dated source and the correct pattern.
Every output block below is captured verbatim from `lumo-scan` 0.3.0 — nothing
staged, nothing shortened except where marked.

The example is deliberately a Core deprecation rather than the WooCommerce/HPOS
one used previously: WooCommerce knowledge is Pro-only, so a Core case is what a
free reader can actually reproduce. (A WooCommerce project still gets an honest
answer — Lumo names the detection and says the coverage is Pro, never a clean
bill of health.)

---

## Steps

**Prerequisite:** Node ≥ 22 and any git repository (an empty scratch repo works).
Use `npx @unleashwp/lumo scan` once the npm package is live; until then, clone
the repo, run `npm install && npm run build`, and substitute
`node /path/to/lumo/dist/scan.mjs` for the `npx` command.

**1. Create the file an AI assistant would plausibly write** (about 15 s):

```bash
cat > images.php <<'PHP'
<?php
// AI-suggested: filter image markup in the_content.
function my_theme_filter_images( $html ) {
    return wp_img_tag_add_decoding_attr( $html, 'the_content' );
}
add_filter( 'the_content', 'my_theme_filter_images' );
PHP
git add images.php
```

This is not a strawman — models trained before late 2023 reach for
`wp_img_tag_add_decoding_attr()` whenever asked to filter image markup, and it
has been deprecated since WordPress 6.4.

**2. Run the scan** (about 5 s):

```bash
npx @unleashwp/lumo scan
```

**3. Expected output** (verbatim from a fresh install; the ✅ Correct block and
test step are the full snapshot entry — trimmed here at the marked spot only):

```
lumo scan: 1 LOUD finding in your current changes.

--- images.php ---
> ⚠️ Your AI suggested code that broke in WordPress 6.4.0.
> This was deprecated or removed in WordPress 6.4.0 (2026-06-21).
> Your model's training likely predates this release.

## wp_img_tag_add_decoding_attr() deprecated in WP 6.4 — use wp_img_tag_add_loading_optimization_attrs()

The wp_img_tag_add_decoding_attr() function was deprecated in WordPress 6.4.0
in favor of wp_img_tag_add_loading_optimization_attrs(), which consolidates
image optimization (decoding, loading, fetchpriority). Themes and plugins still
using the old function will trigger deprecation notices on WP 6.4+.

### ❌ Wrong

// WRONG — deprecated since WP 6.4.0
$img_html = wp_img_tag_add_decoding_attr( $img_html, 'custom-context' );
echo $img_html;

### ✅ Correct

// CORRECT — WP 6.4.0+
$img_html = wp_img_tag_add_loading_optimization_attrs( $img_html, 'custom-context' );
[… full block also shows letting Core handle it via the_post_thumbnail() …]

**Source:** https://developer.wordpress.org/reference/functions/wp_img_tag_add_decoding_attr/

**Verify:** On a WP 6.4.0+ site, search for wp_img_tag_add_decoding_attr( calls,
enable WP_DEBUG and confirm the deprecation notice disappears after replacing them.

**Affected:** WordPress ≥ 6.4.0

_Knowledge current as of 2026-06-21._

Fix the LOUD finding above before committing.
```

**Variant — in-chat catch:** in Claude Code with the plugin installed, paste
the snippet and ask "review this". The `wp-binding` skill routes it through
`lumo_check_code` and the same LOUD block appears in the reply.

**Precision note for a live audience:** wrap the same call in
`if ( function_exists( 'wp_img_tag_add_decoding_attr' ) )` and Lumo drops to
SOFT — a compatibility shim is a legitimate reason to still name the function.
The demo shows both the alarm and the restraint. That restraint is the
credibility of the alarm.

**WooCommerce variant (Pro):** the same demo on HPOS order code is the Pro
story. On Free, a WooCommerce project gets the honest teaser — Lumo names what
it detected and says the coverage is licensed — never a clean bill of health.

---

## README GIF storyboard (5 frames)

Record one terminal, default dark theme, ~90 columns. Total loop ≤ 30 s.

| Frame | Duration | Content |
|---|---|---|
| 1 | 3 s | Editor shows `includes/checkout.php` with the `get_posts( … 'shop_order' … )` snippet. Caption: "Your AI wrote this. It looks fine." |
| 2 | 2 s | Terminal: `npx @unleashwp/lumo scan` typed and entered. |
| 3 | 4 s | Output appears — hold on the three ⚠️ lead lines: "broke in WordPress 6.4.0 … Your model's training likely predates this release." |
| 4 | 5 s | Scroll to ❌ Wrong / ✅ Correct side of the block, ending on the **Source:** and **Affected: WooCommerce ≥ 8.2** lines. |
| 5 | 4 s | Final line "Fix the LOUD finding above before committing." Caption: "The manual answers when asked. The watcher fires when it's wrong." |

---

## Channel one-liners

**r/WordPress post**

> **Title:** I built a scanner that flags AI-written WordPress code that broke in a specific release — here's it catching the classic HPOS mistake
>
> **Body:** Every LLM I've tried still reaches for `wp_img_tag_add_decoding_attr()` when asked to filter image markup — a function WordPress deprecated in 6.4 and replaced with `wp_img_tag_add_loading_optimization_attrs()`. The training data predates the change, so the code looks right, compiles, and quietly throws a deprecation notice on every modern install.
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

*(frame 2: the GIF; frame 3: the repo link + "the WordPress agent skills are the manual, Lumo is the watcher")*

**WP-dev Slack message**

> If your team uses AI for WooCommerce/WP code: I released a free local scanner that flags patterns which broke in a specific release — the classic one being `get_post_meta()` on orders (broken since HPOS default in Woo 8.2). It shows wrong vs. correct plus the source and version, and it only alarms when it can prove the version fact. `npx @unleashwp/lumo scan` on your diff, or as an MCP server / GitHub Action. Repo: https://github.com/unleash-wp/lumo — 30-second repro in docs/catch-demo.md. Feedback welcome, especially false-alarm reports.
