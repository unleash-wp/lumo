import type { SnapshotEntry, FreeRenderedEntry } from '../types.js';
import type { CatchResult } from '../detection/catch.js';
import { compareVersions, resolveVersionState } from './version.js';
import type { VersionFact } from '../detection/catch.js';

// The hint here intentionally differs from lumo-pro's free-tier output and is
// not kept in sync with it. The Free agent ships the full wrong-vs-correct
// contrast (summary, code diff, source, test step, the ≥8.2 line) and points
// to Pro for the written breakdown + full version matrix; the Pro server's free
// tier returns a summary-only projection. Two surfaces, two correct messages,
// reconciling them would be wrong.
export const FREE_UPGRADE_HINT =
  'Lumo Pro has the full breakdown, the complete version range, and what breaks in upcoming WP releases before they ship.';

// ---------------------------------------------------------------------------
// C4: Freshness-gap reveal line
//
// Shown once per session on gated (catch) answers, frequency-capped by the same
// kill-switch as the upgrade prompt. Never shown on lumo_audit (that path ends
// at formatFreeMarkdown, no append). Never shown when the upgrade prompt block
// already fired on the same response (avoids double-printing).
//
// The MCP add command is always inert-safe: it points at the Pro MCP server,
// which requires a valid license key: the free-to-add instruction costs the
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
  '_This snapshot is verified as of {date}. Lumo Pro re-checks against every WordPress release. It is the live layer._';

/**
 * Optional second line of the reveal: how to attach a Pro MCP endpoint.
 *
 * Only appended when `LUMO_PRO_MCP_URL` names a real server: the same
 * dead-link rule the checkout prompt follows. Pro is delivered as a licensed
 * knowledge pack, so there is no default hosted endpoint to advertise; a
 * hardcoded URL here would print an install command for a server the reader
 * cannot reach. Runtime substitutes `{url}`.
 */
export const PRO_MCP_ADD_LINE =
  '_Add the Pro MCP: `claude mcp add lumo-pro --transport http {url}`_';

// ---------------------------------------------------------------------------
// W4 upgrade-prompt copy constants, single tested source of truth.
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
  'The exact version range, which releases break the old pattern and which do not,\n' +
  'plus the full written fix is in Pro.\n\n' +
  'Get it: {checkout_url}';

/**
 * Render a Free-tier response from a snapshot entry.
 *
 * Hard guard: `body` is NEVER read from or emitted to the output.
 * The `versions` array is passed through verbatim. It is the basic constraint
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
 *   ### Wrong (HPOS-unsafe)
 *   ```php bad_pattern ```
 *   ### Correct
 *   ```php code_example ```
 *   **Source:** source_url
 *   **Verify:** test_step
 *   **Affected:** WooCommerce ≥ {woo} | WordPress ≥ {wp} | all supported versions
 *   _Knowledge current as of verifiedAt (date only)_
 *   _upgradeHint_
 *
 * Pure function, no Date.now / Math.random (the date comes from the entry data).
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
  const wrongHeading = isWoo ? '### Wrong (HPOS-unsafe)' : '### Wrong';

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
    '### Correct',
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
// versionRelativeLine, version-scoping for the catch lead
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
    return `> You're on ${ecosystem} ${projectVersion}; this was removed/changed in ${versionFact.value}. Fix now.`;
  }
  if (state === 'upcoming') {
    return `> You target ${ecosystem} ${projectVersion}; this breaks in ${versionFact.value}. You're writing a soon-dead pattern.`;
  }
  return '';
}

// ---------------------------------------------------------------------------
// formatCatch, Phase 02
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
 *, if versionFact is absent the function renders SOFT regardless of tier input.
 *
 * Optional `projectVersion`: when provided and `result.versionFact` is present,
 * a relative-version line is appended to the LOUD lead. Absent arg ⇒ byte-identical
 * output to calling without it (no fabricated claims).
 */
