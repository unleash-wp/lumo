import { describe, it, expect } from 'vitest';
import {
  renderFree,
  formatFreeMarkdown,
  FREE_UPGRADE_HINT,
  UPGRADE_REVEAL_LINE,
  UPGRADE_PROMPT_BLOCK,
} from '../src/lib/render.js';
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
    expect(rendered.verifiedAt).toBeDefined();
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

  it('renders the freshness line from the entry verified-current date', () => {
    const entry = hposEntry();
    const rendered = renderFree(entry);
    expect(rendered.verifiedAt).toBe(entry.updatedAt);
    const md = formatFreeMarkdown(rendered);
    expect(md).toContain(`_Knowledge current as of ${entry.updatedAt.slice(0, 10)}._`);
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

// ---------------------------------------------------------------------------
// FREE_UPGRADE_HINT — corrected true delta (must NOT name Free-shipped fields)
// ---------------------------------------------------------------------------

describe('FREE_UPGRADE_HINT — corrected copy', () => {
  it('does not mention "source" (Free already ships source_url)', () => {
    expect(FREE_UPGRADE_HINT.toLowerCase()).not.toContain('source');
  });

  it('does not mention "test step" or "verify" (Free already ships test_step)', () => {
    expect(FREE_UPGRADE_HINT.toLowerCase()).not.toContain('test step');
    expect(FREE_UPGRADE_HINT.toLowerCase()).not.toContain('verification step');
  });

  it('does not claim wrong-vs-correct code diff as Pro-only (Free ships it)', () => {
    expect(FREE_UPGRADE_HINT.toLowerCase()).not.toContain('wrong-vs-correct');
    expect(FREE_UPGRADE_HINT.toLowerCase()).not.toContain('wrong vs correct');
    expect(FREE_UPGRADE_HINT.toLowerCase()).not.toContain('exact');
  });

  it('does not name "≥ 8.2" or single affected version (Free ships it)', () => {
    expect(FREE_UPGRADE_HINT).not.toContain('≥ 8.2');
    expect(FREE_UPGRADE_HINT).not.toContain('>= 8.2');
  });

  it('references the true Pro-only value (breakdown or version range)', () => {
    const lower = FREE_UPGRADE_HINT.toLowerCase();
    const hasBreakdown = lower.includes('breakdown') || lower.includes('deep-dive');
    const hasVersionRange = lower.includes('version range') || lower.includes('version matrix') || lower.includes('complete');
    expect(hasBreakdown || hasVersionRange).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// UPGRADE_REVEAL_LINE + UPGRADE_PROMPT_BLOCK — constants exist and are correct
// ---------------------------------------------------------------------------

describe('UPGRADE_REVEAL_LINE', () => {
  it('is a non-empty string', () => {
    expect(typeof UPGRADE_REVEAL_LINE).toBe('string');
    expect(UPGRADE_REVEAL_LINE.length).toBeGreaterThan(0);
  });

  it('does not name Free-shipped fields', () => {
    const lower = UPGRADE_REVEAL_LINE.toLowerCase();
    expect(lower).not.toContain('source');
    expect(lower).not.toContain('test step');
    expect(lower).not.toContain('≥ 8.2');
  });
});

describe('UPGRADE_PROMPT_BLOCK', () => {
  it('is a non-empty string', () => {
    expect(typeof UPGRADE_PROMPT_BLOCK).toBe('string');
    expect(UPGRADE_PROMPT_BLOCK.length).toBeGreaterThan(0);
  });

  it('contains the {N} placeholder for gated_count injection', () => {
    expect(UPGRADE_PROMPT_BLOCK).toContain('{N}');
  });

  it('contains the {checkout_url} placeholder for URL injection', () => {
    expect(UPGRADE_PROMPT_BLOCK).toContain('{checkout_url}');
  });

  it('does not name Free-shipped fields', () => {
    const lower = UPGRADE_PROMPT_BLOCK.toLowerCase();
    expect(lower).not.toContain('test step');
    expect(lower).not.toContain('≥ 8.2');
  });
});
