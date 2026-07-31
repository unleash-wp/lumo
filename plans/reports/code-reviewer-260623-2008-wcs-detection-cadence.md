# Code Review: feat/wcs-detection-cadence

**Verdict: CHANGES NEEDED**

One-line summary: Detection pattern shape is correct and tests pass, but catchSignal #2 fires on correct WCS API usage instead of the actual footgun, and the CHANGELOG has a date error, a missing entry, and a broken compare link.

---

## Scope

- Files reviewed: `src/detection/registry.ts`, `tests/detection.test.ts`, `tests/fixtures/wc-subscriptions/...`, `CHANGELOG.md`
- Branch diff: 160 additions, 0 deletions
- data/snapshot.json: untouched (byte-parity clean)
- tsc: clean (no output)
- Test suite: 60/60 passed

---

## Critical Issues

None.

---

## High Priority Findings

### H1 — catchSignal #2 fires on correct WCS API usage (not the footgun)

`src/detection/registry.ts`, second `catchSignals` entry:

```ts
{
  match: /\bwcs_get_subscription\s*\(/,
  class: 'CONTEXT_DEPENDENT',
  entrySlug: 'wc-subscriptions-api',
  ...
}
```

`wcs_get_subscription($id)` is the **correct** WooCommerce Subscriptions helper — it returns a `WC_Subscription` object and is the exact function developers *should* call. The actual footgun in the WCS domain is `get_post_meta($subscription_id, ...)` instead of `$subscription->get_meta(...)` (same post-meta-vs-object-method pattern as HPOS).

As written, this catch fires every time a developer correctly uses the WCS API, producing a SOFT/CONTEXT_DEPENDENT hint on valid code. Compared against the woocommerce catch signals (which narrow to `get_post_meta(\s*\$\w*order\w*`), this is significantly broader and targets the wrong call.

**Fix:** Replace r2 with a pattern that matches `get_post_meta` called with a subscription-shaped variable, mirroring the HPOS woocommerce pattern:

```ts
{
  match: /\bget_post_meta\s*\(\s*\$\w*sub(?:scription)?\w*/,
  class: 'CONTEXT_DEPENDENT',
  entrySlug: 'wc-subscriptions-api',
  condition: '$subscription_id refers to a WooCommerce Subscription post',
  language: 'php',
  stripStrings: true,
},
{
  match: /\bupdate_post_meta\s*\(\s*\$\w*sub(?:scription)?\w*/,
  class: 'CONTEXT_DEPENDENT',
  entrySlug: 'wc-subscriptions-api',
  condition: '$subscription_id refers to a WooCommerce Subscription post',
  language: 'php',
  stripStrings: true,
},
```

---

## Medium Priority Findings

### M1 — CHANGELOG [0.2.0] date wrong: says 2026-06-23, tag is 2026-06-21

`CHANGELOG.md` line 20:

```md
## [0.2.0] — 2026-06-23
```

`git show v0.2.0` confirms the tag tagger date is `2026-06-21 17:17:58 +0200`. The branch commit itself is 2026-06-23 and is listed as `[Unreleased]`, which makes the 0.2.0 date claim inaccurate. Either:

- Date `[0.2.0]` as `2026-06-21` (the actual tag), or
- The entire post-tag body belongs under a new `[0.2.1]` or `[0.3.0]` section.

### M2 — `wp-img-tag-add-decoding-attr-deprecation` omitted from CHANGELOG

`data/snapshot.json` contains this entry (`slug: wp-img-tag-add-decoding-attr-deprecation`, `updatedAt: 2026-06-21T20:00:00Z`). It is not mentioned anywhere in the CHANGELOG. All 13 snapshot entries should appear in the CHANGELOG — this one slipped.

### M3 — CHANGELOG compare links broken (no v0.1.0 tag)

Footer links:

```md
[0.2.0]: https://github.com/unleash-wp/lumo/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/unleash-wp/lumo/releases/tag/v0.1.0
```

`git tag` output shows only `v0.2.0`; there is no `v0.1.0` tag. Both links resolve to 404/empty on GitHub. Fix: either create the `v0.1.0` tag pointing at the plugin-spine commit (2026-06-21 13:28:32 `e6393202`) or change `[0.1.0]` to the commit SHA compare URL.

---

## Low Priority

### L1 — catchSignal #1 (WC_Subscriptions::) is acceptable as CONTEXT_DEPENDENT

`/\bWC_Subscriptions\s*::/` matches any static method call on the class. This is broader than ideal (could fire on `WC_Subscriptions::is_woocommerce_pre()` which is a version check, not a data-access issue) but the `CONTEXT_DEPENDENT` class prevents LOUD output. Acceptable for now; can narrow to specific data-access methods in a follow-up.

---

## Positive Observations

- `hasProCoverage: true` is **honest**: lumo-pro #98 confirmed to ship a WC Subscriptions knowledge entry.
- Pattern shape mirrors acf-pro / elementor-pro exactly: `composerKeys: []`, two `directoryPaths` (classic + Bedrock), `wpCliSlug`, `sourceSignals`. No deviation.
- Fixture is a real plugin header (Plugin Name, Plugin URI, Version, Author, Text Domain all present and accurate for WCS 6.x).
- Tests assert the covered-teaser path fully: `proTeaser` defined, `proTeaser` contains both plugin name and "Lumo Pro", `detectionNote` undefined, `entry` undefined. Substantive, not ceremonial.
- Upgrade teaser is gated behind `hasProCoverage: true` — no promise made without backing.
- snapshot.json untouched; no AI authorship tells in code, comments, commit message, or CHANGELOG.
- tsc clean; 60/60 tests pass.

---

## Recommended Actions

1. **[Required before merge]** Fix catchSignal #2 — replace `wcs_get_subscription` match with `get_post_meta` / `update_post_meta` + subscription-shaped variable, mirroring the HPOS woocommerce pattern. Update the test to assert the correct catch fires (or doesn't fire on valid `wcs_get_subscription()` calls).
2. **[Required before merge]** Correct `[0.2.0]` date to `2026-06-21`.
3. **[Required before merge]** Add `wp-img-tag-add-decoding-attr-deprecation` to the CHANGELOG knowledge section under `[0.2.0]`.
4. **[Recommended before merge]** Fix the `[0.1.0]` and `[0.2.0]` compare links — either create the `v0.1.0` tag or use commit SHA URLs.

---

## Metrics

- Type Coverage: clean (tsc --noEmit passed)
- Test Coverage: 60/60 detection tests pass; new tests are substantive
- Linting Issues: 0
- Snapshot parity: confirmed clean

---

## Unresolved Questions

- Should the WCS `entrySlug: 'wc-subscriptions-api'` map to a real Pro entry slug that matches what lumo-pro #98 shipped? If the slug differs, the lookup will silently fail at query time.
