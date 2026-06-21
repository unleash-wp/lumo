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

## Upgrade prompt (after the Free answer)

After printing the Free answer and recording the gated touch, apply the upgrade-prompt logic. The kill-switch gates only this section — the HPOS answer and the gated touch are never behind the gate.

1. Read `LUMO_UPGRADE_PROMPT` env var via `isUpgradePromptEnabled()` from `src/lib/config.ts`. If it returns false, skip this entire section.

2. Read the prompt state: call `readPromptState()` from `src/lib/events.ts`.

3. Get the live gated count: call `getGatedCount()` from `src/lib/events.ts`.

4. Determine the session identity: use the caller-supplied conversation id if available; otherwise fall back to a date-hour bucket string.

4a. Reconcile cross-session back-off: call `reconcileSession(state, sessionId, now)` from `src/lib/prompt.ts`. Assign the returned value as the new `state`, then call `writePromptState(state)` from `src/lib/events.ts` to persist before deciding. This is the step that applies `onIgnore` for any prior-session show-and-ignore before the current session evaluates eligibility.

5. Call `decidePrompt({ now, gatedCount, state, killSwitchOn: true, sessionId })` from `src/lib/prompt.ts`.

6. Act on the returned `PromptDecision` — same logic as `commands/wp-check.md` "Upgrade prompt" section:
   - `showReveal` true → print `UPGRADE_REVEAL_LINE` from `src/lib/render.ts` (first-per-session).
   - `showPrompt` true → build the attributed URL via `buildCheckoutUrl` from `src/lib/config.ts`, print `UPGRADE_PROMPT_BLOCK` from `src/lib/render.ts` with `{N}` and `{checkout_url}` substituted, then call `onPromptShown` + `writePromptState`.
   - `reason === 'session_silenced'` and prompt not shown → emit `prompt_suppressed` event via `recordEvent` + `buildEvent`.
   - On CTA click → emit `checkout_started`, call `onCheckoutClick`, persist with `writePromptState`.
