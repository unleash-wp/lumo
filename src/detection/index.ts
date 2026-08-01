import { existsSync, statSync } from 'node:fs';
import { loadSnapshot, findByCategory } from '../lib/snapshot.js';
import { renderFree } from '../lib/render.js';
import { detectFromComposer } from './composer.js';
import { detectFromDirectory } from './directory.js';
import { detectFromWpCli } from './wp-cli.js';
import { detectFromSourceOutcome } from './heuristic.js';
import { detectFromGitTracked } from './git.js';
import { PATTERNS } from './registry.js';
import type { PluginDetection } from './types.js';
import type { FreeRenderedEntry, Snapshot } from '../types.js';

export type { PluginDetection, DetectionSource } from './types.js';

/**
 * Upgrade-promising teaser, only shown when Pro has real curated knowledge for
 * the plugin (hasProCoverage: true on the registry entry). No bluff, no invented checks.
 *
 * Named plugins in the closing line are those with hasProCoverage: true in registry.ts.
 * Keep the list honest, only add a plugin here once Pro has a published entry for it.
 */
export function buildProTeaser(pluginName: string): string {
  return (
    `Detected ${pluginName} in this project. ` +
    `Your AI's training data is stale on ${pluginName}'s current hooks and APIs. ` +
    `Lumo Free can't check it: ${pluginName} is covered by neither the free tier nor the WordPress agent skills. ` +
    `Lumo Pro extends the catch to your premium plugins: ACF Pro, Gravity Forms, Elementor Pro, ` +
    `Meta Box, Carbon Fields, and WooCommerce Subscriptions.`
  );
}

/**
 * Honest detection note for plugins Lumo has detected but Pro does not yet cover.
 * Surfaces detection as a demand signal without making a promise that would be broken.
 */
export function buildDetectionNote(pluginName: string): string {
  return (
    `Detected ${pluginName} in this project. ` +
    `Lumo does not yet have curated knowledge for ${pluginName}. No checks to run here.`
  );
}

export interface AuditResult {
  detected: boolean;
  detection?: PluginDetection;
  entry?: FreeRenderedEntry;
  /**
   * Set when a Pro-teaser pattern was detected AND Pro has curated knowledge
   * (hasProCoverage: true). The upgrade promise is honest, callers surface
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

// Two sentences, because two different things happen and only one of them is
// an answer. The old single line said "No known WordPress risk patterns
// detected in this project. Nothing to check here." for both, which asserted a
// project-wide result and told the caller to stop. It was also the only
// no-match surface in the product without the caveat ACTION_NO_MATCH_LINE and
// CATCH_NEUTRAL_LINE carry.
const NEUTRAL_NO_MATCH =
  'Lumo matched this project against the patterns it detects and none of them ' +
  'applied. That covers the stacks Lumo knows how to spot, not the code inside ' +
  'them, so this is not an all-clear.';

/**
 * Same scope statement as NEUTRAL_NO_MATCH, but the heuristic step of the
 * ladder stopped at its own file budget before it finished reading the
 * project. That is not "read everything, matched nothing": some of the
 * project was never looked at, and this line says so instead of letting a
 * budget limit read as a clean result on the files it never reached.
 */
const NEUTRAL_NO_MATCH_INCOMPLETE =
  'Lumo matched this project against the patterns it detects and none of them ' +
  'applied in the files it read. The heuristic scan stopped at its own file ' +
  'budget before covering the whole project, so this is not a full-project ' +
  'all-clear.';

/** The project could not be read at all. Naming the path is what makes it fixable. */
export const unreadableProjectLine = (root: string): string =>
  `Lumo could not read a project at ${root}. Nothing was checked, so this says ` +
  'nothing about the code there. Check the path and call again.';

/**
 * Run the fail-open detection ladder: composer → directory → wp-cli → heuristic → git-tracked.
 * Stops at the first non-null result. NEVER throws.
 */
export function detectStack(projectRoot: string): PluginDetection | null {
  return detectStackWithLimits(projectRoot).detection;
}

export interface StackDetectionOutcome {
  detection: PluginDetection | null;
  /**
   * True only when every step of the ladder found nothing AND the heuristic
   * step stopped at its file budget rather than reading the whole project.
   * auditProject() uses this to tell "scanned everything, no match" apart
   * from "stopped scanning before finishing, no match yet".
   */
  incomplete: boolean;
}

/**
 * Same ladder as detectStack(), but keeps the heuristic step's own budget
 * signal instead of collapsing it into a plain null. Used by auditProject()
 * so a budget-limited miss and a full-project miss get different wording.
 */
export function detectStackWithLimits(projectRoot: string): StackDetectionOutcome {
  const composer = detectFromComposer(projectRoot);
  if (composer) return { detection: composer, incomplete: false };
  const directory = detectFromDirectory(projectRoot);
  if (directory) return { detection: directory, incomplete: false };
  const wpCli = detectFromWpCli(projectRoot);
  if (wpCli) return { detection: wpCli, incomplete: false };
  const heuristic = detectFromSourceOutcome(projectRoot);
  if (heuristic.detection) return { detection: heuristic.detection, incomplete: false };
  const git = detectFromGitTracked(projectRoot);
  if (git) return { detection: git, incomplete: false };
  return { detection: null, incomplete: heuristic.incomplete };
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
    // A path we cannot read is not a project with nothing in it. Deciding this
    // before the ladder runs keeps the two states apart at the source, rather
    // than letting both fall through to the same neutral sentence.
    if (!existsSync(projectRoot) || !statSync(projectRoot).isDirectory()) {
      return { detected: false, message: unreadableProjectLine(projectRoot) };
    }

    const { detection, incomplete } = detectStackWithLimits(projectRoot);
    if (!detection) {
      return { detected: false, message: incomplete ? NEUTRAL_NO_MATCH_INCOMPLETE : NEUTRAL_NO_MATCH };
    }

    // Pro-teaser path: plugin detected but Free has no knowledge for it.
    // Only promise an upgrade when Pro actually has coverage (hasProCoverage: true).
    // Plugins without coverage get an honest detection note, no upgrade CTA.
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
