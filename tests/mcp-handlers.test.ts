import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleAudit, handleLookup, handleCheckCode } from '../src/mcp/handlers.js';
import { loadSnapshot } from '../src/lib/snapshot.js';
import type { SnapshotEntry } from '../src/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

/**
 * A project the Free tier still has knowledge for: the wordpress-core heuristic
 * signal. WooCommerce projects now resolve to the Pro teaser, so the Free-Markdown
 * audit path needs a Free-covered pattern to be exercised at all.
 */
function makeFreeAuditProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'lumo-free-audit-'));
  writeFileSync(
    join(dir, 'plugin.php'),
    '<?php\n$html = wp_img_tag_add_decoding_attr( $img, \'the_content\' );\n',
  );
  return dir;
}

/** The Free-tier LOUD blob — the catch a real free user hits (WP 6.4, breaking). */
// A WP 5.9 removal, so LOUD rests on a break that really happened. This was
// wp_img_tag_add_decoding_attr(), which is deprecated and not removed.
const loudBlob = `const ok = isValidBlockContent( blockType, attrs, inner, html );`;

// Gutenberg entries are Pro-MCP-only (freeSnapshot:false); WooCommerce knowledge is
// Pro-only too. Neither ships in the redistributable Free snapshot. Tests that verify
// catch-engine or handler wiring against these entries use catchSnap — an extended
// snapshot with synthetic entries for test-only purposes.
const proOnlyCatchEntries: SnapshotEntry[] = [
  {
    slug: 'woocommerce-hpos-order-access',
    title: 'WooCommerce HPOS: reading and writing order data',
    category_slug: 'woocommerce',
    summary: 'Under HPOS order data lives in dedicated order tables, not wp_posts/wp_postmeta.',
    code_example: '$order = wc_get_order( $order_id );',
    bad_pattern: "$email = get_post_meta( $order_id, '_billing_email', true );",
    source_url:
      'https://github.com/woocommerce/woocommerce/wiki/High-Performance-Order-Storage-Upgrade-Recipe-Book',
    test_step: 'On staging, enable HPOS and confirm your order reads/writes still work.',
    tier: 'free' as const,
    updatedAt: '2026-06-20T09:30:00Z',
    versions: [
      { wp_version_min: null, wp_version_max: null, woo_version_min: '8.2', breaking_change: true },
    ],
  },
  {
    slug: 'gutenberg-usesetting-deprecated-wp6-5',
    title: 'useSetting() hook deprecated in WP 6.5: migrate to useSettings()',
    category_slug: 'gutenberg',
    summary: 'The useSetting() hook was deprecated in WordPress 6.5.0 in favor of useSettings().',
    code_example: "import { useSettings } from '@wordpress/block-editor';",
    bad_pattern: "import { useSetting } from '@wordpress/block-editor';",
    source_url: 'https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/',
    test_step: "Replace useSetting() calls with useSettings().",
    tier: 'free' as const,
    updatedAt: '2026-06-22T13:00:00Z',
    versions: [{ wp_version_min: '6.5.0', wp_version_max: null, woo_version_min: null, breaking_change: false }],
  },
  {
    slug: 'gutenberg-isvalidblockcontent-removed',
    title: 'wp.blocks.isValidBlockContent() removed: use validateBlock() instead',
    category_slug: 'gutenberg',
    summary: 'The wp.blocks.isValidBlockContent() function was removed.',
    code_example: 'const result = wp.blocks.validateBlock( block );',
    bad_pattern: 'const { isValidBlockContent } = wp.blocks;',
    source_url: 'https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/',
    test_step: 'Replace isValidBlockContent() calls with validateBlock().',
    tier: 'free' as const,
    updatedAt: '2026-06-22T13:00:00Z',
    versions: [{ wp_version_min: '5.9', wp_version_max: null, woo_version_min: null, breaking_change: true }],
  },
  {
    slug: 'gutenberg-apiversion-2-deprecated-wp6-9',
    title: 'Block API version 2 deprecated in WP 6.9: migrate to apiVersion 3',
    category_slug: 'gutenberg',
    summary: 'Starting in WordPress 6.9, blocks registered with apiVersion 2 or lower trigger browser console warnings.',
    code_example: 'wp.blocks.registerBlockType( "my-ns/my-block", { apiVersion: 3 } );',
    bad_pattern: 'wp.blocks.registerBlockType( "my-ns/my-block", { apiVersion: 2 } );',
    source_url: 'https://developer.wordpress.org/block-editor/reference-guides/block-api/block-api-versions/',
    test_step: 'Migrate registerBlockType() calls to apiVersion 3.',
    tier: 'free' as const,
    updatedAt: '2026-06-22T13:00:00Z',
    versions: [{ wp_version_min: '6.9', wp_version_max: null, woo_version_min: null, breaking_change: true }],
  },
];

