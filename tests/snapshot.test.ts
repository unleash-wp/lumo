import { describe, it, expect } from 'vitest';
import { loadSnapshot, validateEntry } from '../src/lib/snapshot.js';
import type { Snapshot } from '../src/types.js';

// ---------------------------------------------------------------------------
// Helpers — build minimal valid and deliberately broken snapshot objects so we
// can exercise the exported validateEntry directly, without going to disk.
// ---------------------------------------------------------------------------

/** Minimal valid Free entry — all required fields present, no `body`. */
function validEntry() {
  return {
    slug: 'woocommerce-hpos-order-access',
    title: 'WooCommerce HPOS: reading and writing order data',
    category_slug: 'woocommerce',
    summary: 'Under HPOS order data lives in dedicated tables.',
    code_example: '$order = wc_get_order( $id );',
    bad_pattern: '$email = get_post_meta( $id, "_billing_email", true );',
    source_url: 'https://github.com/woocommerce/woocommerce/wiki/High-Performance-Order-Storage-Upgrade-Recipe-Book',
    test_step: 'Enable HPOS on staging and confirm order reads/writes still work.',
    tier: 'free' as const,
    updatedAt: '2026-06-20T09:30:00Z',
    versions: [{ wp_version_min: null, wp_version_max: null, woo_version_min: '8.2', breaking_change: true }],
  };
}

/** Minimal valid snapshot envelope wrapping a single entry. */
function validSnapshot(entries: unknown[] = [validEntry()]): Snapshot {
  return {
    schemaVersion: 1,
    generatedAt: '2026-06-20T09:30:00Z',
    source: { repo: 'unleash-wp/lumo-pro', db: 'knowledge.db' },
    entries: entries as Snapshot['entries'],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('snapshot validation — required Free fields', () => {
  it('accepts a fully valid entry', () => {
    expect(() => validateEntry(validEntry(), 0)).not.toThrow();
  });

  // All 8 required fields — 5 evidence fields + slug/title/category_slug
  const requiredFields = [
    'slug',
    'title',
    'category_slug',
    'summary',
    'bad_pattern',
    'code_example',
    'source_url',
    'test_step',
  ] as const;

  for (const field of requiredFields) {
    it(`rejects an entry with empty "${field}"`, () => {
      const entry = { ...validEntry(), [field]: '' };
      expect(() => validateEntry(entry, 0)).toThrow(field);
    });

    it(`rejects an entry with null "${field}"`, () => {
      const entry = { ...validEntry(), [field]: null };
      expect(() => validateEntry(entry, 0)).toThrow(field);
    });

    it(`rejects an entry with missing "${field}"`, () => {
      const entry = { ...validEntry() };
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (entry as Record<string, unknown>)[field];
      expect(() => validateEntry(entry, 0)).toThrow(field);
    });
  }

  it('rejects an entry that contains the Pro "body" field', () => {
    const entry = {
      ...validEntry(),
      body: '## Audit — what to flag in order context\n- get_post_meta on order id',
    };
    expect(() => validateEntry(entry, 0)).toThrow('body');
  });

  it('rejects an entry with tier != "free"', () => {
    const entry = { ...validEntry(), tier: 'pro' as const };
    // tier is declared as literal 'free' on SnapshotEntry; cast through unknown for the test
    expect(() => validateEntry(entry as unknown, 0)).toThrow('tier');
  });

  it('rejects a non-object entry', () => {
    expect(() => validateEntry(null, 0)).toThrow('not an object');
    expect(() => validateEntry('string', 0)).toThrow('not an object');
  });
});

describe('snapshot artifact — actual data/snapshot.json', () => {
  it('loads without throwing', () => {
    expect(() => loadSnapshot()).not.toThrow();
  });

  it('has schemaVersion 1', () => {
    const snap = loadSnapshot();
    expect(snap.schemaVersion).toBe(1);
  });

  it('has at least one entry', () => {
    const snap = loadSnapshot();
    expect(snap.entries.length).toBeGreaterThan(0);
  });

  it('every entry has tier "free"', () => {
    const snap = loadSnapshot();
    for (const entry of snap.entries) {
      expect(entry.tier).toBe('free');
    }
  });

  it('no entry contains a Pro "body" field', () => {
    const snap = loadSnapshot();
    for (const entry of snap.entries) {
      expect(Object.prototype.hasOwnProperty.call(entry, 'body')).toBe(false);
    }
  });

  it('HPOS entry carries all required Free fields', () => {
    const snap = loadSnapshot();
    const hpos = snap.entries.find((e) => e.slug === 'woocommerce-hpos-order-access');
    expect(hpos).toBeDefined();
    if (!hpos) return;

    expect(hpos.summary).toBeTruthy();
    expect(hpos.bad_pattern).toBeTruthy();
    expect(hpos.code_example).toBeTruthy();
    expect(hpos.source_url).toBeTruthy();
    expect(hpos.test_step).toBeTruthy();
  });

  it('HPOS entry has category_slug "woocommerce" for detection routing', () => {
    const snap = loadSnapshot();
    const hpos = snap.entries.find((e) => e.slug === 'woocommerce-hpos-order-access');
    expect(hpos?.category_slug).toBe('woocommerce');
  });

  it('HPOS entry has version row with woo_version_min "8.2"', () => {
    const snap = loadSnapshot();
    const hpos = snap.entries.find((e) => e.slug === 'woocommerce-hpos-order-access');
    expect(hpos?.versions.length).toBeGreaterThan(0);
    expect(hpos?.versions[0]?.woo_version_min).toBe('8.2');
  });

  it('generatedAt matches max updatedAt across entries (deterministic, not wall-clock)', () => {
    const snap = loadSnapshot();
    const maxUpdated = snap.entries.reduce((max, e) => (e.updatedAt > max ? e.updatedAt : max), '');
    expect(snap.generatedAt).toBe(maxUpdated);
  });
});
