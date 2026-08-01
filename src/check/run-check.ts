/**
 * `lumo check <file…>`: whole-file catch for the case scan cannot cover.
 *
 * `lumo scan` only reads the git diff. Pros testing committed bait PHP hit a
 * silent no-match and think the engine is blind. This command runs the same
 * Free catch engine over full file contents (MCP `lumo_check_code` path).
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { handleCheckCodeFull } from '../mcp/handlers.js';

export interface CheckRunResult {
  lines: string[];
  /** 1 when any LOUD finding and failOnLoud; otherwise 0. */
  exitCode: number;
}

function languageFor(path: string): 'php' | 'js' | 'auto' {
  const ext = extname(path).toLowerCase();
  if (ext === '.php') return 'php';
  if (ext === '.js' || ext === '.jsx' || ext === '.ts' || ext === '.tsx' || ext === '.mjs') {
    return 'js';
  }
  return 'auto';
}

export async function runCheck(
  paths: string[],
  opts: { failOnLoud?: boolean; projectRoot?: string } = {},
): Promise<CheckRunResult> {
  const lines: string[] = [];
  if (paths.length === 0) {
    lines.push(
      'lumo check: pass one or more file paths.\n' +
        'Example: lumo check includes/orders.php\n' +
        'This checks whole file contents. For uncommitted diffs only, use `lumo scan`.',
    );
    // Usage help only — not a completed check. Non-zero so scripts cannot
    // treat "nothing asked" as a passed review.
    return { lines, exitCode: 1 };
  }

  let anyLoud = false;
  let checked = 0;

  for (const raw of paths) {
    const path = resolve(raw);
    if (!existsSync(path) || !statSync(path).isFile()) {
      lines.push(`lumo check: skip (not a file): ${raw}`);
      continue;
    }
    let code: string;
    try {
      code = readFileSync(path, 'utf8');
    } catch {
      lines.push(`lumo check: could not read ${raw}`);
      continue;
    }
    checked += 1;
    const verdict = await handleCheckCodeFull({
      code,
      language: languageFor(path),
      project_root: opts.projectRoot ?? process.cwd(),
    });
    anyLoud = anyLoud || verdict.loudCount > 0;
    lines.push(`=== ${raw} ===`);
    if (!verdict.computed) {
      lines.push(verdict.text);
    } else if (!verdict.found) {
      lines.push(
        `${verdict.text}\n` +
          '(Whole file checked. Quiet is not an all-clear outside Free coverage.)',
      );
    } else {
      const counts: string[] = [];
      if (verdict.loudCount > 0) counts.push(`${verdict.loudCount} LOUD`);
      if (verdict.softCount > 0) counts.push(`${verdict.softCount} advisory`);
      lines.push(`${counts.join(', ') || 'findings'}:\n\n${verdict.text}`);
    }
    lines.push('');
  }

  if (checked === 0) {
    lines.push(
      'lumo check: no files checked. Paths were missing, unreadable, or not files. ' +
        'This is not a completed check and not an all-clear.',
    );
    return { lines, exitCode: 1 };
  }

  const exitCode = opts.failOnLoud && anyLoud ? 1 : 0;
  return { lines, exitCode };
}
