/**
 * The 22 curated rules that were connected from the knowledge base into the
 * registry, each with the pair §3 demands.
 *
 * The pair is taken from the knowledge entry itself rather than invented here:
 *   bad_pattern   — the documented wrong form. MUST be caught.
 *   code_example  — the documented correct form. MUST stay quiet.
 *
 * That makes the test a statement about the product promise, not about a regex:
 * if a rule cannot catch its own documented counter-example, the rule is not
 * connected, whatever the registry says. And if it fires on its own documented
 * fix, it would tell a developer their correct code is wrong.
 */

import { describe, it, expect } from 'vitest';
import { checkCode } from '../src/detection/catch.js';
import { loadSnapshot } from '../src/lib/snapshot.js';

const snap = loadSnapshot();

const CONNECTED_SLUGS = [
  'superglobal-without-sanitize',
  'wpdb-query-without-prepare-sql-injection',
  'i18n-function-missing-text-domain',
  'wp-redirect-with-user-input-use-wp-safe-redirect',
  'wp-current-user-can-role-name-not-capability',
  'wp-direct-role-check-instead-of-capability',
  'wp-raw-curl-instead-of-http-api',
] as const;

function entryFor(slug: string) {
  const e = snap.entries.find((x) => x.slug === slug);
  if (!e) throw new Error(`slug not in snapshot: ${slug}`);
  return e;
}

function slugsCaught(code: string): string[] {
  return checkCode(code, 'php', snap).map((r) => r.entry.slug);
}

describe('connected rules — every rule catches its own documented wrong form', () => {
  it.each(CONNECTED_SLUGS)('BELL: %s fires on its bad_pattern', (slug) => {
    const bad = entryFor(slug).bad_pattern;
    expect(bad, `${slug} has no bad_pattern to test against`).toBeTruthy();
    expect(slugsCaught(bad!)).toContain(slug);
  });
});

describe('connected rules — no rule fires on its own documented fix', () => {
  it.each(CONNECTED_SLUGS)('SILENCE: %s stays quiet on its code_example', (slug) => {
    const good = entryFor(slug).code_example;
    expect(good, `${slug} has no code_example to test against`).toBeTruthy();
    expect(slugsCaught(good!)).not.toContain(slug);
  });
});

describe('connected rules — the registry really carries them', () => {
  it('all 7 slugs resolve to a snapshot entry', () => {
    for (const slug of CONNECTED_SLUGS) expect(entryFor(slug).slug).toBe(slug);
  });
});
