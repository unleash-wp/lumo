# Code Review: honest-upgrade-gating

**Branch:** `feat/honest-upgrade-gating` vs `main`
**Verdict:** APPROVE
**Date:** 2026-06-23

---

## Scope

- Files reviewed: `src/detection/registry.ts`, `src/detection/index.ts`, `src/mcp/handlers.ts`, `tests/detection.test.ts`, `tests/fixtures/wpbakery/wp-content/plugins/js_composer/js_composer.php`
- Lines of code analyzed: ~120 changed lines + full test suite (453 tests)
- Review focus: coverage split correctness, messaging integrity, regression safety, snapshot parity, test quality

---

## Overall Assessment

The fix is correct and safe. The data-driven `hasProCoverage` flag cleanly splits the 13 proTeaser plugins into covered (5, get upgrade CTA) and uncovered (8, get detection note). The logic in `auditProject` is straightforward. All 453 tests pass. Snapshot untouched.

---

## Critical Issues

None.

---

## High Priority Findings

None.

---

## Medium Priority Findings

**M1 — `mcp-handlers.test.ts` has no test for the `detectionNote` handler path.**

`handlers.ts` gained a new branch at line 42–44:

```ts
if (result.detected && result.detectionNote) {
  return result.detectionNote;
}
```

The handler test file (236 lines) exercises `proTeaser` return via WooCommerce + ACF paths but has no case that produces a `detectionNote`. The logic is implicitly covered by `auditProject` integration tests in `detection.test.ts`, but a direct handler-level assertion is missing. Not a blocker — the integration path is tested and the handler branch is trivial — but it is a gap worth closing in the next touching of this file.

---

## Low Priority Findings

**L1 — `buildDetectionNote` test asserts `not.toContain('Lumo Pro')` but not `not.toContain('upgrade')` or `not.toContain('Pro')`.** The current string `"Lumo does not yet have curated knowledge..."` satisfies the intent, but the negative assertion only guards against the exact string `'Lumo Pro'`. If someone accidentally introduces "Pro" framing through a different wording, the test would not catch it. Low risk given the function body is 2 lines, but worth noting.

**L2 — `hasProCoverage?: true` uses literal `true` as the type rather than `boolean`.** This is intentional TypeScript narrowing (omitting the field is equivalent to `false`), and it is a valid pattern. Calling it out only because it may look unfamiliar to contributors — a one-line comment on the interface property already explains the intent, so this is fine as-is.

---

## Verification: Coverage Split

Cross-checked every `proTeaser` registry entry against Pro knowledge files in `lumo-pro/src/knowledge/`:

| Plugin | `hasProCoverage` in registry | Pro knowledge file |
|---|---|---|
| Advanced Custom Fields Pro | `true` | `acf-content.ts` — exists |
| Gravity Forms | `true` | `gravity-forms-content.ts` — exists |
| Meta Box | `true` | `meta-box-content.ts` — exists |
| Carbon Fields | `true` | `carbon-fields-content.ts` — exists |
| Elementor Pro | `true` | `elementor-content.ts` — exists |
| ACF Extended | absent (uncovered) | no file — correct |
| Pods | absent (uncovered) | no file — correct |
| Toolset Types | absent (uncovered) | no file — correct |
| WPBakery | absent (uncovered) | no file — correct |
| Polylang | absent (uncovered) | no file — correct |
| Rank Math SEO | absent (uncovered) | no file — correct |
| WP Rocket | absent (uncovered) | no file — correct |
| Wordfence Security | absent (uncovered) | no file — correct |

Split is correct. No plugin is wrongly marked covered; no covered plugin is left uncovered.

---

## Verification: Message Integrity

`buildProTeaser` body contains `"Lumo Pro extends Lumo's current-knowledge checks"` and `"${pluginName} support is part of the Pro layer."` — explicit upgrade promise, correct for covered plugins only.

`buildDetectionNote` body: `"Lumo does not yet have curated knowledge for ${pluginName} — no checks to run here."` — no upgrade CTA, no Pro mention, no promise. Correct.

---

## Verification: Logic Correctness

```ts
if (def?.proTeaser) {
  const name = def.proTeaserName ?? detection.pattern;
  if (def.hasProCoverage) {
    return { detected: true, detection, proTeaser: buildProTeaser(name) };
  }
  return { detected: true, detection, detectionNote: buildDetectionNote(name) };
}
```

The outer guard (`def?.proTeaser`) keeps existing behavior for all non-proTeaser patterns unchanged. The inner branch on `hasProCoverage` routes correctly. The fallthrough to `detectionNote` when `hasProCoverage` is absent is the right default-closed posture.

---

## Verification: Snapshot Parity

`git diff main...feat/honest-upgrade-gating -- data/snapshot.json` produces no output. Snapshot unchanged.

---

## Verification: Test Quality

- `buildDetectionNote` unit test: asserts plugin name present, `'Lumo Pro'` absent, `'does not yet have curated knowledge'` present. Substantive, not cosmetic.
- `auditProject` covered path (3 fixtures: ACF Pro, Gravity Forms, Elementor Pro): each asserts `proTeaser` defined + plugin name + `'Lumo Pro'`, AND explicitly asserts `detectionNote` is `undefined`. The negative assertion is the key regression guard.
- `auditProject` uncovered path (WPBakery fixture): asserts `proTeaser` undefined, `detectionNote` defined + plugin name, `'Lumo Pro'` absent. Fixture is a real plugin file with correct plugin header.
- Tests were not weakened or deleted. 58 detection tests, 453 total — all pass.

---

## Verification: No AI Authorship Tells

Scanned all `+` lines in the diff for known AI tells (`Note that`, `Co-Authored-By`, `Generated with`, etc.). None found.

---

## Positive Observations

- The `hasProCoverage?: true` narrowing pattern is idiomatic: absence means false, presence means true, no risk of wrong truthiness. Clean.
- Both new functions have JSDoc comments that state the intent precisely, not generically.
- The fixture file for WPBakery is a real plugin header (correct structure, realistic version `7.8.0`), not a stub.
- The test describe-block rename (`"Pro teaser path (covered plugins: upgrade promise is honest)"`) makes the intent auditable without reading the assertion bodies.
- Comment in `handlers.ts` diff is absent — the handler change is 3 lines, no comment needed. Right call.

---

## Recommended Actions

1. (Optional, next PR) Add a `mcp-handlers.test.ts` case that stubs `auditProject` to return `detectionNote` and asserts the handler returns it — closes M1.
2. (Optional) Extend `buildDetectionNote` test negative assertion to `not.toContain('upgrade')` to guard against future wording drift — closes L1.

---

## Metrics

- Type coverage: no type regressions; `hasProCoverage?: true` is narrower than `boolean`, correct
- Test coverage: 453/453 pass; new behavior has both unit and integration coverage
- Linting issues: 0 (implicit — vitest run clean, no type errors surfaced)
- Snapshot: unchanged (byte-parity maintained)

Status: DONE
Verdict: APPROVE