const snapBase = loadSnapshot();
const catchSnap = { ...snapBase, entries: [...snapBase.entries, ...proOnlyCatchEntries] };

// ---------------------------------------------------------------------------
// handleAudit
// ---------------------------------------------------------------------------

describe('handleAudit', () => {
  // WooCommerce knowledge is Pro-only: a detected Woo project gets the teaser, not
  // a Free entry. Detection must still fire so the user is never told "all clear".
  it('returns the Pro teaser when WooCommerce is detected', async () => {
    const result = await handleAudit({ project_root: join(fixturesDir, 'classic-wp') });

    expect(result).toContain('Detected WooCommerce');
    expect(result).toContain('Lumo Pro');
    // Not a false all-clear
    expect(result).not.toContain('No known WordPress risk patterns detected');
  });

  it('returns Free Markdown when a Free-covered pattern is detected', async () => {
    const result = await handleAudit({ project_root: makeFreeAuditProject() });

    // Must contain the entry title
    expect(result).toContain('wp_img_tag_add_decoding_attr');
    // Must contain wrong/correct sections
    expect(result).toContain('### Wrong');
    expect(result).toContain('### Correct');
    // Must cite source
    expect(result).toContain('Source:');
    // Must include test step
    expect(result).toContain('Verify:');
  });

  it('output contains NO "body" key — Free tier boundary', async () => {
    const result = await handleAudit({ project_root: makeFreeAuditProject() });
    // The literal string "body" must not appear as a JSON key or Markdown heading
    expect(result).not.toMatch(/^"body":/m);
    expect(result).not.toMatch(/^## body/im);
  });

  it('returns neutral message for a non-Woo project', async () => {
    const result = await handleAudit({ project_root: join(fixturesDir, 'non-woo') });
    expect(result).toContain('No known WordPress risk patterns detected');
  });

  it('returns neutral message for a non-existent path — never throws', async () => {
    await expect(
      handleAudit({ project_root: '/tmp/__lumo_nonexistent_fixture__' }),
    ).resolves.toContain('No known WordPress risk patterns detected');
  });

  it('defaults to process.cwd() when project_root is omitted — never throws', async () => {
    await expect(handleAudit({})).resolves.toBeTypeOf('string');
  });

  it('returns a string when project_root is an empty string — never throws', async () => {
    await expect(handleAudit({ project_root: '' })).resolves.toBeTypeOf('string');
  });

  it('output matches formatFreeMarkdown for the wp-img-tag entry (byte-equal check)', async () => {
    const { formatFreeMarkdown, renderFree } = await import('../src/lib/render.js');
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'wp-img-tag-add-decoding-attr-deprecation');
    if (!entry) throw new Error('wp-img-tag entry missing from snapshot — test setup broken');

    const expected = formatFreeMarkdown(renderFree(entry));
    const actual = await handleAudit({ project_root: makeFreeAuditProject() });
    expect(actual).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// handleLookup
// ---------------------------------------------------------------------------

describe('handleLookup', () => {
  // Lookup reads the shipped Free snapshot, so both the slug and the category case
  // use Free-tier knowledge — WooCommerce slugs/categories are Pro-only now.
  it('returns Free Markdown for a known slug', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ slug: 'wp-img-tag-add-decoding-attr-deprecation' }, snap);

    expect(result).toContain('wp_img_tag_add_decoding_attr');
    expect(result).toContain('### Wrong');
    expect(result).toContain('### Correct');
    expect(result).toContain('Source:');
    expect(result).toContain('Verify:');
  });

  it('output contains NO "body" key for slug lookup — Free tier boundary', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ slug: 'wp-img-tag-add-decoding-attr-deprecation' }, snap);
    expect(result).not.toMatch(/^"body":/m);
    expect(result).not.toMatch(/^## body/im);
  });

  it('returns Free Markdown for a known category', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ category: 'wordpress-security' }, snap);

    expect(result).toContain('esc_html');
    expect(result).toContain('Source:');
  });

  it('output contains NO "body" key for category lookup — Free tier boundary', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ category: 'wordpress-security' }, snap);
    expect(result).not.toMatch(/^"body":/m);
    expect(result).not.toMatch(/^## body/im);
  });

  it('answers the Pro-only "woocommerce" category with the Pro teaser, not a dead end', async () => {
    // Same story lumo_audit tells when it detects WooCommerce in a project:
    // the knowledge exists, it is licensed. "No curated entry found" would be
    // untrue and would waste the highest-intent free-tier moment.
    const snap = loadSnapshot();
    const result = await handleLookup({ category: 'woocommerce' }, snap);
    expect(result).toContain('part of Lumo Pro');
    expect(result).not.toContain('No curated entry found');
  });

  it('returns neutral message for unknown slug', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ slug: 'totally-unknown-slug-xyzzy' }, snap);
    expect(result).toContain('No curated entry found');
  });

  it('returns neutral message for unknown category', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ category: 'nonexistent-category' }, snap);
    expect(result).toContain('No curated entry found');
  });

  it('returns guidance when both slug and category are omitted', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({}, snap);
    expect(result).toContain('slug');
  });

  it('never throws on malformed input', async () => {
    await expect(handleLookup({ slug: '' })).resolves.toBeTypeOf('string');
    await expect(handleLookup({ category: '' })).resolves.toBeTypeOf('string');
  });

  it('returns the escaping entry for slug "wp-output-escaping-xss-prevention"', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ slug: 'wp-output-escaping-xss-prevention' }, snap);
    expect(result).toContain('esc_html');
    expect(result).toContain('XSS');
    expect(result).toContain('Source:');
  });

  it('returns the wp-img-tag deprecation entry for category "wordpress-core"', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ category: 'wordpress-core' }, snap);
    expect(result).toContain('wp_img_tag_add_decoding_attr');
    expect(result).toContain('Source:');
  });

  it('returns the missing-composer-lock-file entry for category "wordpress-dependencies"', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ category: 'wordpress-dependencies' }, snap);
    expect(result).toContain('composer.lock');
    expect(result).toContain('Source:');
  });

  it('returns the hardcoded-api-keys-secrets entry for slug "hardcoded-api-keys-secrets"', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ slug: 'hardcoded-api-keys-secrets' }, snap);
    expect(result).toContain('API keys');
    expect(result).toContain('Source:');
  });

  // Gutenberg entries are now in the Free snapshot (freeSnapshot:true) —
  // they are present and return content from the Free lookup handler.
  it('gutenberg category returns entries — now in Free snapshot', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ category: 'gutenberg' }, snap);
    expect(result).not.toContain('No curated entry found');
    expect(result).toContain('Source:');
  });

  it('gutenberg-usesetting slug returns content — now in Free snapshot', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ slug: 'gutenberg-usesetting-deprecated-wp6-5' }, snap);
    expect(result).not.toContain('No curated entry found');
    expect(result).toContain('Source:');
  });

  it('gutenberg-isvalidblockcontent slug returns content — now in Free snapshot', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ slug: 'gutenberg-isvalidblockcontent-removed' }, snap);
    expect(result).not.toContain('No curated entry found');
    expect(result).toContain('Source:');
  });

  it('gutenberg-apiversion slug returns content — now in Free snapshot', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ slug: 'gutenberg-apiversion-2-deprecated-wp6-9' }, snap);
    expect(result).not.toContain('No curated entry found');
    expect(result).toContain('Source:');
  });
});

