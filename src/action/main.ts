/**
 * Lumo GitHub Action entry point.
 *
 * Reads inputs, fetches the PR diff, runs the catch engine, and posts
 * findings as PR review comments. Fails the check (exit 1) when LOUD
 * catches fire and fail_on_loud is true (the default).
 *
 * Block/advise model (no-false-LOUD):
 *   LOUD  → comment + fail when fail_on_loud=true.
 *   SOFT  → comment only, never blocks.
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import { runCatch } from './catch-runner.js';

async function main(): Promise<void> {
  const failOnLoud = core.getInput('fail_on_loud').trim().toLowerCase() !== 'false';
  const proUrl = core.getInput('lumo_pro_url').trim();
  const licenseKey = core.getInput('lumo_license_key').trim();
  // Mask the license key so it never surfaces in logs, even with ACTIONS_STEP_DEBUG enabled.
  if (licenseKey) {
    core.setSecret(licenseKey);
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

  const { loudCount, softCount, findings } = await runCatch({
    diff,
    proUrl: proUrl || undefined,
    licenseKey: licenseKey || undefined,
  });

  if (findings.length === 0) {
    core.info('[lumo] No WordPress/WooCommerce issues detected — clean PR.');
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

  if (loudCount > 0 && failOnLoud) {
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

  if (loudCount > 0 && failOnLoud) {
    core.setFailed(
      `Lumo caught ${loudCount} LOUD WordPress/WooCommerce pattern${loudCount > 1 ? 's' : ''} — review the PR comments and fix before merging.`,
    );
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  core.setFailed(`[lumo] Unexpected error: ${message}`);
});
