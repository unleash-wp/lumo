---
name: wp-knowledge
description: >
  Activate when a developer asks about HPOS, High-Performance Order Storage,
  order meta, get_post_meta on order data, wc_get_order, storing data on
  WooCommerce orders, or why order reads/writes stopped working after a
  WooCommerce upgrade. This skill provides the inline Free contrast answer
  mid-task without duplicating the /lumo:wp-check audit flow.
---

## When triggered

The developer has asked about HPOS or order-data access mid-task — not requesting a full project audit. Answer directly with the Free contrast from the snapshot.

## Answer procedure

1. Read `data/snapshot.json` (path relative to the Lumo plugin root, or wherever `snapshot.json` lives in the project).
2. Find the entry with `slug: "woocommerce-hpos-order-access"`.
3. Present the following, using the entry fields verbatim:

---

**{entry.summary}**

**Wrong (HPOS-unsafe):**

```php
{entry.bad_pattern}
```

**Correct:**

```php
{entry.code_example}
```

**Source:** {entry.source_url}

**Verify:** {entry.test_step}

---

4. Cite `source_url` and `test_step` explicitly — these are non-negotiable evidence fields.
5. Do not reproduce the full `/lumo:wp-check` flow (no detection ladder, no project scan). This skill answers the "I was just asked about HPOS" moment; `/lumo:wp-check` is for auditing a specific project root.
6. After answering, record a `pql_gated_touch` using `recordGatedTouch()` from `src/lib/events.ts`:
   - `at`: current ISO timestamp
   - `variant`: call `getOrAssignVariant()` from `src/lib/events.ts`
   - `tool`: `'wp_knowledge'`

   This counts the Skill surface toward the same scoreboard that `/lumo:wp-check` increments, so `getGatedCount()` reflects all HPOS touches regardless of which surface answered the question.
