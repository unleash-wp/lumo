import { spawnSync } from 'node:child_process';
import { PATTERNS } from './registry.js';
import type { PluginDetection } from './types.js';

/**
 * Return true when a `git` binary is reachable on PATH.
 */
function gitBinaryAvailable(): boolean {
  try {
    const result = spawnSync('git', ['--version'], { timeout: 3000, encoding: 'utf8' });
    return result.status === 0 && !result.error;
  } catch {
    return false;
  }
}

/**
 * Return true when `projectRoot` is inside a git work tree.
 */
function isInsideWorkTree(projectRoot: string): boolean {
  try {
    const result = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd: projectRoot,
      timeout: 3000,
      encoding: 'utf8',
    });
    return result.status === 0 && !result.error && result.stdout.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Detect a registered pattern by checking whether a path is tracked in git.
 * Only patterns with a non-empty `gitTrackedPaths` field are attempted.
 *
 * For each candidate path, runs:
 *   git ls-files --error-unmatch -- <path>
 * Exit 0 ⟹ the file is tracked ⟹ return a detection with source 'git'.
 *
 * Fail-open: git absent, not a repo, any error or non-zero exit ⟹ null.
 * NEVER throws.
 */
export function detectFromGitTracked(projectRoot: string): PluginDetection | null {
  try {
    if (!gitBinaryAvailable() || !isInsideWorkTree(projectRoot)) {
      return null;
    }

    for (const p of PATTERNS) {
      if (!p.gitTrackedPaths || p.gitTrackedPaths.length === 0) {
        continue;
      }

      for (const trackedPath of p.gitTrackedPaths) {
        const result = spawnSync(
          'git',
          ['ls-files', '--error-unmatch', '--', trackedPath],
          { cwd: projectRoot, timeout: 5000, encoding: 'utf8' },
        );

        if (!result.error && result.status === 0) {
          return { pattern: p.pattern, version: null, source: 'git' };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
