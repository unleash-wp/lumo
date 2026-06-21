import { describe, it, expect } from 'vitest';
import { renderFree, formatFreeMarkdown, FREE_UPGRADE_HINT } from '../src/lib/render.js';
import { loadSnapshot, findEntry } from '../src/lib/snapshot.js';
import type { SnapshotEntry } from '../src/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hposEntry(): SnapshotEntry {
  const snap = loadSnapshot();
  const entry = findEntry(snap, 'woocommerce-hpos-order-access');
  if (!entry) throw new Error('HPOS entry missing from snapshot — test setup broken');
  return entry;
}

// ---------------------------------------------------------------------------
// FA-16: renderFree
// ---------------------------------------------------------------------------

describe('renderFree', () => {
  it('returns all required Free fields', () => {
    const entry = hposEntry();
    const rendered = renderFree(entry);

    expect(rendered.slug).toBe(entry.slug);
    expect(rendered.title).toBe(entry.title);
    expect(rendered.tier).toBe('free');
    expect(rendered.summary).toBeDefined();
    expect(rendered.code_example).toBeDefined();
    expect(rendered.bad_pattern).toBeDefined();
    expect(rendered.source_url).toBeDefined();
    expect(rendered.test_step).toBeDefined();
    expect(rendered.versions).toBeDefined();
    expect(rendered.upgradeHint).toBeDefined();
  });

  it('summary is byte-for-byte identical to the snapshot entry summary', () => {
    const entry = hposEntry();
    const rendered = renderFree(entry);
    expect(rendered.summary).toBe(entry.summary);
  });

  it('output has NO "body" key', () => {
    const entry = hposEntry();
    const rendered = renderFree(entry);
    expect(Object.prototype.hasOwnProperty.call(rendered, 'body')).toBe(false);
  });

  it('versions is a passthrough of the entry versions array', () => {
    const entry = hposEntry();
    const rendered = renderFree(entry);
    expect(rendered.versions).toStrictEqual(entry.versions);
  });

  it('upgradeHint matches the mirrored FREE_UPGRADE_HINT constant', () => {
    const entry = hposEntry();
    const rendered = renderFree(entry);
    expect(rendered.upgradeHint).toBe(FREE_UPGRADE_HINT);
  });

  it('tier is always "free"', () => {
    const entry = hposEntry();
    expect(renderFree(entry).tier).toBe('free');
  });
});

// ---------------------------------------------------------------------------
// FA-16: formatFreeMarkdown
// ---------------------------------------------------------------------------

describe('formatFreeMarkdown', () => {
  it('contains both fenced php blocks', () => {
    const rendered = renderFree(hposEntry());
    const md = formatFreeMarkdown(rendered);
    const fencedBlocks = md.match(/```php/g);
    expect(fencedBlocks).not.toBeNull();
    expect(fencedBlocks?.length).toBe(2);
  });

  it('contains the source_url', () => {
    const rendered = renderFree(hposEntry());
    const md = formatFreeMarkdown(rendered);
    expect(md).toContain(rendered.source_url);
  });

  it('contains the test_step', () => {
    const rendered = renderFree(hposEntry());
    const md = formatFreeMarkdown(rendered);
    expect(md).toContain(rendered.test_step);
  });

  it('contains the upgradeHint', () => {
    const rendered = renderFree(hposEntry());
    const md = formatFreeMarkdown(rendered);
    expect(md).toContain(rendered.upgradeHint);
  });

  it('contains the wrong-vs-correct section headers', () => {
    const rendered = renderFree(hposEntry());
    const md = formatFreeMarkdown(rendered);
    expect(md).toContain('### ❌ Wrong (HPOS-unsafe)');
    expect(md).toContain('### ✅ Correct');
  });

  it('contains the affected WooCommerce version line', () => {
    const rendered = renderFree(hposEntry());
    const md = formatFreeMarkdown(rendered);
    expect(md).toContain('**Affected:** WooCommerce ≥ 8.2');
  });

  it('is deterministic — same input produces identical string on repeated calls', () => {
    const rendered = renderFree(hposEntry());
    const first = formatFreeMarkdown(rendered);
    const second = formatFreeMarkdown(rendered);
    expect(first).toBe(second);
  });

  it('handles empty versions array gracefully', () => {
    const entry = hposEntry();
    const rendered = renderFree({ ...entry, versions: [] });
    expect(() => formatFreeMarkdown(rendered)).not.toThrow();
    const md = formatFreeMarkdown(rendered);
    expect(md).toContain('**Affected:**');
  });
});
