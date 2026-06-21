import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import type { Snapshot, SnapshotEntry } from '../types.js';

// Fail-fast validation: catch a malformed or truncated snapshot artifact at
// load time rather than silently serving empty/wrong answers at query time.

const FREE_REQUIRED_FIELDS: ReadonlyArray<keyof SnapshotEntry> = [
  'slug',
  'title',
  'category_slug',
  'summary',
  'code_example',
  'bad_pattern',
  'source_url',
  'test_step',
];

/**
 * Assert that an entry carries every required Free field and contains no Pro
 * `body` field. Throws with a descriptive message on the first violation so
 * the caller sees exactly what is missing.
 */
export function validateEntry(entry: unknown, index: number): asserts entry is SnapshotEntry {
  if (typeof entry !== 'object' || entry === null) {
    throw new Error(`snapshot.entries[${index}] is not an object`);
  }

  const obj = entry as Record<string, unknown>;

  // Pro leak guard — body must never appear in a Free artifact.
  if ('body' in obj) {
    throw new Error(
      `snapshot.entries[${index}] (slug: ${String(obj['slug'])}) contains Pro field "body" — ` +
        'the Free snapshot must never include the Pro body.',
    );
  }

  for (const field of FREE_REQUIRED_FIELDS) {
    const value = obj[field];
    if (value === undefined || value === null || value === '') {
      throw new Error(
        `snapshot.entries[${index}] (slug: ${String(obj['slug'])}) is missing required Free field "${field}"`,
      );
    }
  }

  if (obj['tier'] !== 'free') {
    throw new Error(
      `snapshot.entries[${index}] (slug: ${String(obj['slug'])}) has tier "${String(obj['tier'])}" — ` +
        'only "free" entries are valid in the Free snapshot.',
    );
  }
}

/**
 * Load and validate data/snapshot.json.
 *
 * Resolves the path relative to this file so the loader works regardless of
 * the process cwd (plugin can be installed anywhere).
 *
 * Throws on any schema violation — the caller must not silently swallow the
 * error; a broken snapshot means no Free answers, which is a startup failure.
 */
export function loadSnapshot(): Snapshot {
  const snapshotPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../data/snapshot.json',
  );

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to read snapshot at ${snapshotPath}: ${String(err)}`);
  }

  if (typeof raw !== 'object' || raw === null) {
    throw new Error('snapshot.json top level is not an object');
  }

  const snap = raw as Record<string, unknown>;

  if (snap['schemaVersion'] !== 1) {
    throw new Error(
      `snapshot.json schemaVersion is ${String(snap['schemaVersion'])} — expected 1`,
    );
  }

  if (!Array.isArray(snap['entries'])) {
    throw new Error('snapshot.json missing "entries" array');
  }

  snap['entries'].forEach((entry: unknown, i: number) => validateEntry(entry, i));

  return raw as Snapshot;
}

/**
 * Look up a single entry by slug. Returns undefined when the slug is not in
 * the snapshot — callers should degrade gracefully (not throw).
 */
export function findEntry(snapshot: Snapshot, slug: string): SnapshotEntry | undefined {
  return snapshot.entries.find((e) => e.slug === slug);
}

/**
 * Look up entries by category slug. Returns an empty array when no match —
 * the detection → advice routing path (FA-14) depends on this.
 */
export function findByCategory(snapshot: Snapshot, categorySlug: string): SnapshotEntry[] {
  return snapshot.entries.filter((e) => e.category_slug === categorySlug);
}
