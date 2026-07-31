# Honest Upgrade Gating — Implementation Report

**Branch:** `feat/honest-upgrade-gating` (lumo repo)
**Date:** 2026-06-23

## Problem

Free agent fired an upgrade-to-Pro CTA for every detected premium plugin, including 8
plugins that have zero Pro content. Any user who upgrades after seeing one of those
teasers finds nothing — confirmed refund/churn bait from the dogfood buy-test.

## Fix

Added `hasProCoverage?: true` to `PatternDefinition` in `src/detection/registry.ts`.
Two paths in `auditProject()` (`src/detection/index.ts`):

- `hasProCoverage: true` → `buildProTeaser()` → upgrade promise (honest, content exists)
- `hasProCoverage` absent → `buildDetectionNote()` → neutral note, no upgrade CTA

`handleAudit` in `src/mcp/handlers.ts` surfaces `detectionNote` in a new branch after
the existing `proTeaser` branch — no change to the covered-plugin flow.

## Coverage Decisions

### Upgrade promise shown (hasProCoverage: true)
| Pattern | Plugin |
|---------|--------|
| `premium-acf-pro` | Advanced Custom Fields Pro |
| `premium-gravity-forms` | Gravity Forms |
| `premium-meta-box` | Meta Box |
| `premium-carbon-fields` | Carbon Fields |
| `premium-elementor-pro` | Elementor Pro |

### Detection note only — no upgrade promise
| Pattern | Plugin |
|---------|--------|
| `premium-acf-extended` | ACF Extended |
| `premium-toolset-types` | Toolset Types |
| `premium-wpbakery` | WPBakery Page Builder |
| `premium-polylang` | Polylang |
| `premium-rank-math` | Rank Math SEO |
| `premium-wp-rocket` | WP Rocket |
| `premium-wordfence` | Wordfence Security |
| `premium-pods` | Pods |

Enabling Pro content for any of these later requires only adding `hasProCoverage: true`
to the registry entry — no code-path changes needed.

## Files Changed

- `src/detection/registry.ts` — `hasProCoverage` field + 5 covered-plugin flags
- `src/detection/index.ts` — `buildDetectionNote()`, `AuditResult.detectionNote`, routing in `auditProject()`
- `src/mcp/handlers.ts` — surface `detectionNote` branch in `handleAudit`
- `tests/detection.test.ts` — updated covered-plugin tests, new uncovered-plugin tests, `buildDetectionNote` unit test
- `tests/fixtures/wpbakery/` — WPBakery fixture for the uncovered-plugin test path

## Test Results

- Typecheck: pass (tsc --noEmit, 0 errors)
- Full vitest suite: **453/453 passed** (14 test files)
- Focused: detection.test.ts 58/58, mcp-handlers.test.ts 28/28
- Snapshot byte-parity: unaffected (registry.ts changes do not touch snapshot.json)

Status: DONE
Summary: Upgrade CTA now fires only when Pro has real content; 8 uncovered plugins get an honest detection note instead. Adding coverage later is a one-line flag flip in the registry.
