import type { SnapshotEntry, FreeRenderedEntry } from '../types.js';

// The hint here intentionally differs from lumo-pro's free-tier output and is
// not kept in sync with it. The Free agent ships the full wrong-vs-correct
// contrast (summary, code diff, source, test step, the ≥8.2 line) and points
// to Pro for the written breakdown + full version matrix; the Pro server's free
// tier returns a summary-only projection. Two surfaces, two correct messages —
// reconciling them would be wrong.
export const FREE_UPGRADE_HINT =
  'Lumo Pro has the full breakdown and the complete version range for this entry.';

// ---------------------------------------------------------------------------
// W4 upgrade-prompt copy constants — single tested source of truth.
// Markdown surfaces import and print verbatim; runtime fills {N}/{checkout_url}.
// ---------------------------------------------------------------------------

/** Shown once per session, first gated response only. Appended after the Free answer. */
export const UPGRADE_REVEAL_LINE =
  'Pro has the full breakdown and the complete version range for this.';

/**
 * Upgrade-prompt block. `{N}` = live gated_count. `{checkout_url}` = getCheckoutUrl().
 * Runtime substitutes both before printing.
 */
export const UPGRADE_PROMPT_BLOCK =
  'Lumo caught {N} HPOS risks in your code.\n\n' +
  'The version range across your WP/Woo stack — which exact versions break the old\n' +
  'pattern and which do not — is in Pro, along with the full written breakdown.\n\n' +
  'Get it: {checkout_url}';

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
    verifiedAt: entry.updatedAt,
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
 *   **Affected:** WooCommerce ≥ {woo} | WordPress ≥ {wp} | all supported versions
 *   _Knowledge current as of verifiedAt (date only)_
 *   _upgradeHint_
 *
 * Pure function — no Date.now / Math.random (the date comes from the entry data).
 */
export function formatFreeMarkdown(r: FreeRenderedEntry): string {
  const v0 = r.versions[0];
  const isWoo = r.versions.length > 0 && v0 != null && v0.woo_version_min != null;
  const affectedLine = isWoo
    ? `**Affected:** WooCommerce ≥ ${v0!.woo_version_min}`
    : r.versions.length > 0 && v0 != null && v0.wp_version_min != null
      ? `**Affected:** WordPress ≥ ${v0.wp_version_min}`
      : '**Affected:** all supported versions';

  // "HPOS-unsafe" only applies to WooCommerce order-storage patterns; a generic
  // WordPress entry must not inherit WooCommerce framing.
  const wrongHeading = isWoo ? '### ❌ Wrong (HPOS-unsafe)' : '### ❌ Wrong';

  return [
    `## ${r.title}`,
    '',
    r.summary,
    '',
    wrongHeading,
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
    `_Knowledge current as of ${r.verifiedAt.slice(0, 10)}._`,
    '',
    `_${r.upgradeHint}_`,
  ].join('\n');
}
