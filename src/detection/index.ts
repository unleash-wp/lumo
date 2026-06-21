import { loadSnapshot, findByCategory } from '../lib/snapshot.js';
import { renderFree } from '../lib/render.js';
import { detectFromComposer } from './composer.js';
import { detectFromDirectory } from './directory.js';
import { detectFromWpCli } from './wp-cli.js';
import { detectFromSource } from './heuristic.js';
import type { PluginDetection } from './types.js';
import type { FreeRenderedEntry, Snapshot } from '../types.js';

export type { PluginDetection, DetectionSource } from './types.js';

export interface AuditResult {
  detected: boolean;
  detection?: PluginDetection;
  entry?: FreeRenderedEntry;
  message?: string;
}

const NEUTRAL_NO_MATCH =
  "No WooCommerce detected in this project. Lumo's HPOS guardrail is WooCommerce-specific — nothing to check here.";

/**
 * Run the fail-open detection ladder: composer → directory → wp-cli → heuristic.
 * Stops at the first non-null result. NEVER throws.
 */
export function detectStack(projectRoot: string): PluginDetection | null {
  return (
    detectFromComposer(projectRoot) ??
    detectFromDirectory(projectRoot) ??
    detectFromWpCli(projectRoot) ??
    detectFromSource(projectRoot)
  );
}

/**
 * Detect WooCommerce in `projectRoot` and, when found, look up and render the
 * matching HPOS snapshot entry.
 *
 * Slug `woocommerce` → category_slug `woocommerce` → first matched entry.
 * No detection or no matching entry → `{ detected: false, message: <neutral> }`.
 * NEVER throws, NEVER blocks.
 */
export function auditProject(projectRoot: string, snapshot?: Snapshot): AuditResult {
  try {
    const detection = detectStack(projectRoot);
    if (!detection) {
      return { detected: false, message: NEUTRAL_NO_MATCH };
    }

    const snap = snapshot ?? loadSnapshot();
    // slug `woocommerce` maps to category_slug `woocommerce`
    const matches = findByCategory(snap, detection.slug);
    if (matches.length === 0) {
      return { detected: false, message: NEUTRAL_NO_MATCH };
    }

    const snapshotEntry = matches[0]!;
    const entry = renderFree(snapshotEntry);

    return { detected: true, detection, entry };
  } catch {
    return { detected: false, message: NEUTRAL_NO_MATCH };
  }
}
