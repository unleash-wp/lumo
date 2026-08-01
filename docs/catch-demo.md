# The Catch Demo: reproducible in 30–90 seconds

The flagship demo is `lumo demo`: four bundled samples run through the real
catch engine. Two findings are LOUD (always-wrong security patterns with a
dated source), two are advisory. Nothing is read from your machine.

```bash
# Once the npm package is live:
npx @unleashwp/lumo demo

# Until then, from a clone:
npm install && npm run build
node dist/lumo.mjs demo
```

The first line of the output states that these are samples, not your project.
That honesty is part of the product.

---

## On your own code: `lumo scan`

**Prerequisite:** Node ≥ 22 and a git repository with uncommitted changes.
Use `npx @unleashwp/lumo scan` once the npm package is live; until then
`node /path/to/lumo/dist/lumo.mjs scan`.

Deprecations that are **not** stamped `breaking_change: true` in the Free
snapshot land as **advisory** (SOFT), not LOUD. The img-decoding deprecation
is one of those: AI still writes it, Lumo still catches it, and it does not
block a CI gate by itself.

```bash
cat > images.php <<'PHP'
<?php
function my_theme_filter_images( $html ) {
    return wp_img_tag_add_decoding_attr( $html, 'the_content' );
}
add_filter( 'the_content', 'my_theme_filter_images' );
PHP
git add images.php
npx @unleashwp/lumo scan
```

Expect an **ADVISORY** finding for `wp_img_tag_add_decoding_attr`, with the
correct replacement and source — not a LOUD/BREAKING lead line.

**In-chat:** with the plugin installed, paste a sample and ask for review.
`wp-binding` routes through `lumo_check_code`.

**WooCommerce / HPOS:** Free detects WooCommerce and teasers Pro. It does not
ship a Free HPOS entry in `data/snapshot.json`. The live catch is Pro
(`lumo_check_code` / Agent Kit with MCP).

---

## Recording notes (for `lumo demo`)

| Beat | Time | What to show |
|---|---|---|
| 1 | 2 s | Terminal: `npx @unleashwp/lumo demo` |
| 2 | 2 s | First line: samples, not your project |
| 3 | 4 s | LOUD findings with Wrong / Correct / Source |
| 4 | 4 s | Advisory findings; caption that LOUD needs a breaking stamp |
| 5 | 2 s | Cut to `lumo scan` on a real dirty tree |
