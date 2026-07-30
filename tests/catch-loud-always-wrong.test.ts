/**
 * The second LOUD route — "wrong in every version, carried by a source"
 * (owner decision, 30.07.2026). Successor of proposed-loud-always-wrong.test.ts:
 * the local proposedTier() moved into classify(), these tests pin the result.
 *
 * Contract under test:
 *   - CERTAIN + slug on ALWAYS_WRONG_SLUGS + non-empty source_url → LOUD with
 *     an alwaysWrongFact anchor (never a versionFact).
 *   - Everything else keeps the tier it had: CONTEXT_DEPENDENT caps at SOFT,
 *     REPO_STATE at SILENT, version-route LOUD still needs breaking_change.
 *   - The renderer refuses LOUD without an anchor, and renders the source as
 *     the lead when the anchor is the always-wrong fact.
 */

import { describe, it, expect } from 'vitest';
import { classify, ALWAYS_WRONG_SLUGS } from '../src/detection/catch.js';
import type { CatchSignal } from '../src/detection/registry.js';
import type { SnapshotEntry } from '../src/types.js';
import { formatCatch } from '../src/lib/render.js';
import { handleCheckCode } from '../src/mcp/handlers.js';
import { runHookCatch } from '../src/hook/catch-runner.js';
import { loadSnapshot } from '../src/lib/snapshot.js';

const snap = loadSnapshot();

function entryFor(slug: string): SnapshotEntry {
  const e = snap.entries.find((x) => x.slug === slug);
  if (!e) throw new Error(`slug not in snapshot: ${slug}`);
  return e;
}

function signalFor(slug: string, cls: CatchSignal['class']): CatchSignal {
  return { match: /never used/, class: cls, entrySlug: slug, language: 'php' };
}

describe('always-wrong route — the five rules go loud', () => {
  it.each([...ALWAYS_WRONG_SLUGS])('%s is evidenced by a source', (slug) => {
    expect(entryFor(slug).source_url, 'no source means no LOUD, without exception').toBeTruthy();
  });

  it.each([...ALWAYS_WRONG_SLUGS])('BELL: %s classifies LOUD with a source anchor', (slug) => {
    const r = classify(entryFor(slug), signalFor(slug, 'CERTAIN'), false);
    expect(r.tier).toBe('LOUD');
    expect(r.alwaysWrongFact?.sourceUrl).toBe(entryFor(slug).source_url);
    expect(r.versionFact).toBeUndefined();
  });
});

describe('always-wrong route — what must NOT move', () => {
  it('a CONTEXT_DEPENDENT signal stays SOFT even on an always-wrong slug', () => {
    const slug = 'wpdb-query-without-prepare-sql-injection';
    expect(classify(entryFor(slug), signalFor(slug, 'CONTEXT_DEPENDENT'), false).tier).toBe('SOFT');
  });

  it('a REPO_STATE signal stays SILENT on a bare blob', () => {
    const slug = 'wpdb-query-without-prepare-sql-injection';
    expect(classify(entryFor(slug), signalFor(slug, 'REPO_STATE'), false).tier).toBe('SILENT');
  });

  it('a shim context still downgrades to SOFT before the route is consulted', () => {
    const slug = 'wpdb-query-without-prepare-sql-injection';
    expect(classify(entryFor(slug), signalFor(slug, 'CERTAIN'), true).tier).toBe('SOFT');
  });

  it('an always-wrong slug without a source stays SOFT', () => {
    // source_url is a required string in the type; the empty string is the only
    // way to express a missing source, and the route must treat it as missing.
    const entry = { ...entryFor('wpdb-query-without-prepare-sql-injection'), source_url: '' };
    const r = classify(entry, signalFor(entry.slug, 'CERTAIN'), false);
    expect(r.tier).toBe('SOFT');
    expect(r.alwaysWrongFact).toBeUndefined();
  });

  it('no entry outside the list gains the anchor, and version-route LOUD still needs breaking', () => {
    const outside = snap.entries.filter((e) => !ALWAYS_WRONG_SLUGS.includes(e.slug));
    expect(outside.length).toBeGreaterThan(30);
    for (const entry of outside) {
      const r = classify(entry, signalFor(entry.slug, 'CERTAIN'), false);
      expect(r.alwaysWrongFact, `${entry.slug} gained the anchor`).toBeUndefined();
      const breaking = entry.versions.some(
        (v) => (v.woo_version_min != null || v.wp_version_min != null) && v.breaking_change,
      );
      expect(r.tier, `${entry.slug} tier moved`).toBe(breaking ? 'LOUD' : 'SOFT');
    }
  });
});

describe('always-wrong route — the two demoted rules stay SOFT', () => {
  // Review outcome (Gemini pass A + PM gate, measured at the engine): a role
  // badge check and an mTLS cURL call are legitimate code; LOUD would break PR
  // builds on them under the Action's default fail_on_loud=true. Law 1: in
  // doubt, stay quiet. Promotion back is an owner decision.
  it.each(['wp-raw-curl-instead-of-http-api', 'wp-direct-role-check-instead-of-capability'])(
    'SILENCE: %s classifies SOFT, never LOUD, no anchor',
    (slug) => {
      const r = classify(entryFor(slug), signalFor(slug, 'CERTAIN'), false);
      expect(r.tier).toBe('SOFT');
      expect(r.alwaysWrongFact).toBeUndefined();
    },
  );
});

describe('always-wrong route — rendering', () => {
  const slug = 'wpdb-query-without-prepare-sql-injection';
  const loud = () => {
    const entry = entryFor(slug);
    const signal = signalFor(slug, 'CERTAIN');
    const c = classify(entry, signal, false);
    return { entry, signal, ...c };
  };

  it('renders the loud lead anchored on the source, no version claim', () => {
    const out = formatCatch(loud());
    expect(out).toContain('⚠️');
    expect(out).toContain('wrong in every supported WordPress version');
    expect(out).toContain(entryFor(slug).source_url);
    // No fabricated release claim on this route.
    expect(out).not.toContain('broke in');
  });

  it('still refuses LOUD without any anchor', () => {
    const entry = entryFor(slug);
    const signal = signalFor(slug, 'CERTAIN');
    const out = formatCatch({ tier: 'LOUD', entry, signal });
    expect(out).not.toContain('⚠️');
    expect(out).toContain('🔍');
  });
});

describe('always-wrong route — end to end, the watchdog barks', () => {
  const SQLI = `<?php
global $wpdb;
$id = $_GET['user_id'];
$rows = $wpdb->get_results( "SELECT * FROM wp_things WHERE user_id = $id" );
`;

  it('lumo_check_code answers LOUD for an unprepared $wpdb query', async () => {
    const out = await handleCheckCode({ code: SQLI, language: 'php' }, snap);
    expect(out).toContain('⚠️');
    expect(out).toContain('wrong in every supported WordPress version');
  });

  it('the hook reports tier LOUD for the same blob', () => {
    const res = runHookCatch(SQLI, 'php');
    expect(res.tier).toBe('LOUD');
    expect(res.loudCount).toBeGreaterThan(0);
  });

  it('SILENCE: the documented correct form stays quiet', async () => {
    const good = entryFor('wpdb-query-without-prepare-sql-injection').code_example!;
    const out = await handleCheckCode({ code: good, language: 'php' }, snap);
    expect(out).not.toContain('⚠️');
  });
});
