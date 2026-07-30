/**
 * lumo-scan core — argument handling, diff acquisition, catch, output assembly.
 *
 * Pure result producer: returns the lines to print and the exit code, never
 * writes to stdout and never calls process.exit — src/scan/main.ts is the thin
 * entry that does both. Lives outside main.ts because importing main.ts runs
 * the scan (the `lumo` dispatcher relies on that import side effect), which
 * tests must not trigger.
 *
 * Modes:
 *   - Default: scans `git diff HEAD` (staged + unstaged), exit code always 0 —
 *     findings inform, they do not block.
 *   - CI (--ci): scans `git diff <base>...HEAD` where <base> comes from --base
 *     or $CI_MERGE_REQUEST_DIFF_BASE_SHA; without a base it falls back to the
 *     working-tree diff and says so. Exits 1 only when at least one LOUD
 *     finding fired and $LUMO_FAIL_ON_LOUD is not 'false'. SOFT findings never
 *     affect the exit code.
 *
 * Fail-open honesty: when the scan cannot run (no git, unusable base ref,
 * unreadable snapshot, engine failure) the exit code is 0, and in CI mode an
 * explicit DID NOT RUN line is printed — a skipped scan must never read like
 * a clean one.
 */

import { spawnSync } from 'node:child_process';
import { parseDiff } from '../action/diff-parser.js';
import { runCatch } from '../action/catch-runner.js';
import { loadSnapshot } from '../lib/snapshot.js';
import {
  formatCatch,
  SCAN_NO_MATCH_TEMPLATE,
  ACTION_PRO_DEGRADED_LINE,
} from '../lib/render.js';
import { orderFindingsLoudFirst } from './order-findings.js';
import { abspathFindings } from './abspath.js';

export interface RunScanOptions {
  /** CLI arguments after node binary and script (default: process.argv.slice(2)). */
  argv?: string[];
  /** Environment for the CI variables (default: process.env). */
  env?: Record<string, string | undefined>;
  /** Working directory for git (default: process.cwd()). */
  cwd?: string;
  /** Diff source — injectable so tests feed unified-diff strings without git. */
  getDiff?: (cwd: string, base: string | null) => string | null;
}

export interface RunScanResult {
  /** Output lines; the entry prints each with one console.log, in order. */
  lines: string[];
  exitCode: number;
}

const HELP_TEXT = [
  'lumo-scan — proactive catch for your current git changes.',
  '',
  'Usage: lumo-scan [--ci] [--base <ref>]',
  '',
  'Scans `git diff HEAD` (staged + unstaged) for WordPress/WooCommerce',
  'patterns that broke in a real release, plus new PHP files missing the',
  'ABSPATH guard. Prints findings LOUD first, or the checked scope.',
  'Without --ci the exit code is always 0 — findings inform, they do not block.',
  '',
  'CI mode (--ci) scans `git diff <base>...HEAD` instead. The base ref comes',
  'from --base, else $CI_MERGE_REQUEST_DIFF_BASE_SHA, else the working tree',
  'is scanned and a note says so. Exits 1 only when a LOUD finding fired and',
  '$LUMO_FAIL_ON_LOUD is not "false"; SOFT findings never affect the exit',
  'code. When the scan cannot run it prints DID NOT RUN and exits 0.',
].join('\n');

/** CI-mode fail-open marker. Every path that skips the scan must carry both parts. */
const CI_DID_NOT_RUN = 'lumo scan: DID NOT RUN —';
const CI_NOT_CLEAN = 'This is not a clean result.';

/**
 * CI enforcement is a Lumo Pro feature: the gate calls the licensed Pro
 * server, which carries the daily-tended knowledge and the premium-plugin
 * coverage. Running the free local catch as a pipeline gate would promise a
 * verdict the free knowledge cannot back.
 *
 * Without a licence the job stays green — a missing subscription is not a
 * reason to block someone's merge — but it says plainly that nothing was
 * checked, so the green tick can never be mistaken for a passed review.
 */
const CI_REQUIRES_PRO =
  `${CI_DID_NOT_RUN} CI enforcement is part of Lumo Pro, and no licence key was configured, ` +
  `so no code was checked. ${CI_NOT_CLEAN}\n` +
  'Set LUMO_LICENSE_KEY (and LUMO_PRO_URL) to run the gate. ' +
  'Without a subscription, `lumo scan` still checks your working tree locally, ' +
  'and the MCP server and skills stay free.';

/**
 * Licensed, but no Pro server configured. The gate still runs — the licence is
 * the entitlement — but on the free knowledge, which a paying customer would
 * otherwise reasonably mistake for their Pro coverage.
 */
const CI_NO_PRO_URL =
  'lumo scan: LUMO_PRO_URL is not set, so this gate ran on the free knowledge only — ' +
  'no premium-plugin coverage. Point it at your Lumo Pro server for the licensed catch.';

