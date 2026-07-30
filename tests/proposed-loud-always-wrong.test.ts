/**
 * PREPARATION, NOT PRODUCTION.
 *
 * Paket 1: a second reason for LOUD — "wrong in every version, evidenced by a
 * source" — next to the existing one ("breaking change at a stated version").
 *
 * classify() in src/ is untouched. The proposed predicate is written here as a
 * local pure function so the review compares two functions side by side and
 * decides on the delta, not on a description of it.
 *
 * Today's LOUD rule (three guards, all required):
 *   CERTAIN  +  a version min on the entry  +  that row is breaking_change
 *
 * Proposed addition:
 *   CERTAIN  +  entry carries a source_url  +  slug is on the always-wrong list
 *
 * The always-wrong list is explicit on purpose. Nothing in the data says "this
 * is wrong regardless of version" — no column carries it — so the alternative
 * would be inferring it from the category, which would silently promote every
 * future entry added to that category. An explicit list makes each promotion a
 * decision.
 */

import { describe, it, expect } from 'vitest';
import { classify } from '../src/detection/catch.js';
import type { CatchSignal } from '../src/detection/registry.js';
import type { SnapshotEntry } from '../src/types.js';
import { loadSnapshot } from '../src/lib/snapshot.js';

const snap = loadSnapshot();

/** The five CERTAIN rules, the only ones in scope for the proposal. */
const ALWAYS_WRONG = [
  'wpdb-query-without-prepare-sql-injection',
  'wp-direct-role-check-instead-of-capability',
  'wp-current-user-can-role-name-not-capability',
  'wp-raw-curl-instead-of-http-api',
  // In a Pro-flagged category, held back until the free/pro question is settled.
  'wp-ability-missing-input-schema-properties',
] as const;

function entryFor(slug: string): SnapshotEntry {
  const e = snap.entries.find((x) => x.slug === slug);
  if (!e) throw new Error(`slug not in snapshot: ${slug}`);
  return e;
}

function signalFor(slug: string, cls: CatchSignal['class']): CatchSignal {
  return { match: /never used/, class: cls, entrySlug: slug, language: 'php' };
}

/** The proposal: today's classify, plus one further route to LOUD. */
function proposedTier(entry: SnapshotEntry, signal: CatchSignal): 'LOUD' | 'SOFT' | 'SILENT' {
  const today = classify(entry, signal, false).tier;
  if (today === 'LOUD') return 'LOUD';
  const alwaysWrong = (ALWAYS_WRONG as readonly string[]).includes(entry.slug);
  if (signal.class === 'CERTAIN' && alwaysWrong && entry.source_url) return 'LOUD';
  return today;
}

describe('proposed LOUD reason — the five CERTAIN rules', () => {
  it.each(ALWAYS_WRONG)('%s is evidenced by a source, as the proposal requires', (slug) => {
    expect(entryFor(slug).source_url, 'no source means no LOUD, without exception').toBeTruthy();
  });

  it.each(ALWAYS_WRONG)('%s is SOFT today and LOUD under the proposal', (slug) => {
    const entry = entryFor(slug);
    const signal = signalFor(slug, 'CERTAIN');
    expect(classify(entry, signal, false).tier).toBe('SOFT');
    expect(proposedTier(entry, signal)).toBe('LOUD');
  });
});

describe('proposed LOUD reason — what must NOT move', () => {
  it('a CONTEXT_DEPENDENT signal stays SOFT even on an always-wrong slug', () => {
    const slug = 'wpdb-query-without-prepare-sql-injection';
    expect(proposedTier(entryFor(slug), signalFor(slug, 'CONTEXT_DEPENDENT'))).toBe('SOFT');
  });

  it('AJAX-without-nonce cannot become LOUD under this proposal', () => {
    // Its curated signal is CONTEXT_DEPENDENT: the blob shows the handler, never
    // the absence of the nonce check. Only the suppressGuard from the sibling
    // proposal makes that absence provable — and only then would promoting the
    // signal to CERTAIN be honest. Sequence matters: guard first, class second,
    // tier third.
    const slug = 'wp-ajax-handler-without-nonce';
    expect(proposedTier(entryFor(slug), signalFor(slug, 'CONTEXT_DEPENDENT'))).toBe('SOFT');
  });

  it('a REPO_STATE signal stays SILENT on a bare blob', () => {
    const slug = 'wpdb-query-without-prepare-sql-injection';
    expect(proposedTier(entryFor(slug), signalFor(slug, 'REPO_STATE'))).toBe('SILENT');
  });

  it('no entry outside the list changes tier', () => {
    const outside = snap.entries.filter(
      (e) => !(ALWAYS_WRONG as readonly string[]).includes(e.slug),
    );
    expect(outside.length).toBeGreaterThan(30);
    for (const entry of outside) {
      for (const cls of ['CERTAIN', 'CONTEXT_DEPENDENT', 'REPO_STATE'] as const) {
        const signal = signalFor(entry.slug, cls);
        expect(proposedTier(entry, signal), `${entry.slug} (${cls}) moved`).toBe(
          classify(entry, signal, false).tier,
        );
      }
    }
  });

  it('an always-wrong slug without a source would stay SOFT', () => {
    // SnapshotEntry types source_url as a required string, so an entry can never
    // arrive without the field — the empty string is the only way to express a
    // missing source, and the predicate must treat it as missing.
    const entry = { ...entryFor('wpdb-query-without-prepare-sql-injection'), source_url: '' };
    expect(proposedTier(entry, signalFor(entry.slug, 'CERTAIN'))).toBe('SOFT');
  });
});
