---
name: wp-onboard
description: First-run onboarding for WooCommerce developers. Shows the HPOS wrong-vs-correct contrast using a bundled sample, then mirrors the same check against the developer's own repo. Run this once after installing Lumo. Safe to re-run — it will note if onboarding already happened.
---

This command runs a two-beat conversational onboarding. Do not turn it into a wizard, a checklist, or a form. Speak like a senior developer pairing at the keyboard.

## Before starting

Check whether onboarding has already run by calling `hasOnboarded()` from `src/lib/events.ts` (using the default state dir). Also call `getOrAssignVariant()` to read or assign the A/B variant for this install.

If `hasOnboarded()` returns true, say briefly:

> You've already been through the Lumo HPOS onboarding — nothing to re-run. Use `/lumo:wp-check` any time you want to audit your project.

Then stop.

## Beat 1 — Show the contrast (always runs first)

Open `data/sample-order.php` and `data/snapshot.json`.

Tell the developer:

> This is the HPOS pattern Lumo watches for. The snippet below is a **teaching sample** — not code from your project.

Print the wrong pattern from `data/sample-order.php` labelled clearly:

```
### ❌ Wrong (HPOS-unsafe) — teaching sample

```php
<contents of data/sample-order.php>
```
```

Then print the correct pattern from the snapshot entry (`category_slug: woocommerce`, field `code_example`) labelled:

```
### ✅ Correct — HPOS-compatible

```php
<snapshot code_example>
```
```

Follow with one sentence explaining why the save is real:

> Under HPOS (default since WooCommerce 8.2) `get_post_meta()` on an order reads a table WooCommerce no longer writes — you get stale data or silence. `wc_get_order()` routes to whichever storage is active.

Then record an `onboarded` event using `recordEvent()` and `buildEvent()` from `src/lib/events.ts`. Use the current ISO timestamp for `at`. Use the variant returned by `getOrAssignVariant()`. Set `type: 'onboarded'`. This is NOT an activation event.

Also record an `install` event the very first time (same session, before the `onboarded` event). The `install` line in the event log is what `hasOnboarded()` reads — so write it first. Build it with `buildEvent()` using:
- `type: 'install'`
- `at`: same ISO timestamp
- `variant`: same value from `getOrAssignVariant()`
- `source`: call `resolveInstallSource(process.env)` from `src/lib/events.ts` (returns `LUMO_INSTALL_SOURCE` env value or `'unknown'`)
- `os`: `process.platform`
- `plugin_version`: the plugin version string if known, otherwise omit

## After beat 1 — telemetry opt-in (asked exactly once)

Before starting beat 2, check telemetry consent using `getTelemetryConsent()` from `src/lib/events.ts` (using the default state dir).

If the result is NOT `'unset'` (i.e. already `'granted'` or `'declined'`), skip this section silently — the developer has already been asked.

If the result IS `'unset'`, print exactly one plain line:

> Share anonymous usage so we fix the right things? No code and no personal data ever leaves your machine. (yes/no)

- If the developer responds **yes** → call `setTelemetryConsent('granted')` from `src/lib/events.ts`.
- If the developer responds with anything else (no, blank, other) → call `setTelemetryConsent('declined')`.

Continue to beat 2 regardless of the answer. Telemetry consent never gates the aha moment — beat 2 always runs.

## Beat 2 — Mirror on the developer's own repo

Beat 2 runs the same detection and output steps as `/lumo:wp-check` against the current working directory. Do not re-implement those steps here — follow the instructions in `commands/wp-check.md` exactly (Steps 1–4 and the Output block).

### Variant A — auto-chain

If the variant is `'A'`, continue directly into beat 2 after beat 1 completes. Say:

> Let me check your project now.

Then run beat 2.

### Variant B — wait for the developer

If the variant is `'B'`, after beat 1 say:

> When you're ready to check your own project, run `/lumo:wp-check`.

Then stop. Beat 2 runs when the developer types that command.

## After beat 2 — record the outcome

After completing the `/lumo:wp-check` steps on the developer's own repo, record the outcome based on what the detection returned:

### If WooCommerce was detected (own-code catch)

The developer's repo contains WooCommerce order code. The HPOS guardrail fired on their actual work. This is the activation moment.

First, record a `pql_gated_touch` event using `recordGatedTouch()` from `src/lib/events.ts`:
- `at`: current ISO timestamp
- `variant`: same value from `getOrAssignVariant()`
- `tool`: `'wp_check'`

Then record an `activation` event using `recordEvent()` and `buildEvent()`:
- `type: 'activation'`
- `target: 'own'`
- `gated: true` (Free withholds the version matrix and verified fix; every Free HPOS catch is depth-gated by definition)
- `variant`: same value from `getOrAssignVariant()`
- `at`: current ISO timestamp

Both events are correct and expected — the gated touch records the catch in the scoreboard, the activation records the milestone. Do not de-duplicate them.

Say briefly:

> Lumo caught a real HPOS pattern in your code. The summary above is the Free answer — Pro unlocks the exact wrong-vs-correct diff, the affected WooCommerce versions, and the verified fix step.

### If no WooCommerce was detected (clean repo)

The developer's project has no WooCommerce order code. This is a distinct, valid outcome — not churn, not a failure.

Record a `no_target` event:
- `type: 'no_target'`
- `target: 'own'`
- `variant`: same value from `getOrAssignVariant()`
- `at`: current ISO timestamp
- Do NOT set `gated`
- Do NOT record an `activation` event

Say:

> No WooCommerce order code found in this project — nothing for the HPOS guardrail to flag. If you work on a WooCommerce project later, run `/lumo:wp-check` there.

## Notes for this command

- Beat 1 always records `install` then `onboarded` — never `activation`.
- `activation` requires an own-code detection on the developer's actual repo (not the sample).
- The A/B variant is assigned once and never changes across calls.
- All event recording uses `recordEvent()` from `src/lib/events.ts`; it never throws.
- Do not add commentary, upsell copy, or extra sections beyond what is described above.
