#!/usr/bin/env node
/**
 * lumo-scan — one-shot proactive catch for the developer's current changes.
 *
 * Runs `git diff HEAD` in the current working directory, feeds the unified
 * diff through the existing diff-parser → catch pipeline, and prints either:
 *   - Formatted catch findings (LOUD first, then SOFT), or
 *   - An honest "scanned N files — clean" message with the knowledge date.
 *
 * Fail-open by design: any error (no git, not a repo, empty diff, snapshot
 * failure) exits 0 with a friendly message — never throws to stderr.
 *
 * Entry point: bin/lumo-scan (via package.json#bin.lumo-scan → dist/scan.mjs)
 */

import { spawnSync } from 'node:child_process';
import { parseDiff } from '../action/diff-parser.js';
import { runCatch } from '../action/catch-runner.js';
import { loadSnapshot } from '../lib/snapshot.js';

// ---------------------------------------------------------------------------
// Git diff — staged + unstaged working changes against HEAD.
// Falls back to `git diff` (unstaged only) when HEAD does not exist yet (new repo).
// ---------------------------------------------------------------------------

function getGitDiff(cwd: string): string | null {
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
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const cwd = process.cwd();

  // 1. Obtain diff — fail-open: no git / not a repo → friendly message.
  let diff: string | null;
  try {
    diff = getGitDiff(cwd);
  } catch {
    diff = null;
  }

  if (diff === null) {
    console.log(
      'lumo scan: could not run git diff — not a git repository or git is not installed.\n' +
        'Run `lumo scan` from inside a git project.',
    );
    process.exit(0);
  }

  // 2. Empty diff → no uncommitted changes, report clean.
  if (!diff.trim()) {
    const date = knowledgeDate();
    const dateNote = date ? ` as of ${date}` : '';
    console.log(`lumo scan: no uncommitted changes to scan — working tree is clean${dateNote}.`);
    process.exit(0);
  }

  // 3. Count changed PHP/JS files for the clean-message N.
  const files = parseDiff(diff);
  const fileCount = files.length;

  // 4. Run catch — fail-open: any internal error exits 0 gracefully.
  let result;
  try {
    result = await runCatch({ diff });
  } catch {
    const date = knowledgeDate();
    const dateNote = date ? ` (knowledge current as of ${date})` : '';
    console.log(
      `lumo scan: scan could not complete${dateNote}. ` +
        'If this persists, check that the plugin is installed correctly.',
    );
    process.exit(0);
  }

  const date = knowledgeDate();
  const dateNote = date ? ` as of ${date}` : '';

  // 5a. Findings present — print them (LOUD first, already sorted by runCatch).
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

    console.log(`lumo scan: ${parts.join(', ')} finding${result.findings.length === 1 ? '' : 's'} in your current changes.\n`);

    for (const finding of result.findings) {
      console.log(`--- ${finding.filename} ---`);
      console.log(finding.body);
      console.log('');
    }

    if (loudCount > 0) {
      console.log(
        `Fix the ${loudCount > 1 ? `${loudCount} LOUD findings` : 'LOUD finding'} above before committing.`,
      );
    }
    return;
  }

  // 5b. No findings — clean message with file count and dated knowledge stamp.
  const fileLabel = fileCount === 1 ? '1 changed file' : `${fileCount} changed files`;
  const scannedNote = fileCount > 0 ? `Scanned ${fileLabel}` : 'Scanned your changes';
  console.log(`lumo scan: ${scannedNote} — clean${dateNote}.`);
}

main().catch(() => {
  // Top-level safety net — never let an unhandled rejection surface.
  process.exit(0);
});
