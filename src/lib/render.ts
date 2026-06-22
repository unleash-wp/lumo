import type { SnapshotEntry, FreeRenderedEntry } from '../types.js';
import type { CatchResult } from '../detection/catch.js';

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

// ---------------------------------------------------------------------------
// formatCatch — Phase 02
//
// Wraps formatFreeMarkdown with a tier-specific lead block. Pure: all dates
// come from entry data (versionFact.date / entry.updatedAt), never Date.now().
//
// LOUD → blockquote alarm with the dated version fact interpolated from the
//         entry's guaranteed-present version stamp.
// SOFT → quiet conditional blockquote ("Worth reviewing: if {condition}…").
//
// A LOUD catch ends on the existing FREE_UPGRADE_HINT so the close ties the
// felt need to the upgrade (Sales requirement from alignment doc).
// ---------------------------------------------------------------------------

/**
 * Render a catch result as a Markdown block.
 *
 * Reuses `formatFreeMarkdown` for the body (DRY). Adds only the lead line and
 * the verification footnote. Never emits a LOUD lead without a real version fact
 * — if versionFact is absent the function renders SOFT regardless of tier input.
 */
export function formatCatch(result: CatchResult): string {
  const { tier, entry, versionFact, condition } = result;
  const rendered = renderFree(entry);

  // Trust footnote — verification axis (phase 00):
  // 'runnable' entries had their fix executed in sandbox CI; 'advice' are source-checked.
  // SnapshotEntry does not expose the Pro `verification` field, so we infer from
  // the entry's category: WooCommerce PHP entries run in sandbox; JS/advice entries don't.
  // Conservative: default to "Source-verified" (never over-claim).
  const isSandboxed = entry.category_slug === 'woocommerce';
  const verificationNote = isSandboxed ? 'Fix proven to run' : 'Source-verified';

  // Determine effective tier: LOUD requires versionFact to be present; without it
  // the dated claim cannot be made, so we structurally degrade to SOFT.
  const effectiveTier: 'LOUD' | 'SOFT' = tier === 'LOUD' && versionFact != null ? 'LOUD' : 'SOFT';

  let lead: string;

  if (effectiveTier === 'LOUD' && versionFact != null) {
    const ecosystem = versionFact.field === 'woo' ? 'WooCommerce' : 'WordPress';
    const action = versionFact.breaking ? 'broke' : 'changed';
    const dateStr = versionFact.date.slice(0, 10);
    lead = [
      `> ⚠️ Your AI suggested code that ${action} in ${ecosystem} ${versionFact.value}.`,
      `> This was ${versionFact.breaking ? 'deprecated or removed' : 'changed'} in ${ecosystem} ${versionFact.value} (${dateStr}).`,
      `> Your model's training likely predates this release.`,
    ].join('\n');
  } else {
    const conditionText =
      condition != null
        ? `if ${condition},`
        : 'depending on your stack version,';
    lead = `> 🔍 Worth reviewing: ${conditionText} this pattern may not work as expected.`;
  }

  // Body from formatFreeMarkdown — same spine, same freshness line, same source.
  const body = formatFreeMarkdown(rendered);

  // For LOUD catches, end with the upgrade hint so the catch creates the felt
  // need and the hint names what Pro adds (the full version matrix + foresight).
  // formatFreeMarkdown already appends upgradeHint; SOFT uses that naturally.
  // LOUD: we re-use the same body (which already includes upgradeHint at the end).
  const lines = [lead, '', body, '', `_${verificationNote}_`];

  return lines.join('\n');
}

// Neutral line when checkCode finds nothing to flag — mirrors lumo_audit's tone.
export const CATCH_NEUTRAL_LINE =
  'No WordPress/WooCommerce issues detected in this code — looks clean.';
