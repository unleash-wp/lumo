import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { PATTERNS } from './registry.js';
import type { PluginDetection } from './types.js';

// Build a flat signal→pattern lookup from the registry (patterns with sourceSignals only).
const SIGNAL_MAP: readonly { signal: string; pattern: string }[] = PATTERNS.flatMap((def) =>
  def.sourceSignals.map((signal) => ({ signal, pattern: def.pattern })),
);

const EXCLUDE_DIRS = new Set(['node_modules', 'vendor', '.git']);

const MAX_FILES = 200;
const MAX_DEPTH = 5;

/**
 * Search a bounded slice of .php files under `dir` for registered source signals.
 * Returns the matched pattern as soon as a signal is found; stays within file and depth caps.
 */
function scanForSignals(dir: string, depth: number, fileCount: { n: number }): string | null {
  if (depth > MAX_DEPTH || fileCount.n >= MAX_FILES) {
    return null;
  }

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return null;
  }

  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry)) {
      continue;
    }

    const fullPath = join(dir, entry);

    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      const hit = scanForSignals(fullPath, depth + 1, fileCount);
      if (hit !== null) {
        return hit;
      }
      continue;
    }

    if (extname(entry) !== '.php') {
      continue;
    }

    fileCount.n += 1;
    if (fileCount.n >= MAX_FILES) {
      return null;
    }

    try {
      const content = readFileSync(fullPath, 'utf8');
      for (const { signal, pattern } of SIGNAL_MAP) {
        if (content.includes(signal)) {
          return pattern;
        }
      }
    } catch {
      // Unreadable, skip
    }
  }

  return null;
}

/**
 * Last-resort heuristic detector: scan the project's own PHP files for strong
 * pattern signals. Bounded by MAX_FILES and MAX_DEPTH so it stays fast.
 *
 * Returns a detection with version null when any signal is found; else null.
 * NEVER throws.
 */
export function detectFromSource(projectRoot: string): PluginDetection | null {
  try {
    const matched = scanForSignals(projectRoot, 0, { n: 0 });
    if (matched === null) {
      return null;
    }
    return {
      pattern: matched,
      version: null,
      source: 'heuristic',
    };
  } catch {
    return null;
  }
}
