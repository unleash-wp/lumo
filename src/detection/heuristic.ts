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

export interface HeuristicOutcome {
  detection: PluginDetection | null;
  /**
   * True when the scan stopped at MAX_FILES before covering the whole
   * project and found no signal in what it did read. A null detection here
   * is not "this project has none of the patterns Lumo detects"; it is "Lumo
   * stopped reading before finishing", and a caller that renders the two the
   * same way turns a coverage limit into a verdict on the rest of the tree.
   */
  incomplete: boolean;
}

/**
 * Last-resort heuristic detector: scan the project's own PHP files for strong
 * pattern signals. Bounded by MAX_FILES and MAX_DEPTH so it stays fast.
 *
 * Returns a detection with version null when any signal is found; else null,
 * alongside whether the file budget was exhausted before a full read.
 * NEVER throws.
 */
export function detectFromSourceOutcome(projectRoot: string): HeuristicOutcome {
  try {
    const fileCount = { n: 0 };
    const matched = scanForSignals(projectRoot, 0, fileCount);
    if (matched === null) {
      return { detection: null, incomplete: fileCount.n >= MAX_FILES };
    }
    return { detection: { pattern: matched, version: null, source: 'heuristic' }, incomplete: false };
  } catch {
    return { detection: null, incomplete: false };
  }
}

/**
 * Thin wrapper over detectFromSourceOutcome() for callers that only need the
 * detection itself. Prefer detectFromSourceOutcome() where a null result
 * must be told apart from a budget-limited one (see auditProject).
 */
export function detectFromSource(projectRoot: string): PluginDetection | null {
  return detectFromSourceOutcome(projectRoot).detection;
}
