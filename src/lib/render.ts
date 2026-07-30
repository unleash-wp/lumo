import type { SnapshotEntry, FreeRenderedEntry } from '../types.js';
import type { CatchResult } from '../detection/catch.js';
import { compareVersions, resolveVersionState } from './version.js';
import type { VersionFact } from '../detection/catch.js';

// The hint here intentionally differs from lumo-pro's free-tier output and is
// not kept in sync with it. The Free agent ships the full wrong-vs-correct
// contrast (summary, code diff, source, test step, the ≥8.2 line) and points
// to Pro for the written breakdown + full version matrix; the Pro server's free
// tier returns a summary-only projection. Two surfaces, two correct messages —
// reconciling them would be wrong.
export const FREE_UPGRADE_HINT =
  'Lumo Pro has the full breakdown, the complete version range, and what breaks in upcoming WP releases before they ship.';

// ---------------------------------------------------------------------------
// C4 — Freshness-gap reveal line
//
// Shown once per session on gated (catch) answers, frequency-capped by the same
// kill-switch as the upgrade prompt. Never shown on lumo_audit (that path ends
// at formatFreeMarkdown — no append). Never shown when the upgrade prompt block
// already fired on the same response (avoids double-printing).
//
// The MCP add command is always inert-safe: it points at the Pro MCP server,
// which requires a valid license key — the free-to-add instruction costs the
// founder nothing to ship before go-live.
//
// Honesty constraints (hard):
//   - "{date}" = snapshot.generatedAt date (a verifiable claim)
//   - Never says "your snapshot is out of date" (unprovable per-entry claim)
//   - Never implies Free stays current on its own
// ---------------------------------------------------------------------------

/**
 * Freshness-gap reveal line template.
 *
 * Runtime substitutes `{date}` with the snapshot's generatedAt date (YYYY-MM-DD)
 * before appending. Not shown when the upgrade prompt block already fired.
 */
export const FRESHNESS_REVEAL_LINE =
  '_This snapshot is verified as of {date}. Lumo Pro re-checks against every WordPress release — it is the live layer._';

/**
 * Optional second line of the reveal: how to attach a Pro MCP endpoint.
 *
 * Only appended when `LUMO_PRO_MCP_URL` names a real server — the same
 * dead-link rule the checkout prompt follows. Pro is delivered as a licensed
 * knowledge pack, so there is no default hosted endpoint to advertise; a
 * hardcoded URL here would print an install command for a server the reader
 * cannot reach. Runtime substitutes `{url}`.
 */
export const PRO_MCP_ADD_LINE =
  '_Add the Pro MCP: `claude mcp add lumo-pro --transport http {url}`_';

// ---------------------------------------------------------------------------
// W4 upgrade-prompt copy constants — single tested source of truth.
// Markdown surfaces import and print verbatim; runtime fills {N}/{checkout_url}.
// ---------------------------------------------------------------------------

/** Shown once per session, first gated response only. Appended after the Free answer. */
export const UPGRADE_REVEAL_LINE =
  'Pro has the full breakdown and the complete version range for this.';

/**
 * Upgrade-prompt block. `{N}` = live gated_count. `{domain}` = human-readable catch domain
 * (e.g. "WooCommerce", "Block Editor", "WordPress Core"). `{checkout_url}` = getCheckoutUrl().
 * Runtime substitutes all three before printing.
 */
export const UPGRADE_PROMPT_BLOCK =
  'Lumo caught {N} stale-pattern {risks} in your {domain} code.\n\n' +
  'The exact version range — which releases break the old pattern and which do not —\n' +
  'plus the full written fix is in Pro.\n\n' +
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
// versionRelativeLine — version-scoping for the catch lead
//
// Pure: no I/O, no Date.now(). Returns '' for 'unknown' so the caller can
// safely append without emitting a fabricated claim.
// ---------------------------------------------------------------------------

/**
 * Produce a single blockquote line that contextualises the breaking version
 * relative to the project's detected version. Returns '' when the state cannot
 * be determined (missing args, unparseable input).
 *
 * already-broken: project is already on or past the breaking release.
 * upcoming:       project targets a version before the break.
 */
