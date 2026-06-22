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
 * Return true when `path` is tracked by git in `projectRoot`.
 * Runs: git ls-files --error-unmatch -- <path>
 * Exit 0 ⟹ tracked. Any error or non-zero exit ⟹ false.
 */
function isTracked(projectRoot: string, path: string): boolean {
  try {
    const result = spawnSync('git', ['ls-files', '--error-unmatch', '--', path], {
      cwd: projectRoot,
      timeout: 5000,
      encoding: 'utf8',
    });
    return !result.error && result.status === 0;
  } catch {
    return false;
  }
}

/**
 * Unified git-tracked detector.
 *
 * A pattern matches when:
 *   - every `gitTrackedPaths` entry IS tracked in git, AND
 *   - every `gitMissingPaths` entry is NOT tracked in git.
 *
 * Patterns with no `gitTrackedPaths` are skipped (they use other detectors).
 *
 * Examples:
 *   env-in-git:             { gitTrackedPaths: ['.env'] }
 *     → matches when .env is tracked
 *   wordpress-dependencies: { gitTrackedPaths: ['composer.json'], gitMissingPaths: ['composer.lock'] }
 *     → matches when composer.json tracked AND composer.lock NOT tracked
 *
 * Fail-open: git absent, not a repo, any git error → null, never throws.
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

      // All required-tracked paths must be tracked.
      const allTracked = p.gitTrackedPaths.every((path) => isTracked(projectRoot, path));
      if (!allTracked) {
        continue;
      }

      // All required-absent paths must NOT be tracked.
      const missingPaths = p.gitMissingPaths ?? [];
      const allAbsent = missingPaths.every((path) => !isTracked(projectRoot, path));
      if (!allAbsent) {
        continue;
      }

      return { pattern: p.pattern, version: null, source: 'git' };
    }

    return null;
  } catch {
    return null;
  }
}
