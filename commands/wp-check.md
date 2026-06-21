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

Where `FREE_UPGRADE_HINT` is the value of `FREE_UPGRADE_HINT` from `src/lib/render.ts`:

> Lumo Pro has the full breakdown and the complete version range for this entry.

Print snapshot content verbatim. Do not add interpretation, examples, or additional sections.

## Upgrade prompt (after the Free answer)

After printing the deterministic Free output above, apply the upgrade-prompt logic. The kill-switch gates only this section — the detection ladder, Free answer, scoreboard, and all value paths are never behind the gate.

1. Read `LUMO_UPGRADE_PROMPT` env var via `isUpgradePromptEnabled()` from `src/lib/config.ts`. If it returns false, skip this entire section.

2. Read the prompt state: call `readPromptState()` from `src/lib/events.ts`.

3. Get the live gated count: call `getGatedCount()` from `src/lib/events.ts` (no parallel counter).

4. Determine the session identity: use the caller-supplied conversation id if the runtime provides one; otherwise fall back to a date-hour bucket string (e.g. `new Date().toISOString().slice(0, 13)`).

4a. Reconcile cross-session back-off: call `reconcileSession(state, sessionId, now)` from `src/lib/prompt.ts`. Assign the returned value as the new `state`, then call `writePromptState(state)` from `src/lib/events.ts` to persist before deciding. This is the step that applies `onIgnore` for any prior-session show-and-ignore before the current session evaluates eligibility.

5. Call `decidePrompt({ now, gatedCount, state, killSwitchOn: true, sessionId })` from `src/lib/prompt.ts`.

6. Act on the returned `PromptDecision`:

   **If `showReveal` is true:** print on a blank line after the Free answer:
   > Pro has the full breakdown and the complete version range for this.

   (This is `UPGRADE_REVEAL_LINE` from `src/lib/render.ts`. Shown first-per-session only — `sessionRevealShown` prevents repetition.)

   **If `showPrompt` is true:**
   - Call `getCheckoutUrl()` from `src/lib/config.ts` to get the base URL.
   - Use `decision.promptVariant` (returned by `decidePrompt`) as `promptVariant`.
   - Call `buildCheckoutUrl(base, { source: resolveInstallSource(), gatedCount, promptVariant })` from `src/lib/config.ts` to build the attributed URL.
   - Print the `UPGRADE_PROMPT_BLOCK` from `src/lib/render.ts`, substituting `{N}` with `gatedCount` and `{checkout_url}` with the built URL.
   - Call `onPromptShown(state, sessionId)` from `src/lib/prompt.ts` to get the next state.
   - Call `writePromptState(nextState)` from `src/lib/events.ts` to persist.

   **If `reason` is `'session_silenced'` and the prompt was not shown:** emit a `prompt_suppressed` event via `recordEvent(buildEvent({ type: 'prompt_suppressed', at, variant, prompt_variant: state.promptVariant, gated_count: gatedCount }))` from `src/lib/events.ts` (local-only; no transmit payload).

7. **On CTA click** (developer follows the checkout URL): call `buildCheckoutUrl` as above and emit `checkout_started` via `buildCheckoutStartedPayload` + `transmit` from `src/lib/track.ts`. Then call `onCheckoutClick(state)` from `src/lib/prompt.ts` and persist with `writePromptState`. Record the event locally via `recordEvent(buildEvent({ type: 'checkout_started', ... }))`.

The default deterministic Free output above stays unchanged. This section appends after it.

## Scoreboard increment (standalone /lumo:wp-check runs only)

When WooCommerce was detected above (you reached the Output block) AND this is a standalone `/lumo:wp-check` invocation (NOT the beat-2 path from `/lumo:wp-onboard`), record a `pql_gated_touch` using `recordGatedTouch()` from `src/lib/events.ts`:
- `at`: current ISO timestamp
- `variant`: call `getOrAssignVariant()` from `src/lib/events.ts` to get the current variant
- `tool`: `'wp_check'`

If you are running this command because `/lumo:wp-onboard` told you to run `/lumo:wp-check` as beat 2, skip this entire "Scoreboard increment" section — `/lumo:wp-onboard` records the gated touch itself.

## Optional scoreboard summary (on demand only)

Only when the developer explicitly asks for a running tally (e.g. "how many HPOS risks has Lumo caught?" or "show me the scoreboard"), and not on every default run:

Call `getGatedCount()` from `src/lib/events.ts`. If the count is greater than 0, print exactly:

> Lumo caught {N} HPOS risks in your code.

where `{N}` is the number returned by `getGatedCount()`. If the count is 0, print nothing.

This line is never shown unsolicited. The default deterministic output above is unchanged.

Activation is never recorded here. The own-code activation milestone is owned by `/lumo:wp-onboard` beat 2, which records it after this command returns — recording it here too would double-count every WooCommerce user's activation.