export function versionRelativeLine(
  versionFact: VersionFact,
  projectVersion: string | null | undefined,
): string {
  const state = resolveVersionState(projectVersion ?? null, versionFact.value);
  const ecosystem = versionFact.field === 'woo' ? 'WooCommerce' : 'WordPress';

  if (state === 'already-broken') {
    return `> You're on ${ecosystem} ${projectVersion}; this was removed/changed in ${versionFact.value} — fix now.`;
  }
  if (state === 'upcoming') {
    return `> You target ${ecosystem} ${projectVersion}; this breaks in ${versionFact.value} — you're writing a soon-dead pattern.`;
  }
  return '';
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
 *
 * Optional `projectVersion` — when provided and `result.versionFact` is present,
 * a relative-version line is appended to the LOUD lead. Absent arg ⇒ byte-identical
 * output to calling without it (no fabricated claims).
 */
export function formatCatch(result: CatchResult, projectVersion?: string): string {
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
    const leadLines = [
      `> ⚠️ Your AI suggested code that ${action} in ${ecosystem} ${versionFact.value}.`,
      `> This was ${versionFact.breaking ? 'deprecated or removed' : 'changed'} in ${ecosystem} ${versionFact.value} (${dateStr}).`,
      `> Your model's training likely predates this release.`,
    ];
    // Append relative-version line when project version is known and versionFact is present.
    // Gated on versionFact != null (inherits the no-false-LOUD guarantee).
    if (projectVersion != null) {
      const relativeLine = versionRelativeLine(versionFact, projectVersion);
      if (relativeLine) leadLines.push(relativeLine);
    }
    lead = leadLines.join('\n');
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

// ---------------------------------------------------------------------------
// GitHub Action copy. Lives here with the other copy constants so it is one
// tested source of truth: the "clean" phrasing has already regressed twice, once
// per channel, because each channel carried its own literal.
// ---------------------------------------------------------------------------

/** Logged when the Action finds nothing. States scope, never a verdict on the PR. */
export const ACTION_NO_MATCH_LINE =
  'No covered pattern matched in the added lines. ' +
  'Lumo Free covers WordPress Core, block and theme APIs, and security fundamentals; ' +
  'this is not an all-clear.';

/**
 * Appended to the Action's review summary. Belongs there even when findings exist:
 * without it, the absence of further comments reads as coverage.
 */
export const ACTION_SCOPE_LINE =
  '_Scope: the added lines of this diff, checked against what Lumo Free covers. ' +
  'Unchanged lines and anything outside that coverage were not checked._';

// Neutral line when checkCode finds nothing to flag.
//
// It reports the scope that was checked, never the state of the code. Lumo cannot
// know that a blob is clean — only that nothing it covers matched. Saying "looks
// clean" turns a coverage limit into a verdict, which is the one thing this
// product must never do.
export const CATCH_NEUTRAL_LINE =
  'Checked against Lumo Free — no covered pattern matched. ' +
  'Free covers WordPress Core, block and theme APIs, and security fundamentals; ' +
  'anything outside that was not checked, so this is not an all-clear.';

/**
 * Pro-only knowledge was hit by a fired signal in a code blob. Names the plugin
 * and what covers it. Sibling of buildProTeaser (project path) — the wording here
 * speaks about the code in hand, not about a project on disk.
 *
 * It names ONLY what was detected, and only what Lumo can substantiate: the
 * detection itself and Lumo's own coverage. Two sentences were removed for the
 * same reason — the rest of the Pro catalogue, and a claim that the reader's AI
 * has stale training data. Neither was checked at the moment of output, and both
 * appeared identically regardless of the code, which makes them sales copy inside
 * a finding.
 */
export function buildCodeProTeaser(pluginName: string): string {
  return (
    `Detected ${pluginName} in this code, and Lumo Free has no entry for it — ` +
    `this is not an all-clear. ${pluginName} is not covered by any free or official ` +
    `WordPress skill set. Lumo Pro covers ${pluginName}.`
  );
}

/**
 * Appended when findings ARE present and a Pro-only signal fired alongside them.
 * One line, not the full teaser: the answer already carries content, this only
 * has to stop it from reading as complete.
 */
export function buildCodeProGapLine(pluginName: string): string {
  return (
    `_Also detected ${pluginName} in this code, which Lumo Free does not cover — ` +
    `the findings above are not the whole picture._`
  );
}

/**
 * Short form of the code teaser, for every repeat after the first. Keeps the
 * honesty (the gap is still named) and drops the sales copy, so an hour of
 * WooCommerce work does not produce an hour of upgrade prompts.
 */
export function buildCodeProTeaserShort(pluginName: string): string {
  return `_${pluginName} is in this code and Lumo Free does not cover it — still not an all-clear._`;
}

/**
 * Same situation, but Pro has no curated knowledge either. States the limit and
 * makes no upgrade promise that would be broken.
 */
export function buildCodeDetectionNote(pluginName: string): string {
  return (
    `Detected ${pluginName} in this code. Lumo has no curated knowledge for ` +
    `${pluginName} yet, so this code was not checked against it — this is not an all-clear.`
  );
}
