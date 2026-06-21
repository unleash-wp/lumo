import type { SnapshotEntry, FreeRenderedEntry } from '../types.js';

// mirrored by contract from lumo-pro lookup.ts — keep in sync
export const FREE_UPGRADE_HINT =
  'Pro unlocks the full fix, the exact wrong-vs-correct code, the source, the verification step, and the affected WordPress/WooCommerce versions.';

/**
 * Render a Free-tier response from a snapshot entry.
 *
 * Hard guard: `body` is NEVER read from or emitted to the output.
 * The `versions` array is passed through verbatim — it is the basic constraint
 * row, not the Pro multi-row matrix. This distinction plus `body` omission is
 * what keeps the Free tier materially distinct from Pro.
 */
export function renderFree(entry: SnapshotEntry): FreeRenderedEntry {
  return {
    slug: entry.slug,
    title: entry.title,
    tier: 'free',
    summary: entry.summary,
    code_example: entry.code_example,
    bad_pattern: entry.bad_pattern,
    source_url: entry.source_url,
    test_step: entry.test_step,
    versions: entry.versions,
    upgradeHint: FREE_UPGRADE_HINT,
  };
}

/**
 * Format a Free-tier rendered entry as a deterministic Markdown block.
 *
 * Fixed order:
 *   ## title
 *   summary
 *   ### ❌ Wrong (HPOS-unsafe)
 *   ```php bad_pattern ```
 *   ### ✅ Correct
 *   ```php code_example ```
 *   **Source:** source_url
 *   **Verify:** test_step
 *   **Affected:** WooCommerce ≥ woo_version_min (from versions[0], if present)
 *   _upgradeHint_
 *
 * Pure function — no Date.now / Math.random.
 */
export function formatFreeMarkdown(r: FreeRenderedEntry): string {
  const affectedLine =
    r.versions.length > 0 && r.versions[0]?.woo_version_min != null
      ? `**Affected:** WooCommerce ≥ ${r.versions[0].woo_version_min}`
      : '**Affected:** WooCommerce (version constraint unavailable)';

  return [
    `## ${r.title}`,
    '',
    r.summary,
    '',
    '### ❌ Wrong (HPOS-unsafe)',
    '',
    '```php',
    r.bad_pattern,
    '```',
    '',
    '### ✅ Correct',
    '',
    '```php',
    r.code_example,
    '```',
    '',
    `**Source:** ${r.source_url}`,
    '',
    `**Verify:** ${r.test_step}`,
    '',
    affectedLine,
    '',
    `_${r.upgradeHint}_`,
  ].join('\n');
}
