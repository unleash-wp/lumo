---
name: wp-check
description: Detect WooCommerce in the current project and print the HPOS guardrail answer. Use when a developer asks to check HPOS compatibility or audit WooCommerce order-access patterns.
---

Run the following steps exactly as written. Do not improvise code, add commentary, or make judgments beyond what the snapshot provides. Stop at the first successful detection hit and skip all later steps.

## Step 1 — composer.json

Read `./composer.json`.

If the file exists and is valid JSON, look for the key `woocommerce/woocommerce` or `wpackagist-plugin/woocommerce` inside `require` or `require-dev`.

If found → WooCommerce detected. Note the version constraint value. **Go to Output.**

## Step 2 — Plugin header file

Read `./wp-content/plugins/woocommerce/woocommerce.php`.

If the file exists, scan for a line matching `Version:` in the plugin header block (the `/* ... */` comment at the top). Extract the version value from that line.

If the file does not exist, also try `./web/app/plugins/woocommerce/woocommerce.php` (Bedrock layout).

If found → WooCommerce detected. Note the version. **Go to Output.**

## Step 3 — WP-CLI

Only if a `wp` binary is available on PATH, run:

```
wp plugin get woocommerce --field=version
```

If the command exits 0 and stdout looks like a version string (digits and dots) → WooCommerce detected. Note the version. **Go to Output.**

## Step 4 — Heuristic source scan

Search the project's own PHP files (exclude `node_modules/`, `vendor/`, `.git/`) for any of these strings:
- `wc_get_order(`
- `WC_Order`
- `Automattic\WooCommerce`

If any match is found → WooCommerce detected. Version: unknown. **Go to Output.**

## No detection

If none of Steps 1–4 detected WooCommerce, print exactly:

```
No WooCommerce detected in this project. Lumo's HPOS guardrail is WooCommerce-specific — nothing to check here.
```

Stop.

## Output

WooCommerce was detected. Read `./data/snapshot.json`. Find the entry where `category_slug` equals `woocommerce` (slug: `woocommerce-hpos-order-access`).

Print the following block verbatim, substituting fields from that entry — do not paraphrase, summarise, or add extra text:

```
## {entry.title}

{entry.summary}

### ❌ Wrong (HPOS-unsafe)

```php
{entry.bad_pattern}
```

### ✅ Correct

```php
{entry.code_example}
```

**Source:** {entry.source_url}

**Verify:** {entry.test_step}

**Affected:** WooCommerce ≥ {entry.versions[0].woo_version_min}

_{FREE_UPGRADE_HINT}_
```

Where `FREE_UPGRADE_HINT` is:

> Pro unlocks the full fix, the exact wrong-vs-correct code, the source, the verification step, and the affected WordPress/WooCommerce versions.

Print snapshot content verbatim. Do not add interpretation, examples, or additional sections.
