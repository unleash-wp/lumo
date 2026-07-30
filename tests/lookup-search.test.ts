/**
 * lumo_lookup free-text search (P9). Before this, 42 entries were unreachable
 * without knowing a slug. Scoring is the ai-forge adapter's, ported 1:1, so
 * both lookup surfaces rank identically.
 */

import { describe, it, expect } from 'vitest';
import { handleLookup } from '../src/mcp/handlers.js';
import { loadSnapshot } from '../src/lib/snapshot.js';

const snap = loadSnapshot();

describe('lookup query — relevance goldens', () => {
  it.each([
    ['sql injection prepare', 'wpdb-query-without-prepare-sql-injection'],
    ['nonce ajax', 'wp-ajax-handler-without-nonce'],
    ['transient false', 'wp-transient-missing-false-check-fallback'],
    ['redirect user input', 'wp-redirect-with-user-input-use-wp-safe-redirect'],
    ['text domain translation', 'i18n-function-missing-text-domain'],
  ])('"%s" surfaces %s in the shortlist', async (query, slug) => {
    const out = await handleLookup({ query }, snap);
    expect(out).toContain(slug);
    expect(out).toContain('Top matches');
  });

  it('the shortlist explains the follow-up call and stays short', async () => {
    const out = await handleLookup({ query: 'security' }, snap);
    expect(out).toContain('call lumo_lookup with the slug');
    expect((out.match(/^- `/gm) ?? []).length).toBeLessThanOrEqual(5);
  });
});

describe('lookup query — honest misses', () => {
  it('a Pro topic goes through the paywall teaser, not "nothing found"', async () => {
    const out = await handleLookup({ query: 'woocommerce hpos orders' }, snap);
    expect(out.toLowerCase()).toContain('pro');
  });

  it('gibberish gets an honest miss, never an invented match', async () => {
    const out = await handleLookup({ query: 'zzqx flurble' }, snap);
    expect(out).toContain('No curated entry found');
  });

  it('slug lookups behave exactly as before (regression)', async () => {
    const out = await handleLookup({ slug: 'wpdb-query-without-prepare-sql-injection' }, snap);
    expect(out).toContain('## ');
    expect(out).toContain('$wpdb->prepare()');
  });
});

// The structured verdict (product-gate condition): same pass as the prose, and
// the fail-open path must be marked, never dressed as a clean verdict.
describe('check_code structured verdict', () => {
  it('BELL: computed verdict mirrors the prose exactly (one pass, no divergence)', async () => {
    const { handleCheckCodeFull } = await import('../src/mcp/handlers.js');
    const v = await handleCheckCodeFull(
      { code: `<?php $r = $wpdb->get_results( "SELECT * FROM t WHERE id = $id" ); $f = rwmb_meta('x');`, language: 'php' },
      snap,
    );
    expect(v.computed).toBe(true);
    expect(v.found).toBe(true);
    expect(v.loudCount).toBe(1);
    expect(v.gaps).toEqual([{ plugin: 'Meta Box', proCovers: true }]);
    expect(v.text).toContain('⚠️');
  });

  it('SILENCE: clean code is computed:true found:false — a real verdict, not a shrug', async () => {
    const { handleCheckCodeFull } = await import('../src/mcp/handlers.js');
    const v = await handleCheckCodeFull(
      { code: `<?php echo esc_html__( 'Hi', 'my-plugin' );`, language: 'php' },
      snap,
    );
    expect(v.computed).toBe(true);
    expect(v.found).toBe(false);
  });

  it('DEGRADATION: a failing pipeline is marked computed:false, never a clean verdict', async () => {
    const { handleCheckCodeFull } = await import('../src/mcp/handlers.js');
    const poisoned = { get code(): string { throw new Error('boom'); }, language: 'php' as const };
    const v = await handleCheckCodeFull(poisoned, snap);
    expect(v.computed).toBe(false);
    expect(v.found).toBe(false);
    expect(v.text.length).toBeGreaterThan(0); // the prose still answers
  });
});