// ---------------------------------------------------------------------------
// Git diff.
// Default mode: staged + unstaged working changes against HEAD, falling back
// to `git diff` (unstaged only) when HEAD does not exist yet (new repo).
// CI mode (base given): `git diff <base>...HEAD` — no working-tree fallback,
// because silently comparing something other than the given base would scan
// the wrong thing.
// ---------------------------------------------------------------------------

function getGitDiff(cwd: string, base: string | null): string | null {
  if (base !== null) {
    const result = spawnSync('git', ['diff', `${base}...HEAD`], {
      cwd,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    });
    if (result.status === 0 && typeof result.stdout === 'string') {
      return result.stdout;
    }
    return null;
  }

  // Try `git diff HEAD` first — covers both staged and unstaged relative to HEAD.
  let result = spawnSync('git', ['diff', 'HEAD'], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024, // 4 MB cap — generous for local diffs
  });

  if (result.status === 0 && typeof result.stdout === 'string') {
    // Also capture staged-only diffs for repos where HEAD is a clean commit
    // and `git diff HEAD` misses nothing (it already includes staged changes).
    return result.stdout;
  }

  // HEAD missing (initial commit with nothing committed yet): use `git diff`
  // for unstaged changes only.
  result = spawnSync('git', ['diff'], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });

  if (result.status === 0 && typeof result.stdout === 'string') {
    return result.stdout;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Knowledge stamp — sourced from snapshot.generatedAt, never Date.now().
// Returns 'YYYY-MM-DD' slice. Fail-open: returns null when snapshot unavailable.
// ---------------------------------------------------------------------------

function knowledgeDate(): string | null {
  try {
    const snap = loadSnapshot();
    return snap.generatedAt.slice(0, 10);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Base ref resolution, CI mode only: --base wins, else the GitLab MR variable.
// Empty values count as not given — the CI template passes --base "$VAR"
// verbatim, which expands to "" outside a merge request pipeline.
// ---------------------------------------------------------------------------

function resolveBase(argv: string[], env: Record<string, string | undefined>): string | null {
  const i = argv.indexOf('--base');
  const fromArg = i !== -1 ? argv[i + 1]?.trim() : undefined;
  if (fromArg) {
    return fromArg;
  }
  const fromEnv = env['CI_MERGE_REQUEST_DIFF_BASE_SHA']?.trim();
  return fromEnv ? fromEnv : null;
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

export async function runScan(opts: RunScanOptions = {}): Promise<RunScanResult> {
  const argv = opts.argv ?? process.argv.slice(2);
  const env = opts.env ?? process.env;
  const cwd = opts.cwd ?? process.cwd();
  const getDiff = opts.getDiff ?? getGitDiff;
  const lines: string[] = [];

  // --help must answer, not scan. Found in QA: the documented bin ignored the
  // flag and ran a scan instead — whoever tries the docs gets no help.
  if (argv.includes('--help') || argv.includes('-h')) {
    return { lines: [HELP_TEXT], exitCode: 0 };
  }

  const ci = argv.includes('--ci');
  const base = ci ? resolveBase(argv, env) : null;

  // CI enforcement is licensed. Checked before anything else in CI mode: no
  // licence means no gate, said out loud, with the job left green.
  const proUrl = env['LUMO_PRO_URL']?.trim();
  const licenseKey = env['LUMO_LICENSE_KEY']?.trim();
  if (ci && !licenseKey) {
    lines.push(CI_REQUIRES_PRO);
    return { lines, exitCode: 0 };
  }

  // CI preflight: checkCodeWithGaps swallows snapshot failures and returns
  // zero findings, which downstream reads as a clean scan. A gate that
  // checked against nothing must say so instead.
  if (ci && knowledgeDate() === null) {
    lines.push(
      `${CI_DID_NOT_RUN} the knowledge snapshot could not be loaded, so no code was checked. ${CI_NOT_CLEAN}`,
    );
    return { lines, exitCode: 0 };
  }

  if (ci && base === null) {
    // Gemini pass B: in a pipeline this state is config drift (the MR base
    // variable did not resolve), and a CI checkout has a clean tree — so the
    // line must say plainly that the merge request was NOT checked, not just
    // describe the fallback.
    lines.push(
      'lumo scan: no base ref given — comparing your uncommitted working tree changes, not a merge request diff. ' +
        'If this is a CI pipeline, the base ref was not resolved and the merge request was NOT checked.',
    );
  }

  // Licensed, but no server configured: the gate runs on the free knowledge.
  // Say so — a Pro subscriber has every reason to assume Pro coverage.
  if (ci && !proUrl) {
    lines.push(CI_NO_PRO_URL);
  }

  // 1. Obtain diff — fail-open: no git / not a repo → friendly message.
  let diff: string | null;
  try {
    diff = getDiff(cwd, base);
  } catch {
    diff = null;
  }

  if (diff === null) {
    if (ci) {
      lines.push(
        base === null
          ? `${CI_DID_NOT_RUN} could not run git diff (git missing or not a git repository), so no code was checked. ${CI_NOT_CLEAN}`
          : `${CI_DID_NOT_RUN} git diff against base ${base} failed, so no code was checked. ${CI_NOT_CLEAN}\n` +
              'If the base commit is missing locally, fetch the full history (GitLab CI: set GIT_DEPTH to 0).',
      );
      return { lines, exitCode: 0 };
    }
    lines.push(
      'lumo scan: could not run git diff — not a git repository or git is not installed.\n' +
        'Run `lumo scan` from inside a git project.',
    );
    return { lines, exitCode: 0 };
  }

  // 2. Empty diff → nothing to scan. A git-status fact, phrased as one: the
  // old wording welded "working tree is clean as of <knowledge date>" into a
  // sentence that read like a dated verdict on the code. In CI mode the diff
  // is a merge-request range, so "uncommitted" would be a false claim there.
  if (!diff.trim()) {
    const date = knowledgeDate();
    const dateNote = date ? ` (knowledge of ${date})` : '';
    lines.push(
      ci
        ? `lumo scan: no changes to scan${dateNote}.`
        : `lumo scan: no uncommitted changes to scan${dateNote}.`,
    );
    return { lines, exitCode: 0 };
  }

  // 3. Count changed PHP/JS files for the clean-message N.
  const files = parseDiff(diff);
  const fileCount = files.length;

  // 4. Run catch — fail-open: any internal error exits 0, in CI mode with an
  // explicit DID NOT RUN line.
  let result;
  try {
    // In CI the licence is present by the time we get here (checked above), so
    // the gate runs against the licensed Pro server. Locally it stays free.
    result = ci && proUrl ? await runCatch({ diff, proUrl, licenseKey }) : await runCatch({ diff });
    // File-level ABSPATH check — only the scan can carry it honestly, and only
    // for NEW files, where the diff is the whole file. Advisory, never LOUD.
    try {
      const snap = loadSnapshot();
      for (const r of abspathFindings(diff, snap)) {
        const filename = r.condition?.match(/the new file (\S+) is/)?.[1] ?? 'new file';
        result.findings.push({ filename, tier: r.tier, body: formatCatch(r) });
        result.softCount += 1;
      }
    } catch {
      // fail-open — the diff-based findings stand on their own
    }
  } catch {
    if (ci) {
      lines.push(
        `${CI_DID_NOT_RUN} the catch engine failed before finishing, so the diff was not checked. ${CI_NOT_CLEAN}`,
      );
      return { lines, exitCode: 0 };
    }
    const date = knowledgeDate();
    const dateNote = date ? ` (knowledge current as of ${date})` : '';
    lines.push(
      `lumo scan: scan could not complete${dateNote}. ` +
        'If this persists, check that the plugin is installed correctly.',
    );
    return { lines, exitCode: 0 };
  }

  const date = knowledgeDate();

  // The licensed gate fell back to the free catch. Same rule as the Action:
  // say it in the run itself, or a degraded gate reads as a Pro pass.
  if (ci && result.proDegraded) {
    lines.push(`lumo scan: ${ACTION_PRO_DEGRADED_LINE}`);
  }

  // CI gate: LOUD is the only signal that may fail the job, and only while
  // LUMO_FAIL_ON_LOUD is not the literal string 'false'. SOFT never blocks.
  const exitCode = ci && result.loudCount > 0 && env['LUMO_FAIL_ON_LOUD'] !== 'false' ? 1 : 0;

  // 5a. Findings present — print them, LOUD first (runCatch returns file order, so sort below).
  if (result.findings.length > 0) {
    const loudCount = result.loudCount;
    const softCount = result.softCount;

    const parts: string[] = [];
    if (loudCount > 0) {
      parts.push(`${loudCount} LOUD`);
    }
    if (softCount > 0) {
      parts.push(`${softCount} advisory`);
    }

    lines.push(
      `lumo scan: ${parts.join(', ')} finding${result.findings.length === 1 ? '' : 's'} in your current changes.\n`,
    );

    for (const finding of orderFindingsLoudFirst(result.findings)) {
      lines.push(`--- ${finding.filename} ---`);
      lines.push(finding.body);
      lines.push('');
    }

    if (loudCount > 0) {
      lines.push(
        `Fix the ${loudCount > 1 ? `${loudCount} LOUD findings` : 'LOUD finding'} above before committing.`,
      );
    }
    return { lines, exitCode };
  }

  // 5b. No findings — scope statement, never a verdict on the changes.
  const fileLabel = fileCount === 1 ? '1 changed file' : `${fileCount} changed files`;
  lines.push(
    SCAN_NO_MATCH_TEMPLATE.replace(
      'lumo scan: {files}',
      `lumo scan: ${fileCount > 0 ? fileLabel : 'your changes'}`,
    ).replace('{date}', date ? ` (knowledge of ${date})` : ''),
  );
  return { lines, exitCode: 0 };
}
