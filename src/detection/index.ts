import { loadSnapshot, findByCategory } from '../lib/snapshot.js';
import { renderFree } from '../lib/render.js';
import { detectFromComposer } from './composer.js';
import { detectFromDirectory } from './directory.js';
import { detectFromWpCli } from './wp-cli.js';
import { detectFromSource } from './heuristic.js';
import { detectFromGitTracked } from './git.js';
import { PATTERNS } from './registry.js';
import type { PluginDetection } from './types.js';
import type { FreeRenderedEntry, Snapshot } from '../types.js';

export type { PluginDetection, DetectionSource } from './types.js';

/**
 * Upgrade-promising teaser — only shown when Pro has real curated knowledge for
 * the plugin (hasProCoverage: true on the registry entry). No bluff, no invented checks.
 */
export function buildProTeaser(pluginName: string): string {
  return (
    `Detected ${pluginName} in this project. ` +
    `Lumo Pro extends Lumo's current-knowledge checks to your premium plugins — ` +
    `${pluginName} support is part of the Pro layer.`
  );
}

/**
 * Honest detection note for plugins Lumo has detected but Pro does not yet cover.
 * Surfaces detection as a demand signal without making a promise that would be broken.
 */
export function buildDetectionNote(pluginName: string): string {
  return (
    `Detected ${pluginName} in this project. ` +
    `Lumo does not yet have curated knowledge for ${pluginName} — no checks to run here.`
  );
}

export interface AuditResult {
  detected: boolean;
  detection?: PluginDetection;
  entry?: FreeRenderedEntry;
  /**
   * Set when a Pro-teaser pattern was detected AND Pro has curated knowledge
   * (hasProCoverage: true). The upgrade promise is honest — callers surface
   * this as the result.
   */
  proTeaser?: string;
  /**
   * Set when a plugin is detected but Pro has no curated knowledge for it yet.
   * Surfaces detection without making an upgrade promise. No upgrade CTA shown.
   */
  detectionNote?: string;
  message?: string;
}

const NEUTRAL_NO_MATCH =
  'No known WordPress risk patterns detected in this project — nothing to check here.';

/**
 * Run the fail-open detection ladder: composer → directory → wp-cli → heuristic → git-tracked.
 * Stops at the first non-null result. NEVER throws.
 */
export function detectStack(projectRoot: string): PluginDetection | null {
  return (
    detectFromComposer(projectRoot) ??
    detectFromDirectory(projectRoot) ??
    detectFromWpCli(projectRoot) ??
    detectFromSource(projectRoot) ??
    detectFromGitTracked(projectRoot)
  );
}

/**
 * Detect a registered pattern in `projectRoot` and, when found, look up and
 * render the matching snapshot entry.
 *
 * detection.pattern → category_slug → first matched entry.
 * Pro-teaser patterns: detected but no Free entry → returns proTeaser string.
 * No detection or no matching entry → `{ detected: false, message: <neutral> }`.
 * NEVER throws, NEVER blocks.
 */
export function auditProject(projectRoot: string, snapshot?: Snapshot): AuditResult {
  try {
    const detection = detectStack(projectRoot);
    if (!detection) {
      return { detected: false, message: NEUTRAL_NO_MATCH };
    }

    // Pro-teaser path: plugin detected but Free has no knowledge for it.
    // Only promise an upgrade when Pro actually has coverage (hasProCoverage: true).
    // Plugins without coverage get an honest detection note — no upgrade CTA.
    const def = PATTERNS.find((p) => p.pattern === detection.pattern);
    if (def?.proTeaser) {
      const name = def.proTeaserName ?? detection.pattern;
      if (def.hasProCoverage) {
        return { detected: true, detection, proTeaser: buildProTeaser(name) };
      }
      return { detected: true, detection, detectionNote: buildDetectionNote(name) };
    }

    const snap = snapshot ?? loadSnapshot();
    const matches = findByCategory(snap, detection.pattern);
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
