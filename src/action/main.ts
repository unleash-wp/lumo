/**
 * Lumo GitHub Action entry point.
 *
 * Reads inputs, fetches the PR diff, runs the catch engine, and posts
 * findings as PR review comments. Fails the check (exit 1) when LOUD
 * catches fire and fail_on_loud is true (the default).
 *
 * Enforcement ladder — gated on .claude/.lumo.json enforce.mode in the
 * checked-out workspace (GITHUB_WORKSPACE):
 *   block     → LOUD fires = non-zero exit (fails the PR build)
 *   warn-only → comment-only on every finding; no non-zero exit
 *   off       → no comments, no exit signal
 *   (absent)  → advisory/comment only — byte-identical to warn-only
 *
 * The fail_on_loud action input remains for backwards compatibility and
 * is OR-combined with enforce.mode:block — either can trigger failure.
 *
 * Block/advise model (no-false-LOUD):
 *   LOUD  → comment + fail when fail_on_loud=true OR enforce.mode=block.
 *   SOFT  → comment only, never blocks.
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { runCatch } from './catch-runner.js';
import {
  ACTION_NO_MATCH_LINE,
  ACTION_SCOPE_LINE,
  ACTION_PRO_DEGRADED_LINE,
  buildScanLimitsNotice,
  ACTION_REQUIRES_PRO_LINE,
  ENFORCE_CONFIG_UNREADABLE_LINE,
} from '../lib/render.js';

// ---------------------------------------------------------------------------
// Enforcement mode from workspace .lumo.json
// ---------------------------------------------------------------------------

/**
 * Read enforce.mode from .claude/.lumo.json in the checked-out workspace.
 * Returns 'warn-only' when absent, malformed, or set to any unknown value.
 * Only an explicit "block" or "off" overrides the default advisory behaviour.
 *
 * Exported for unit testing; not part of the public action API surface.
 */
export function resolveActionEnforceMode(
  workspaceDir: string,
): 'block' | 'warn-only' | 'off' | 'unreadable' {
  const cfgPath = path.join(workspaceDir, '.claude', '.lumo.json');
  let cfg: Record<string, unknown>;
  try {
    // No file is not a broken file. Most repositories never write one, and the
    // documented default for them is advisory — nothing to report.
    if (!fs.existsSync(cfgPath)) return 'warn-only';
    cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as Record<string, unknown>;
  } catch {
    return 'unreadable';
  }

  const enforce = cfg?.enforce as Record<string, unknown> | undefined;
  const mode = enforce?.['mode'];
  if (mode === undefined) return 'warn-only';
  if (mode === 'block') return 'block';
  if (mode === 'off') return 'off';
  if (mode === 'warn-only') return 'warn-only';

  // A file that exists and names a mode this version does not know is a repo
  // asking for something and not getting it. Answering 'warn-only' here would
  // have been correct behaviour reported as a lie: a team that wrote "block"
  // with a typo would keep merging on LOUD findings, told nothing, and read
  // every green check as an enforced one. 'unreadable' exists so the caller can
  // say what happened; the behaviour still falls open to advisory.
  return 'unreadable';
}

/**
 * Put a line where a reader will actually meet it.
 *
 * `core.info` writes to the step log, and nobody opens the log of a green
 * check — which is precisely when these lines matter, because every one of them
 * exists to say the green tick is not a verdict. The job summary is rendered on
 * the run page; a warning becomes an annotation on the checks page next to the
 * tick itself. Neither blocks a merge.
 *
 * A pull request comment would be louder still and is deliberately not used for
 * these: both repeat on every pull request in a repository that is simply
 * unconfigured, or that has a quiet diff. A comment each time is the Cobra
 * effect — noise that teaches people to filter Lumo out. Comments stay reserved
 * for the case where something a customer is paying for stopped working
 * mid-run.
 */
export async function announce(heading: string, line: string, annotate: boolean): Promise<void> {
  if (annotate) {
    core.warning(line);
  } else {
    core.info(`[lumo] ${line}`);
  }
  // Absent outside a real Actions run — a local invocation must not die here.
  if (process.env['GITHUB_STEP_SUMMARY']) {
    try {
      await core.summary.addHeading(heading, 3).addRaw(line).write();
    } catch {
      // Losing the summary must not lose the sentence. Where the summary was
      // the only channel, escalate to an annotation rather than let a reporting
      // hiccup either fail someone's build or quietly drop the one line saying
      // this run is not a verdict.
      if (!annotate) {
        core.warning(line);
      }
    }
  }
}

