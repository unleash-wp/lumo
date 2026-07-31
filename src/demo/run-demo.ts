/**
 * `lumo demo` — show the catch working, in under a minute, on nothing.
 *
 * The problem this solves: a tool whose value is invisible until it catches
 * something. A fresh install in a clean repository prints an honest scope line
 * and nothing else, so the first impression of a watchdog is silence. Someone
 * who never sees it bark has no reason to keep it.
 *
 * So the demo runs the real engine over four blobs of the kind an assistant
 * produces for ordinary WordPress tasks, and prints the real output — same
 * renderer, same tiering, same sources as a scan of the user's own code. It
 * cannot flatter the product: if a rule stops firing, the demo stops showing
 * that finding, and a test fails.
 *
 * It says in its first line that this is sample code, not their project. A
 * demonstration that could be mistaken for a scan would be the same lie the
 * rest of this product refuses to tell.
 */

import { checkCode } from '../detection/catch.js';
import { formatCatch, KNOWLEDGE_WIDER_THAN_CATCH } from '../lib/render.js';
import { loadSnapshot } from '../lib/snapshot.js';
import { DEMO_SAMPLES } from './samples.js';

const HEADER = [
  'lumo demo — this runs the catch over four code samples that ship with Lumo.',
  'It is NOT a scan of your project: nothing here was read from your machine.',
  'Run `lumo scan` for that.',
].join('\n');

/** Knowledge stamp from the snapshot, never a clock read. */
function knowledgeDate(): string | null {
  try {
    return loadSnapshot().generatedAt.slice(0, 10);
  } catch {
    return null;
  }
}

export interface DemoResult {
  lines: string[];
  /** Findings shown across all samples — the number a test can hold the demo to. */
  findingCount: number;
}

export function runDemo(): DemoResult {
  const lines: string[] = [HEADER];
  const date = knowledgeDate();
  lines.push(date ? `Knowledge of ${date}.` : 'Knowledge date unavailable.');

  // Check everything first, so the verdict can lead. The rendered entries run
  // to a few hundred lines; someone meeting the tool for the first time should
  // learn what happened before they start scrolling through why.
  const checked = DEMO_SAMPLES.map((sample) => {
    try {
      return { sample, results: checkCode(sample.code, 'php'), failed: false };
    } catch {
      return { sample, results: [], failed: true };
    }
  });

  const all = checked.flatMap((c) => c.results);
  const loud = all.filter((r) => r.tier === 'LOUD').length;
  const soft = all.length - loud;
  const findingCount = all.length;

  // "across 4 samples" would be a small lie when one of them never got
  // checked, so the count reports what actually ran and names the shortfall.
  const failedCount = checked.filter((c) => c.failed).length;
  const scanned = checked.length - failedCount;
  const scope =
    failedCount === 0
      ? `${checked.length} samples`
      : `${scanned} of ${checked.length} samples (${failedCount} could not be checked)`;

  if (findingCount > 0) {
    lines.push(
      '',
      `${findingCount} findings across ${scope}: ${loud} LOUD (certain break, carries a source), ` +
        `${soft} advisory (context-dependent, never blocks).`,
      'Each one below shows the wrong pattern, the correct one, and where that comes from.',
    );
  }

  for (const [index, { sample, results, failed }] of checked.entries()) {
    lines.push('', '─'.repeat(60), `Asked for: ${sample.prompt}`, '', sample.code, '');

    if (failed) {
      // Say which sample went unchecked rather than skipping it silently — a
      // demo that quietly drops a sample overstates the catch.
      lines.push(`(sample ${index + 1} could not be checked — the engine failed on it)`);
      continue;
    }
    if (results.length === 0) {
      lines.push('No covered pattern matched this sample.');
      continue;
    }
    for (const result of results) {
      lines.push(formatCatch(result));
    }
  }

  lines.push(
    '',
    '─'.repeat(60),
    findingCount === 0
      ? 'Nothing fired on the samples. That is a defect, not a clean bill — please report it.'
      : `${findingCount} findings, each with the source it comes from.`,
    '',
    'On your own code:',
    '  lumo scan                    check your current git changes',
    '  claude mcp add lumo -- npx -y -p @unleashwp/lumo lumo-mcp',
    '                               let your assistant check code before you see it',
    '',
    'These samples exercise four of the patterns Lumo Free carries — a',
    'demonstration, not a coverage list. Lumo Free holds WordPress Core, block',
    'and theme APIs, and security fundamentals as knowledge. WooCommerce and the',
    'premium plugins are Lumo Pro, and where the free tier cannot check, it says',
    'so instead of going quiet.',
    '',
    KNOWLEDGE_WIDER_THAN_CATCH,
  );

  return { lines, findingCount };
}