// ---------------------------------------------------------------------------
// handleCheckCode — version-scoping
// ---------------------------------------------------------------------------

describe('handleCheckCode — version-scoping', () => {
  // These tests exercise version-relative LOUD output for a gutenberg LOUD signal.
  // isValidBlockContent has breaking_change:true (removed in WP 5.9) so it produces LOUD.
  it('explicit wp_version produces relative line in LOUD output', async () => {
    // isValidBlockContent removed in WP 5.9; project on 5.9 → already-broken
    const code = `const { isValidBlockContent } = wp.blocks;\nisValidBlockContent( b, a, [], h );`;
    const result = await handleCheckCode({ code, language: 'js', wp_version: '5.9' }, catchSnap);
    expect(result).toContain('BREAKING:');
    // The relative line should appear (already-broken)
    expect(result).toContain('Fix now.');
  });

  it('explicit wp_version below breaking version produces upcoming line', async () => {
    // isValidBlockContent removed in WP 5.9; project on 5.8 → upcoming
    const code = `const { isValidBlockContent } = wp.blocks;\nisValidBlockContent( b, a, [], h );`;
    const result = await handleCheckCode({ code, language: 'js', wp_version: '5.8' }, catchSnap);
    expect(result).toContain('BREAKING:');
    expect(result).toContain('soon-dead pattern');
  });

  it('project_root that does not exist → never throws, output is a string', async () => {
    await expect(
      handleCheckCode(
        { code: loudBlob, language: 'js', project_root: '/tmp/__lumo_no_such_dir__' },
        catchSnap,
      ),
    ).resolves.toBeTypeOf('string');
  });

  it('project_root with no version detection falls back gracefully — still emits LOUD', async () => {
    const result = await handleCheckCode(
      { code: loudBlob, language: 'js', project_root: join(fixturesDir, 'non-woo') },
      catchSnap,
    );
    // LOUD still fires; no relative line because version unknown — but no throw
    expect(result).toContain('BREAKING:');
  });

  it('handleAudit byte-equal check remains green (regression guard)', async () => {
    const { formatFreeMarkdown, renderFree } = await import('../src/lib/render.js');
    const s = loadSnapshot();
    const entry = s.entries.find((e) => e.slug === 'wp-img-tag-add-decoding-attr-deprecation');
    if (!entry) throw new Error('wp-img-tag entry missing — test setup broken');

    const expected = formatFreeMarkdown(renderFree(entry));
    const actual = await handleAudit({ project_root: makeFreeAuditProject() });
    expect(actual).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// handleCheckCode — upgrade prompt wiring
// ---------------------------------------------------------------------------

describe('handleCheckCode — upgrade prompt wiring', () => {
  // The funnel is asserted on the Free LOUD entry — that is the catch a free user
  // reaches now. The WooCommerce domain label is covered separately below via the
  // Pro fixture, since that mapping still ships.
  const hposBlob = `$orders = get_posts( array( 'post_type' => 'shop_order' ) );`;

  afterEach(() => {
    delete process.env['LUMO_CHECKOUT_URL'];
    delete process.env['LUMO_UPGRADE_PROMPT'];
  });

  it('no checkout URL configured → LOUD fires but no upgrade prompt (dead default never shown)', async () => {
    delete process.env['LUMO_CHECKOUT_URL'];
    const result = await handleCheckCode({ code: loudBlob, language: 'js' }, catchSnap);
    expect(result).toContain('BREAKING:');
    expect(result).not.toContain('Get it:');
  });

  it('real checkout URL set → appends the prompt with the gated count, domain label, and attributed link', async () => {
    process.env['LUMO_CHECKOUT_URL'] = 'https://buy.example.com/pro';
    const result = await handleCheckCode({ code: loudBlob, language: 'js' }, catchSnap);
    // The label followed the fixture: it read "WordPress Core" while the LOUD
    // came from the mis-stamped core deprecation. That entry is SOFT now, so
    // the LOUD a free user can reach is the Block Editor removal.
    expect(result).toContain('Lumo caught 1 stale-pattern risk in your Block Editor code.');
    expect(result).toContain('Get it: https://buy.example.com/pro?ref=catch&gated=1&v=block');
  });

  it('kill-switch off → no prompt even with a real URL set', async () => {
    process.env['LUMO_CHECKOUT_URL'] = 'https://buy.example.com/pro';
    process.env['LUMO_UPGRADE_PROMPT'] = 'off';
    const result = await handleCheckCode({ code: loudBlob, language: 'js' }, catchSnap);
    expect(result).not.toContain('Get it:');
  });

  it('Block Editor LOUD catch → prompt fires with "Block Editor" domain label', async () => {
    process.env['LUMO_CHECKOUT_URL'] = 'https://buy.example.com/pro';
    // isValidBlockContent is breaking_change:true (removed in WP 5.9) → LOUD
    const code = `const { isValidBlockContent } = wp.blocks;\nisValidBlockContent( b, a, [], h );`;
    const result = await handleCheckCode({ code, language: 'js' }, catchSnap);
    expect(result).toContain('BREAKING:');
    // Domain-aware prompt fires on any LOUD catch when a real URL is configured.
    expect(result).toContain('Get it:');
    expect(result).toContain('Block Editor');
  });

  // WooCommerce catches are Pro knowledge now, so this runs off the Pro fixture in
  // catchSnap — the woocommerce → "WooCommerce" label mapping still ships in handlers.
  it('WooCommerce LOUD catch → WooCommerce domain label, singular "risk" for a single result', async () => {
    process.env['LUMO_CHECKOUT_URL'] = 'https://buy.example.com/pro';
    const result = await handleCheckCode({ code: hposBlob, language: 'php' }, catchSnap);
    // Single LOUD result → "risk" not "risks"
    expect(result).toContain('stale-pattern risk in your WooCommerce code.');
    expect(result).not.toContain('stale-pattern risks in your');
  });

  it('prompt copy does not contain "HPOS" — wedge is now domain-neutral', async () => {
    process.env['LUMO_CHECKOUT_URL'] = 'https://buy.example.com/pro';
    const result = await handleCheckCode({ code: hposBlob, language: 'php' }, catchSnap);
    // The upgrade prompt block must not re-introduce the old HPOS framing
    const promptSection = result.split('---').slice(-1)[0] ?? '';
    expect(promptSection).not.toContain('HPOS');
  });
});

// ---------------------------------------------------------------------------
// handleCheckCode — freshness-gap reveal (C4)
//
// Appears only on gated (catch) answers, only when the upgrade prompt block did
// NOT fire on the same response. Kill-switch gates both. Never on lumo_audit.
// ---------------------------------------------------------------------------

describe('handleCheckCode — freshness-gap reveal (C4)', () => {
  afterEach(() => {
    delete process.env['LUMO_CHECKOUT_URL'];
    delete process.env['LUMO_UPGRADE_PROMPT'];
    delete process.env['LUMO_PRO_MCP_URL'];
  });

  it('reveal fires on a LOUD catch when no checkout URL is set (upgrade prompt suppressed)', async () => {
    delete process.env['LUMO_CHECKOUT_URL'];
    const result = await handleCheckCode({ code: loudBlob, language: 'js' }, catchSnap);
    expect(result).toContain('verified as of');
  });

  it('names no Pro MCP endpoint while LUMO_PRO_MCP_URL is unset (no dead install command)', async () => {
    delete process.env['LUMO_CHECKOUT_URL'];
    delete process.env['LUMO_PRO_MCP_URL'];
    const result = await handleCheckCode({ code: loudBlob, language: 'js' }, catchSnap);
    expect(result).toContain('verified as of');
    expect(result).not.toContain('claude mcp add');
  });

  it('appends the add-command only when LUMO_PRO_MCP_URL names a reachable server', async () => {
    delete process.env['LUMO_CHECKOUT_URL'];
    process.env['LUMO_PRO_MCP_URL'] = 'https://mcp.example.test/mcp';
    const result = await handleCheckCode({ code: loudBlob, language: 'js' }, catchSnap);
    expect(result).toContain('claude mcp add lumo-pro --transport http https://mcp.example.test/mcp');
  });

  it('reveal does NOT fire when the upgrade prompt block already fired (no double-printing)', async () => {
    process.env['LUMO_CHECKOUT_URL'] = 'https://buy.example.com/pro';
    const result = await handleCheckCode({ code: loudBlob, language: 'js' }, catchSnap);
    // Upgrade prompt fires (Get it:) → reveal must not also appear
    expect(result).toContain('Get it:');
    expect(result).not.toContain('verified as of');
    expect(result).not.toContain('claude mcp add');
  });

  it('reveal is suppressed when kill-switch is off', async () => {
    delete process.env['LUMO_CHECKOUT_URL'];
    process.env['LUMO_UPGRADE_PROMPT'] = 'off';
    const result = await handleCheckCode({ code: loudBlob, language: 'js' }, catchSnap);
    expect(result).not.toContain('verified as of');
    expect(result).not.toContain('claude mcp add');
  });

  it('reveal fires on a SOFT catch (any gated result, not just LOUD)', async () => {
    delete process.env['LUMO_CHECKOUT_URL'];
    // useSetting() call — breaking_change:false → SOFT signal (not a call-free import)
    const code = `const fontSize = useSetting( 'typography.fontSize' );`;
    const result = await handleCheckCode({ code, language: 'js' }, catchSnap);
    expect(result).toContain('verified as of');
  });

  it('reveal contains the snapshot generatedAt date (YYYY-MM-DD shape)', async () => {
    delete process.env['LUMO_CHECKOUT_URL'];
    const result = await handleCheckCode({ code: loudBlob, language: 'js' }, catchSnap);
    // The date from snapshot.generatedAt is substituted; catchSnap uses the real snapshot.
    expect(result).toMatch(/verified as of \d{4}-\d{2}-\d{2}/);
  });

  it('reveal says "verified as of" — never "out of date" or "stale"', async () => {
    delete process.env['LUMO_CHECKOUT_URL'];
    const result = await handleCheckCode({ code: loudBlob, language: 'js' }, catchSnap);
    const lower = result.toLowerCase();
    expect(lower).not.toContain('out of date');
    expect(lower).not.toContain('is stale');
    expect(lower).not.toContain('is outdated');
  });

  it('lumo_audit output is byte-equal to formatFreeMarkdown (reveal never touches audit path)', async () => {
    const { formatFreeMarkdown, renderFree } = await import('../src/lib/render.js');
    const s = loadSnapshot();
    const entry = s.entries.find((e) => e.slug === 'wp-img-tag-add-decoding-attr-deprecation');
    if (!entry) throw new Error('wp-img-tag entry missing — test setup broken');

    const expected = formatFreeMarkdown(renderFree(entry));
    const actual = await handleAudit({ project_root: makeFreeAuditProject() });
    // lumo_audit must be byte-identical regardless of C4 changes
    expect(actual).toBe(expected);
  });

  it('no catch results → reveal does not fire (neutral line returned unchanged)', async () => {
    const result = await handleCheckCode({ code: 'echo "hello";', language: 'php' }, catchSnap);
    expect(result).not.toContain('verified as of');
    expect(result).not.toContain('claude mcp add');
  });
});