async function main(): Promise<void> {
  const failOnLoud = core.getInput('fail_on_loud').trim().toLowerCase() !== 'false';
  const proUrl = core.getInput('lumo_pro_url').trim();
  const licenseKey = core.getInput('lumo_license_key').trim();
  // Mask the license key so it never surfaces in logs, even with ACTIONS_STEP_DEBUG enabled.
  if (licenseKey) {
    core.setSecret(licenseKey);
  }

  // Enforcement ladder: read enforce.mode from workspace .lumo.json.
  // Default-safe: absent config → 'warn-only' (advisory only, never blocks).
  // Only enforce.mode:"block" enables non-zero exit on LOUD catches.
  //
  // A file that is present but broken still falls open to advisory, and now
  // says so. Falling open quietly meant a repository could ask for a blocking
  // gate, lose it to a typo, and go on reading its green checks as enforced.
  const workspaceDir = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
  const resolvedMode = resolveActionEnforceMode(workspaceDir);
  if (resolvedMode === 'unreadable') {
    await announce('Lumo: configuration ignored', ENFORCE_CONFIG_UNREADABLE_LINE, true);
  }
  const enforceMode = resolvedMode === 'unreadable' ? 'warn-only' : resolvedMode;
  const blockOnLoud = failOnLoud || enforceMode === 'block';

  // When enforce.mode is "off", skip comments entirely.
  if (enforceMode === 'off') {
    core.info('[lumo] enforce.mode=off — skipping all catch output');
    return;
  }

  // CI enforcement is licensed. Without a licence there is no gate: the check
  // stays green — a missing subscription must never block someone's merge —
  // but it has to say that nothing was checked somewhere the reader will meet
  // it. This used to be a core.info, which put the sentence in a log nobody
  // opens beside a green tick, and a green tick that nothing contradicts reads
  // as a passed review. It is the first thing anyone evaluating Lumo sees, so
  // it is annotated as well as summarised.
  if (!licenseKey) {
    await announce('Lumo: DID NOT RUN', ACTION_REQUIRES_PRO_LINE, true);
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    core.setFailed('GITHUB_TOKEN environment variable is required');
    return;
  }

  const ctx = github.context;

  if (ctx.eventName !== 'pull_request') {
    core.info('[lumo] Not a pull_request event — skipping');
    return;
  }

  const octokit = github.getOctokit(token);
  const pullNumber = ctx.payload.pull_request?.number;

  if (!pullNumber) {
    core.setFailed('[lumo] Could not read pull_request.number from event payload');
    return;
  }

  // Fetch the PR unified diff via the GitHub API.
  const diffResponse = await octokit.rest.pulls.get({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    pull_number: pullNumber,
    mediaType: { format: 'diff' },
  });

  // The diff comes back as the raw response body when mediaType.format='diff'.
  const diff = diffResponse.data as unknown as string;

  const { loudCount, softCount, findings, proDegraded, scanLimits } = await runCatch({
    diff,
    proUrl: proUrl || undefined,
    licenseKey: licenseKey || undefined,
  });

  // The degradation must speak in the PR itself, not only in the job log —
  // same contract as the scanner's DID-NOT-RUN line. One comment per run.
  if (proDegraded) {
    await octokit.rest.issues.createComment({
      owner: ctx.repo.owner,
      repo: ctx.repo.repo,
      issue_number: pullNumber,
      body: `**[Lumo]** ${ACTION_PRO_DEGRADED_LINE}`,
    });
    core.info('[lumo] Pro check degraded to the free catch — posted the degradation notice');
  }

  // One comment for the whole run, naming the files. Per-file would repeat the
  // same sentence under every changed file and wear out the notice that has to
  // be believed when a real outage happens.
  if (scanLimits.length > 0) {
    await octokit.rest.issues.createComment({
      owner: ctx.repo.owner,
      repo: ctx.repo.repo,
      issue_number: pullNumber,
      body: `**[Lumo]** ${buildScanLimitsNotice(scanLimits)}`,
    });
    core.info(`[lumo] Scan limits hit on ${scanLimits.length} file(s) — posted one summary`);
  }

  // Optional autonomous review stage — advisory, fenced, fail-open. Defined
  // here so BOTH paths run it: a diff with zero engine findings is exactly
  // where a human-style read adds the most. Never touches counts or exit code.
  const maybeClaudeReview = async (): Promise<void> => {
    const anthropicKey = core.getInput('anthropic_api_key').trim();
    if (!anthropicKey) return;
    core.setSecret(anthropicKey);
    const { runClaudeReview } = await import('./claude-review.js');
    const review = await runClaudeReview(anthropicKey, {
      diff,
      findings,
      model: core.getInput('claude_model').trim() || 'claude-sonnet-5',
    });
    if (review) {
      await octokit.rest.issues.createComment({
        owner: ctx.repo.owner,
        repo: ctx.repo.repo,
        issue_number: pullNumber,
        body: [
          '**[Lumo] Autonomous WordPress review** _(advisory — never blocks the merge)_',
          '',
          review.body,
          '',
          '_Grounded on the rule-engine findings above; version claims stay with the engine and its sources._',
        ].join('\n'),
      });
      core.info('[lumo] Posted the autonomous review comment');
    } else {
      core.info('[lumo] Autonomous review skipped (API unavailable or empty) — CI unaffected');
    }
  };

  if (findings.length === 0) {
    // Reports the scope that was checked, never a verdict on the PR. Lumo saw
    // the added lines only, and only against the catch that ran — calling that
    // a clean PR turns a coverage limit into an approval.
    //
    // Summarised, not annotated: the engine did run here, and a yellow warning
    // on every quiet pull request is the cost that gets a tool muted. The
    // caveat still has to leave the log, because a green tick with nothing
    // beside it is the coverage limit reading as an approval.
    await announce('Lumo: nothing matched', ACTION_NO_MATCH_LINE, false);
    await maybeClaudeReview();
    return;
  }

  // Build the review summary body.
  const totalCount = findings.length;
  const summaryLines: string[] = [
    '## Lumo WP Code Review',
    '',
    totalCount === 1
      ? 'Found **1 WordPress/WooCommerce pattern** to review.'
      : `Found **${totalCount} WordPress/WooCommerce patterns** to review.`,
    '',
  ];

  if (loudCount > 0 && blockOnLoud) {
    summaryLines.push(
      `**${loudCount} LOUD catch${loudCount > 1 ? 'es' : ''}** — certain breaking changes; this check will fail.`,
    );
  }
  if (softCount > 0) {
    summaryLines.push(
      `**${softCount} advisory finding${softCount > 1 ? 's' : ''}** — context-dependent; will not block merge.`,
    );
  }

  summaryLines.push(
    '',
    ACTION_SCOPE_LINE,
    '',
    '_Lumo proposes and cites — never auto-fixes. See each comment for the dated source and correct pattern._',
  );

  // Post the review summary (COMMENT event — does not request changes or approve).
  await octokit.rest.pulls.createReview({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    pull_number: pullNumber,
    commit_id: ctx.payload.pull_request?.head?.sha,
    event: 'COMMENT',
    body: summaryLines.join('\n'),
    comments: [],
  });

  // Post each finding as a standalone PR issue comment so it is visible in the
  // Conversation tab without requiring exact diff-position arithmetic (which
  // breaks across rebases and force-pushes).
  for (const finding of findings) {
    const tierBadge = finding.tier === 'LOUD' ? '🚨 LOUD' : '🔍 Advisory';
    const commentBody = [
      `**[Lumo] ${tierBadge} catch in \`${finding.filename}\`**`,
      '',
      finding.body,
    ].join('\n');

    await octokit.rest.issues.createComment({
      owner: ctx.repo.owner,
      repo: ctx.repo.repo,
      issue_number: pullNumber,
      body: commentBody,
    });
  }

  core.info(
    `[lumo] Posted ${findings.length} finding(s) — ${loudCount} LOUD, ${softCount} advisory`,
  );

  // Runs after the engine findings are posted so its prompt can build on them,
  // and before the exit-code decision so a review outage can never mask a LOUD
  // failure.
  await maybeClaudeReview();

  if (loudCount > 0 && blockOnLoud) {
    core.setFailed(
      `Lumo caught ${loudCount} LOUD WordPress/WooCommerce pattern${loudCount > 1 ? 's' : ''} — review the PR comments and fix before merging.`,
    );
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  core.setFailed(`[lumo] Unexpected error: ${message}`);
});
