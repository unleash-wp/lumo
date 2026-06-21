import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleAudit, handleLookup } from '../src/mcp/handlers.js';
import { loadSnapshot } from '../src/lib/snapshot.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

// ---------------------------------------------------------------------------
// handleAudit
// ---------------------------------------------------------------------------

describe('handleAudit', () => {
  it('returns Free Markdown when WooCommerce is detected', async () => {
    const result = await handleAudit({ project_root: join(fixturesDir, 'classic-wp') });

    // Must contain the entry title
    expect(result).toContain('HPOS');
    // Must contain wrong/correct sections
    expect(result).toContain('Wrong (HPOS-unsafe)');
    expect(result).toContain('Correct');
    // Must cite source
    expect(result).toContain('Source:');
    // Must include test step
    expect(result).toContain('Verify:');
  });

  it('output contains NO "body" key — Free tier boundary', async () => {
    const result = await handleAudit({ project_root: join(fixturesDir, 'classic-wp') });
    // The literal string "body" must not appear as a JSON key or Markdown heading
    expect(result).not.toMatch(/^"body":/m);
    expect(result).not.toMatch(/^## body/im);
  });

  it('returns neutral message for a non-Woo project', async () => {
    const result = await handleAudit({ project_root: join(fixturesDir, 'non-woo') });
    expect(result).toContain('No WooCommerce detected');
  });

  it('returns neutral message for a non-existent path — never throws', async () => {
    await expect(
      handleAudit({ project_root: '/tmp/__lumo_nonexistent_fixture__' }),
    ).resolves.toContain('No WooCommerce detected');
  });

  it('defaults to process.cwd() when project_root is omitted — never throws', async () => {
    await expect(handleAudit({})).resolves.toBeTypeOf('string');
  });

  it('returns a string when project_root is an empty string — never throws', async () => {
    await expect(handleAudit({ project_root: '' })).resolves.toBeTypeOf('string');
  });

  it('output matches formatFreeMarkdown for the HPOS entry (byte-equal check)', async () => {
    const { formatFreeMarkdown, renderFree } = await import('../src/lib/render.js');
    const snap = loadSnapshot();
    const entry = snap.entries.find((e) => e.slug === 'woocommerce-hpos-order-access');
    if (!entry) throw new Error('HPOS entry missing from snapshot — test setup broken');

    const expected = formatFreeMarkdown(renderFree(entry));
    const actual = await handleAudit({ project_root: join(fixturesDir, 'classic-wp') });
    expect(actual).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// handleLookup
// ---------------------------------------------------------------------------

describe('handleLookup', () => {
  it('returns Free Markdown for a known slug', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ slug: 'woocommerce-hpos-order-access' }, snap);

    expect(result).toContain('HPOS');
    expect(result).toContain('Wrong (HPOS-unsafe)');
    expect(result).toContain('Correct');
    expect(result).toContain('Source:');
    expect(result).toContain('Verify:');
  });

  it('output contains NO "body" key for slug lookup — Free tier boundary', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ slug: 'woocommerce-hpos-order-access' }, snap);
    expect(result).not.toMatch(/^"body":/m);
    expect(result).not.toMatch(/^## body/im);
  });

  it('returns Free Markdown for a known category', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ category: 'woocommerce' }, snap);

    expect(result).toContain('HPOS');
    expect(result).toContain('Source:');
  });

  it('output contains NO "body" key for category lookup — Free tier boundary', async () => {
    const snap = loadSnapshot();
    const result = await handleLookup({ category: 'woocommerce' }, snap);
    expect(result).not.toMatch(/^"body":/m);
    expect(result).not.toMatch(/^## body/im);
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
});