export function formatCatch(result: CatchResult, projectVersion?: string): string {
  const { tier, entry, versionFact, alwaysWrongFact, condition } = result;
  const rendered = renderFree(entry);

  // Trust footnote, verification axis (phase 00):
  // 'runnable' entries had their fix executed in sandbox CI; 'advice' are source-checked.
  // SnapshotEntry does not expose the Pro `verification` field, so we infer from
  // the entry's category: WooCommerce PHP entries run in sandbox; JS/advice entries don't.
  // Conservative: default to "Source-verified" (never over-claim).
  const isSandboxed = entry.category_slug === 'woocommerce';
  const verificationNote = isSandboxed ? 'Fix proven to run' : 'Source-verified';

  // Determine effective tier: LOUD requires an anchor, a version fact (dated
  // release claim) or an always-wrong fact (source-carried claim). Without one
  // the loud template has nothing to interpolate, so we structurally degrade to
  // SOFT. This mirrors classify(): no LOUD without a citable anchor.
  const effectiveTier: 'LOUD' | 'SOFT' =
    tier === 'LOUD' && (versionFact != null || alwaysWrongFact != null) ? 'LOUD' : 'SOFT';

  let lead: string;

  if (effectiveTier === 'LOUD' && versionFact == null && alwaysWrongFact != null) {
    // Always-wrong route: the claim is not tied to a release, so no version line
    // and no relative-version line. The source IS the claim's license; it leads.
    const dateStr = alwaysWrongFact.date.slice(0, 10);
    lead = [
      `> BREAKING: this pattern is wrong in every supported WordPress version. A defect, not a version issue.`,
      `> Documented: ${alwaysWrongFact.sourceUrl} (knowledge verified ${dateStr}).`,
    ].join('\n');
  } else if (effectiveTier === 'LOUD' && versionFact != null) {
    const ecosystem = versionFact.field === 'woo' ? 'WooCommerce' : 'WordPress';
    const action = versionFact.breaking ? 'broke' : 'changed';
    const dateStr = versionFact.date.slice(0, 10);
    const leadLines = [
      `> BREAKING: your AI suggested code that ${action} in ${ecosystem} ${versionFact.value}.`,
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
    lead = `> ADVISORY: ${conditionText} this pattern may not work as expected.`;
  }

  // Body from formatFreeMarkdown, same spine, same freshness line, same source.
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

/**
 * Printed when lumo-scan finds nothing. Same law as every other channel: state
 * the scope that was checked, never pronounce the changes clean: the fifth
 * channel carrying a "clean" verdict, retired like the other four.
 * Caller substitutes {files} and {date}.
 */
export const SCAN_NO_MATCH_TEMPLATE =
  'lumo scan: {files} checked against Lumo Free{date}: no covered pattern matched in the git diff. ' +
  'Outside that coverage nothing was checked, so this is not an all-clear.\n' +
  'Scope is the diff only (not whole files already committed). ' +
  'Whole file: `lumo check path/to/file.php`. Proof on samples: `lumo demo`.';

/**
 * Logged when the Action finds nothing. States scope, never a verdict on the PR.
 *
 * "Covers security fundamentals" was doing too much work here: the knowledge
 * covers them, the automatic catch reaches only part of them, and this line is
 * read at exactly the moment someone decides whether silence means safety.
 */
// Names what ran, not a tier. Both Action lines used to describe Lumo Free's
// coverage, which was true while the Action was free. It is not any more: CI
// enforcement is Pro, so the only readers of these lines hold a licence, and a
// paid run described as a free one is an unfounded claim about what the machine
// did, in the one place a customer looks to see what they got. It also
// undersells the catch, which is the wrong error to leave in on purpose.
//
// "the catch that ran in this check" is deliberately vague about which catch:
// when the Pro server is unreachable the run falls back to the free one, and
// that case has its own notice (ACTION_PRO_DEGRADED_LINE) rather than being
// papered over here.
export const ACTION_NO_MATCH_LINE =
  'No covered pattern matched in the added lines. Lumo read the lines this ' +
  'pull request added and nothing else: not the surrounding file, not the ' +
  'rest of the branch. It matched them against the catch that ran in this ' +
  'check. That catch fires on a subset of what Lumo knows. ' +
  'This is not an all-clear.';

/**
 * Appended to the Action's review summary. Belongs there even when findings exist:
 * without it, the absence of further comments reads as coverage.
 */
/**
 * The knowledge is wider than the automatic catch, and saying "covers security
 * fundamentals" without that distinction lets a reader assume every one of
 * those topics fires by itself. Measured on 31.07.2026: the free snapshot holds
 * fifteen security entries; nine carry a detection rule, and two of those nine
 * reach only part of their topic, so "nine covered" would itself be the kind
 * of over-claim this constant exists to retire. Seven cover their topic, two
 * cover half of it, six are documented only.
 *
 * Naming the gap turns an over-claim into a useful pointer: the lookup answers
 * what the watcher stays quiet about.
 */
export const KNOWLEDGE_WIDER_THAN_CATCH =
  'The catch fires on a subset of what Lumo knows, in two ways. Documented ' +
  'with no detection at all: unescaped output, missing sanitize callbacks on ' +
  'settings and REST arguments, and permission checks on abilities. Detected ' +
  'only in part: a REST route with no permission callback is not caught ' +
  'though a permissive one is, and a superglobal is caught when assigned to a ' +
  'variable, not when echoed straight out. Silence from the watcher is never a ' +
  'verdict on any of those. Ask lumo_lookup (or `lumo` in your assistant) for ' +
  'the knowledge the catch does not reach.';

export const ACTION_SCOPE_LINE =
  '_Scope: the added lines of this diff, checked against the catch that ran in ' +
  'this check. Unchanged lines and anything outside that catch were not checked. ' +
  'The catch also reaches only part of what Lumo documents, so a fixed run is ' +
  'not a cleared one. The rest of the knowledge is in the snapshot, reachable ' +
  'from an editor with the Lumo MCP server connected._';

/**
 * Posted into the PR when Pro credentials were configured but the Pro server
 * could not be reached and the run fell back to the free catch. Must be
 * visible in the run's own output, not only in the job log: a silently
 * degraded Pro run reads as "Pro checked and found nothing": a false
 * all-clear on exactly the layer the customer pays for.
 */
/**
 * Logged when the CI gate runs without a licence. CI enforcement is a Lumo Pro
 * feature: the gate answers from the licensed server, and running the free
 * local knowledge as a pipeline gate would promise a verdict it cannot back.
 *
 * The check stays green: a missing subscription is not a reason to block a
 * merge, so the line must carry the whole weight of saying that nothing was
 * checked. It also names what the free tier still does, so this reads as a
 * boundary rather than a nag.
 */
export const ACTION_REQUIRES_PRO_LINE =
  'DID NOT RUN: CI enforcement is part of Lumo Pro, and no licence was configured, ' +
  'so no code was checked. This is not a clean result. ' +
  'Set lumo_pro_url and lumo_license_key to run the gate. ' +
  'Without a subscription, `lumo scan` still checks your working tree locally, ' +
  'and the MCP server and skills stay free.';

/**
 * Posted when .claude/.lumo.json exists but cannot be honoured, unparseable,
 * or naming an enforce.mode this version does not know.
 *
 * The run still falls open to advisory, because a broken config file is not a
 * reason to block a team's merges. What changed is that it says so: a repo that
 * asked for a blocking gate and lost it to a typo would otherwise keep reading
 * green checks as enforced ones, which is the same silence-as-verdict the rest
 * of this file exists to prevent.
 */
export const ENFORCE_CONFIG_UNREADABLE_LINE =
  'Your .claude/.lumo.json could not be read, or it names an enforce.mode this ' +
  'version does not recognise, so Lumo fell back to advisory for this run. ' +
  'If that file asked for "block", the gate you configured is not running. ' +
  'fix the file rather than reading this run as enforced.';

// "did not deliver a check", not "was unreachable": a server that answers and
// then reports it could not scan lands here too, and naming the wrong cause
// sends the reader to look at the network instead of the server.
export const ACTION_PRO_DEGRADED_LINE =
  '**The Lumo Pro check did not run**: the Pro server did not deliver a ' +
  'check, so the results in this run come from the free catch only. This is ' +
  'not a Pro verdict. Check the server URL, the license key, and the server ' +
  'status, then re-run the check.';

// Only reached when a repository opted in with fail_on_degraded. It names our
// server as the cause, because the contributor's code is not what failed here
// and a red check that reads like a code review would send them to fix the
// wrong thing.
export const ACTION_PRO_DEGRADED_FAIL_LINE =
  'The Lumo Pro check did not deliver a result and fail_on_degraded is set, ' +
  'so this run is marked failed. The cause is the Pro server, not the code in ' +
  'this pull request. Re-run once the server answers, or set ' +
  'fail_on_degraded to false to let a degraded run stay green.';

export const ACTION_QUOTA_BLOCKED_LINE =
  '**The Lumo Pro check did not run (daily quota).** No code in this pull request ' +
  'was checked on the paid layer. Retry after the quota window resets or upgrade ' +
  'your seat at /connect.';

export const ACTION_CI_NOT_INCLUDED_LINE =
  '**The Lumo Pro check did not run.** GitHub Action CI is not included on Solo ' +
  'Hosted (Freelancer). Upgrade to Lumo Pro or Team 20 for CI, or remove the ' +
  'Action from the workflow.';

/**
 * One notice per run for the scanner's own limits, never one per file.
 *
 * These sentences describe how far the scanner read, not what the contributor
 * wrote. Repeating that under twenty files in one pull request is the noise
 * that gets a reviewer muted, and it wears out the same notice that has to be
 * believed when a real outage happens. The filenames stay in it so the summary
 * is still checkable: a reader who cannot tell which file was cut short has
 * been told something they cannot act on.
 */
export function buildScanLimitsNotice(
  limits: ReadonlyArray<{ filename: string; note: string }>,
): string {
  const byNote = new Map<string, string[]>();
  for (const { filename, note } of limits) {
    const files = byNote.get(note);
    if (files) {
      if (!files.includes(filename)) files.push(filename);
    } else {
      byNote.set(note, [filename]);
    }
  }

  const lines = [
    '**Lumo did not read everything in this run.** The findings above are real, ' +
      'but they are not the whole picture:',
    '',
  ];
  for (const [note, files] of byNote) {
    lines.push(`- ${note}`);
    for (const file of files) lines.push(`  - \`${file}\``);
  }
  return lines.join('\n');
}

// Neutral line when checkCode finds nothing to flag.
//
// It reports the scope that was checked, never the state of the code. Lumo cannot
// know that a blob is clean, only that nothing it covers matched. Saying "looks
// clean" turns a coverage limit into a verdict, which is the one thing this
// product must never do.
export const CATCH_NEUTRAL_LINE =
  'Checked against Lumo Free: no covered pattern matched. ' +
  'Free carries WordPress Core, block and theme APIs, and security fundamentals ' +
  'as knowledge, and the catch reaches only part of that; anything outside what ' +
  'it reaches was not checked, so this is not an all-clear.';

/**
 * The catch engine's own outer catch fired (checkCodeWithGaps.didNotRun),
 * typically the local snapshot failed to load. Distinct from
 * CATCH_NEUTRAL_LINE on purpose: that line reports "scanned, nothing
 * matched"; nothing was scanned here. A caller that renders the neutral line
 * on this path is dressing a crash as a clean pass, exactly the false
 * all-clear this product exists to prevent.
 */
export const CATCH_DID_NOT_RUN_LINE =
  'DID NOT RUN: the catch engine failed before producing a result, so no code ' +
  'was checked. This is not a clean result. Retry the check.';

/**
 * One notice per run, not one per file, same rule as buildScanLimitsNotice:
 * a scanner failure describes the run, not the contributor's code, and
 * repeating it under every affected file in one pull request is the noise
 * that gets a reviewer switched off. Filenames stay in it so the summary is
 * still checkable.
 */
export function buildCatchDidNotRunNotice(filenames: readonly string[]): string {
  const unique = [...new Set(filenames)];
  const list = unique.map((f) => `\`${f}\``).join(', ');
  return (
    `**DID NOT RUN**: the catch engine failed before producing a result for ` +
    `${unique.length === 1 ? 'this file' : 'these files'}: ${list}. Nothing was ` +
    'checked there, so this is not a clean result on them. Retry the check.'
  );
}

// The two scan limits, said out loud. Both are deliberate and both used to be
// invisible, which turned them into coverage limits presented as results: a
// blob longer than the scanner reads produced the same neutral line as a clean
// one, and a blob with more matches than the report holds showed a subset with
// nothing to say a subset is what it was. CATCH_NEUTRAL_LINE discloses what
// Lumo knows, not how much of the input it actually read.
export const catchInputTruncatedLine = (lineCap: number): string =>
  `Only the first ${lineCap} lines of the submitted code were scanned. ` +
  'Everything after that was not checked, so this answer says nothing about it.';

export const catchHitsOmittedLine = (omitted: number): string =>
  `${omitted} further ${omitted === 1 ? 'match is' : 'matches are'} not listed: ` +
  'the report is capped, and the lowest-severity matches were dropped first.';

/** "A", "A and B", "A, B and C": one grammar for every gap surface. */
export function joinPluginNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Pro-only knowledge was hit by a fired signal in a code blob. Names the plugin
 * and what covers it. Sibling of buildProTeaser (project path): the wording here
 * speaks about the code in hand, not about a project on disk.
 *
 * It names ONLY what was detected, and only what Lumo can substantiate: the
 * detection itself and Lumo's own coverage. Two sentences were removed for the
 * same reason: the rest of the Pro catalogue, and a claim that the reader's AI
 * has stale training data. Neither was checked at the moment of output, and both
 * appeared identically regardless of the code, which makes them sales copy inside
 * a finding.
 */
export function buildCodeProTeaser(pluginName: string): string {
  return (
    `Detected ${pluginName} in this code, and Lumo Free has no entry for it. ` +
    `This is not an all-clear. ${pluginName} is not covered by the free WordPress ` +
    `agent skills Lumo ships. Lumo Pro covers ${pluginName}.`
  );
}

/**
 * Appended when findings ARE present and a Pro-only signal fired alongside them.
 * One line, not the full teaser: the answer already carries content, this only
 * has to stop it from reading as complete.
 */
export function buildCodeProGapLine(pluginName: string): string {
  return (
    `_Also detected ${pluginName} in this code, which Lumo Free does not cover. ` +
    `The findings above are not the whole picture._`
  );
}

/**
 * Short form of the code teaser, for every repeat after the first. Keeps the
 * honesty (the gap is still named) and drops the sales copy, so an hour of
 * WooCommerce work does not produce an hour of upgrade prompts.
 */
export function buildCodeProTeaserShort(pluginName: string): string {
  return `_${pluginName} is in this code and Lumo Free does not cover it. Still not an all-clear._`;
}

/**
 * Same situation, but Pro has no curated knowledge either. States the limit and
 * makes no upgrade promise that would be broken.
 */
export function buildCodeDetectionNote(pluginName: string): string {
  return (
    `Detected ${pluginName} in this code. Lumo has no curated knowledge for ` +
    `${pluginName} yet, so this code was not checked against it. This is not an all-clear.`
  );
}
