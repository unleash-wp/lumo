import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { PluginDetection } from './types.js';

// Strong WooCommerce signals — any one of these in a .php file is enough.
const WOO_SIGNALS = [
  'wc_get_order(',
  'WC_Order',
  'Automattic\\WooCommerce',
] as const;

const EXCLUDE_DIRS = new Set(['node_modules', 'vendor', '.git']);

const MAX_FILES = 200;
const MAX_DEPTH = 5;

/**
 * Search a bounded slice of .php files under `dir` for WooCommerce signals.
 * Returns true as soon as a signal is found; stays within file and depth caps.
 */
function scanForSignals(dir: string, depth: number, fileCount: { n: number }): boolean {
  if (depth > MAX_DEPTH || fileCount.n >= MAX_FILES) {
    return false;
  }

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return false;
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
      if (scanForSignals(fullPath, depth + 1, fileCount)) {
        return true;
      }
      continue;
    }

    if (extname(entry) !== '.php') {
      continue;
    }

    fileCount.n += 1;
    if (fileCount.n >= MAX_FILES) {
      return false;
    }

    try {
      const content = readFileSync(fullPath, 'utf8');
      for (const signal of WOO_SIGNALS) {
        if (content.includes(signal)) {
          return true;
        }
      }
    } catch {
      // Unreadable — skip
    }
  }

  return false;
}

/**
 * Last-resort heuristic detector: scan the project's own PHP files for strong
 * WooCommerce signals. Bounded by MAX_FILES and MAX_DEPTH so it stays fast.
 *
 * Returns a detection with version null when any signal is found; else null.
 * NEVER throws.
 */
export function detectFromSource(projectRoot: string): PluginDetection | null {
  try {
    const found = scanForSignals(projectRoot, 0, { n: 0 });
    if (!found) {
      return null;
    }
    return {
      slug: 'woocommerce',
      version: null,
      source: 'heuristic',
    };
  } catch {
    return null;
  }
}
