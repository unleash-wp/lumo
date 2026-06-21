#!/usr/bin/env node
/**
 * sync-snapshot.mjs — stub
 *
 * Regenerates data/snapshot.json from the Pro snapshot generator.
 * This file is a STUB. The live regeneration is blocked on the Pro generator
 * (not yet built). It exits non-zero and points at the procedure so the caller
 * is never silently misled into thinking a regen ran.
 *
 * When the Pro generator is available, replace this stub with an implementation that:
 *   1. Calls the Pro generator (or reads its output file).
 *   2. Verifies the Free-projection contract (see docs/snapshot-sync.md).
 *   3. Writes the verified output to data/snapshot.json.
 *   4. Exits non-zero if any contract check fails.
 *
 * CONTRACT (must hold after every real sync — see docs/snapshot-sync.md):
 *   - Free fields (summary, code_example, bad_pattern, source_url, test_step,
 *     versions[0].woo_version_min) are byte-stable unless the Pro summary changed.
 *   - generatedAt advances; per-entry updatedAt advances only on content change.
 *   - body is NEVER written into snapshot.json (Pro-only field).
 *   - schemaVersion stays at 1; the snapshot loader rejects a mismatch.
 *   - Slug stability: renamed slugs are breaking changes.
 */

console.error(
  'sync-snapshot: the Pro snapshot generator is not yet available.\n' +
  'Live snapshot regeneration is blocked until that generator is built.\n' +
  'See docs/snapshot-sync.md for the manual procedure and contract.\n' +
  'data/snapshot.json was NOT modified.',
);
process.exit(1);
