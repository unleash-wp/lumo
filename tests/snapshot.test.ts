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

  it('has exactly 15 entries', () => {
    const snap = loadSnapshot();
    expect(snap.entries.length).toBe(15);
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

  it('every entry passes validateEntry', () => {
    const snap = loadSnapshot();
    snap.entries.forEach((entry, i) => {
      expect(() => validateEntry(entry, i)).not.toThrow();
    });
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

  it('wp-img-tag deprecation entry carries all required Free fields', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'wp-img-tag-add-decoding-attr-deprecation');
    expect(entry).toBeDefined();
    if (!entry) return;

    expect(entry.summary).toBeTruthy();
    expect(entry.bad_pattern).toBeTruthy();
    expect(entry.code_example).toBeTruthy();
    expect(entry.source_url).toBeTruthy();
    expect(entry.test_step).toBeTruthy();
    expect(entry.tier).toBe('free');
    expect(entry.category_slug).toBe('wordpress-core');
  });

  it('wp-img-tag deprecation entry has no body field', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'wp-img-tag-add-decoding-attr-deprecation');
    expect(Object.prototype.hasOwnProperty.call(entry, 'body')).toBe(false);
  });

  it('wp-img-tag deprecation entry has wp_version_min "6.4.0" and no woo_version_min', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'wp-img-tag-add-decoding-attr-deprecation');
    expect(entry?.versions.length).toBeGreaterThan(0);
    expect(entry?.versions[0]?.wp_version_min).toBe('6.4.0');
    expect(entry?.versions[0]?.woo_version_min).toBeNull();
    expect(entry?.versions[0]?.breaking_change).toBe(true);
  });

  it('wp-output-escaping entry carries all required Free fields', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'wp-output-escaping-xss-prevention');
    expect(entry).toBeDefined();
    if (!entry) return;

    expect(entry.summary).toBeTruthy();
    expect(entry.bad_pattern).toBeTruthy();
    expect(entry.code_example).toBeTruthy();
    expect(entry.source_url).toBeTruthy();
    expect(entry.test_step).toBeTruthy();
    expect(entry.tier).toBe('free');
    expect(entry.category_slug).toBe('wordpress-security');
  });

  it('wp-output-escaping entry has no body field', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'wp-output-escaping-xss-prevention');
    expect(Object.prototype.hasOwnProperty.call(entry, 'body')).toBe(false);
  });

  it('wp-output-escaping entry has wp_version_min "3.5" and no woo_version_min', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'wp-output-escaping-xss-prevention');
    expect(entry?.versions[0]?.wp_version_min).toBe('3.5');
    expect(entry?.versions[0]?.woo_version_min).toBeNull();
    expect(entry?.versions[0]?.breaking_change).toBe(false);
  });

  it('generatedAt matches max updatedAt across entries (deterministic, not wall-clock)', () => {
    const snap = loadSnapshot();
    const maxUpdated = snap.entries.reduce((max, e) => (e.updatedAt > max ? e.updatedAt : max), '');
    expect(snap.generatedAt).toBe(maxUpdated);
  });

  it('generatedAt is 2026-06-23T10:00:00Z', () => {
    const snap = loadSnapshot();
    expect(snap.generatedAt).toBe('2026-06-23T10:00:00Z');
  });

  it('env-file-committed-to-git entry is present with slug and correct category', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'env-file-committed-to-git');
    expect(entry).toBeDefined();
    expect(entry?.category_slug).toBe('env-in-git');
    expect(entry?.tier).toBe('free');
  });

  it('env-file-committed-to-git entry carries all required Free fields', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'env-file-committed-to-git');
    expect(entry).toBeDefined();
    if (!entry) return;

    expect(entry.title).toBeTruthy();
    expect(entry.summary).toBeTruthy();
    expect(entry.bad_pattern).toBeTruthy();
    expect(entry.code_example).toBeTruthy();
    expect(entry.source_url).toBe(
      'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository',
    );
    expect(entry.test_step).toBeTruthy();
  });

  it('env-file-committed-to-git entry has no body field', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'env-file-committed-to-git');
    expect(Object.prototype.hasOwnProperty.call(entry, 'body')).toBe(false);
  });

  it('env-file-committed-to-git entry versions are all-null (not version-bound)', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'env-file-committed-to-git');
    expect(entry?.versions.length).toBe(1);
    expect(entry?.versions[0]?.wp_version_min).toBeNull();
    expect(entry?.versions[0]?.wp_version_max).toBeNull();
    expect(entry?.versions[0]?.woo_version_min).toBeNull();
    expect(entry?.versions[0]?.breaking_change).toBe(false);
  });

  it('env-file-committed-to-git entry passes validateEntry', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'env-file-committed-to-git');
    expect(entry).toBeDefined();
    if (!entry) return;
    expect(() => validateEntry(entry, snap.entries.indexOf(entry))).not.toThrow();
  });

  it('missing-composer-lock-file entry is present with correct slug and category', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'missing-composer-lock-file');
    expect(entry).toBeDefined();
    expect(entry?.category_slug).toBe('wordpress-dependencies');
    expect(entry?.tier).toBe('free');
  });

  it('missing-composer-lock-file entry carries all required Free fields', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'missing-composer-lock-file');
    expect(entry).toBeDefined();
    if (!entry) return;
    expect(entry.summary).toBeTruthy();
    expect(entry.bad_pattern).toBeTruthy();
    expect(entry.code_example).toBeTruthy();
    expect(entry.source_url).toBeTruthy();
    expect(entry.test_step).toBeTruthy();
  });

  it('missing-composer-lock-file entry versions are all-null', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'missing-composer-lock-file');
    expect(entry?.versions.length).toBe(1);
    expect(entry?.versions[0]?.wp_version_min).toBeNull();
    expect(entry?.versions[0]?.wp_version_max).toBeNull();
    expect(entry?.versions[0]?.woo_version_min).toBeNull();
    expect(entry?.versions[0]?.breaking_change).toBe(false);
  });

  it('hardcoded-api-keys-secrets entry is present with correct slug and category', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'hardcoded-api-keys-secrets');
    expect(entry).toBeDefined();
    expect(entry?.category_slug).toBe('hardcoded-secrets');
    expect(entry?.tier).toBe('free');
  });

  it('hardcoded-api-keys-secrets entry carries all required Free fields', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'hardcoded-api-keys-secrets');
    expect(entry).toBeDefined();
    if (!entry) return;
    expect(entry.summary).toBeTruthy();
    expect(entry.bad_pattern).toBeTruthy();
    expect(entry.code_example).toBeTruthy();
    expect(entry.source_url).toBeTruthy();
    expect(entry.test_step).toBeTruthy();
  });

  it('hardcoded-api-keys-secrets entry passes validateEntry', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'hardcoded-api-keys-secrets');
    expect(entry).toBeDefined();
    if (!entry) return;
    expect(() => validateEntry(entry, snap.entries.indexOf(entry))).not.toThrow();
  });

  it('gutenberg-usesetting-deprecated-wp6-5 entry is present with correct category', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'gutenberg-usesetting-deprecated-wp6-5');
    expect(entry).toBeDefined();
    expect(entry?.category_slug).toBe('gutenberg');
    expect(entry?.tier).toBe('free');
  });

  it('gutenberg-usesetting-deprecated-wp6-5 entry carries all required Free fields', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'gutenberg-usesetting-deprecated-wp6-5');
    expect(entry).toBeDefined();
    if (!entry) return;
    expect(entry.summary).toBeTruthy();
    expect(entry.bad_pattern).toBeTruthy();
    expect(entry.code_example).toBeTruthy();
    expect(entry.source_url).toBe(
      'https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/',
    );
    expect(entry.test_step).toBeTruthy();
  });

  it('gutenberg-usesetting entry has wp_version_min "6.5.0" and breaking_change false', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'gutenberg-usesetting-deprecated-wp6-5');
    expect(entry?.versions.length).toBe(1);
    expect(entry?.versions[0]?.wp_version_min).toBe('6.5.0');
    expect(entry?.versions[0]?.woo_version_min).toBeNull();
    expect(entry?.versions[0]?.breaking_change).toBe(false);
  });

  it('gutenberg-isvalidblockcontent-removed entry is present with correct category', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'gutenberg-isvalidblockcontent-removed');
    expect(entry).toBeDefined();
    expect(entry?.category_slug).toBe('gutenberg');
    expect(entry?.tier).toBe('free');
  });

  it('gutenberg-isvalidblockcontent-removed entry carries all required Free fields', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'gutenberg-isvalidblockcontent-removed');
    expect(entry).toBeDefined();
    if (!entry) return;
    expect(entry.summary).toBeTruthy();
    expect(entry.bad_pattern).toBeTruthy();
    expect(entry.code_example).toBeTruthy();
    expect(entry.source_url).toBe(
      'https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/',
    );
    expect(entry.test_step).toBeTruthy();
  });

  it('gutenberg-isvalidblockcontent entry has wp_version_min "5.9" and breaking_change true', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'gutenberg-isvalidblockcontent-removed');
    expect(entry?.versions.length).toBe(1);
    expect(entry?.versions[0]?.wp_version_min).toBe('5.9');
    expect(entry?.versions[0]?.woo_version_min).toBeNull();
    expect(entry?.versions[0]?.breaking_change).toBe(true);
  });

  it('gutenberg-apiversion-2-deprecated-wp6-9 entry is present with correct category', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find(
      (e) => e.slug === 'gutenberg-apiversion-2-deprecated-wp6-9',
    );
    expect(entry).toBeDefined();
    expect(entry?.category_slug).toBe('gutenberg');
    expect(entry?.tier).toBe('free');
  });

  it('gutenberg-apiversion-2-deprecated-wp6-9 entry carries all required Free fields', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find(
      (e) => e.slug === 'gutenberg-apiversion-2-deprecated-wp6-9',
    );
    expect(entry).toBeDefined();
    if (!entry) return;
    expect(entry.summary).toBeTruthy();
    expect(entry.bad_pattern).toBeTruthy();
    expect(entry.code_example).toBeTruthy();
    expect(entry.source_url).toBe(
      'https://developer.wordpress.org/block-editor/reference-guides/block-api/block-api-versions/',
    );
    expect(entry.test_step).toBeTruthy();
  });

  it('gutenberg-apiversion entry has wp_version_min "6.9" and breaking_change true', () => {
    const snap = loadSnapshot();
    const entry = snap.entries.find(
      (e) => e.slug === 'gutenberg-apiversion-2-deprecated-wp6-9',
    );
    expect(entry?.versions.length).toBe(1);
    expect(entry?.versions[0]?.wp_version_min).toBe('6.9');
    expect(entry?.versions[0]?.woo_version_min).toBeNull();
    expect(entry?.versions[0]?.breaking_change).toBe(true);
  });
});
