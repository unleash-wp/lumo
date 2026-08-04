/**
 * Hook catch runner, thin ESM bridge called by the PreToolUse hook.
 *
 * Exposes runHookCatch() through a stable import surface so the CJS hook can
 * call it via dynamic import() without pulling in MCP/transport deps.
 *
 * Snapshot loading: this module loads the snapshot using its own import.meta.url
 * so the path is correct whether the module runs from source (src/hook/) or from
 * the compiled bundle (dist/hook-catch.mjs). It injects the loaded snapshot into
 * checkCode() to avoid the double-load that would happen if checkCode() called
 * loadSnapshot() with its own (different) relative path.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { checkCodeWithGaps } from '../detection/catch.js';
import {
  formatCatch,
  CATCH_NEUTRAL_LINE,
  CATCH_DID_NOT_RUN_LINE,
  buildCodeProTeaser,
  buildCodeDetectionNote,
  buildCodeProTeaserShort,
  buildCodeProGapLine,
  joinPluginNames,
} from '../lib/render.js';
import { validateEntry } from '../lib/snapshot.js';
import { hasSeenProTeaser, markProTeaserSeen } from '../lib/events.js';
import type { CatchTier, CatchOverrides } from '../detection/catch.js';
import type { Snapshot } from '../types.js';

export interface HookCatchResult {
  /** Highest tier seen across all results (LOUD > SOFT > none). */
  tier: CatchTier | null;
  /** Formatted Markdown for the finding, neutral result, or unavailable scan. */
  message: string;
  /** Raw result count per tier. */
  loudCount: number;
  softCount: number;
  /** True when the hook could not produce a verdict. */
  didNotRun: boolean;
  /** True when the code touched knowledge that Free cannot check. */
  hasCoverageGap: boolean;
}

function didNotRunResult(): HookCatchResult {
  return {
    tier: null,
    message: CATCH_DID_NOT_RUN_LINE,
    loudCount: 0,
    softCount: 0,
    didNotRun: true,
    hasCoverageGap: false,
  };
}

function noFindingResult(message: string, hasCoverageGap: boolean): HookCatchResult {
  return {
    tier: null,
    message,
    loudCount: 0,
    softCount: 0,
    didNotRun: false,
    hasCoverageGap,
  };
}

// ---------------------------------------------------------------------------
// Snapshot loading, relative to THIS module's location at bundle time.
//
// When bundled: import.meta.url = dist/hook-catch.mjs → ../data/snapshot.json
// When in src:  import.meta.url = src/hook/catch-runner.ts → ../../data/snapshot.json
//
// We try ../data first (bundle layout), then ../../data (source layout), then
// fail-open so the hook never crashes the developer's session.
// ---------------------------------------------------------------------------

function loadSnapshotForHook(): Snapshot | null {
  const base = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(base, '../data/snapshot.json'),    // dist/hook-catch.mjs → dist/../data
    join(base, '../../data/snapshot.json'), // src/hook/catch-runner.ts → src/hook/../../data
  ];

  for (const candidate of candidates) {
    try {
      const raw = JSON.parse(readFileSync(candidate, 'utf8')) as Record<string, unknown>;
      if (raw['schemaVersion'] !== 1 || !Array.isArray(raw['entries'])) continue;
      (raw['entries'] as unknown[]).forEach((e, i) => validateEntry(e, i));
      return raw as unknown as Snapshot;
    } catch {
      // Try next candidate
    }
  }
  return null;
}

// Loaded once at module-init time; null means fail-open (no snapshot available).
const SNAPSHOT: Snapshot | null = loadSnapshotForHook();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scan a code blob for WordPress/WooCommerce issues.
 *
 * Language is auto-detected when not provided. Fail-open: any uncaught error
 * returns a DID NOT RUN result so the hook never blocks on an internal crash.
 * The same result is returned when the snapshot could not be loaded.
 *
 * overrides: per-project catch config from .claude/.lumo.json (optional).
 * When provided, disabled rules are filtered out and downgraded rules are
 * capped before the tier decision is made. Omitting overrides keeps the
 * baseline behaviour byte-identical to the previous behaviour.
 */
export function runHookCatch(
  code: string,
  language: 'php' | 'js' | 'auto' = 'auto',
  overrides?: CatchOverrides,
  /**
   * Where the teaser-seen marker lives. Omitted in production (resolves to the
   * user's state dir); tests MUST pass a temp dir, without it a test run writes
   * into the developer's real state and silently mutes their next teaser.
   */
  stateDir?: string,
): HookCatchResult {
  if (!SNAPSHOT) {
    return didNotRunResult();
  }

  try {
    // Inject the pre-loaded snapshot so checkCode() does not re-resolve paths.
    // Thread overrides so disabled/downgraded rules are applied before the
    // tier decision reaches the hook.
    const { results, proGaps, didNotRun } = checkCodeWithGaps(code, language, SNAPSHOT, overrides);
    if (didNotRun) {
      return didNotRunResult();
    }

    if (results.length === 0) {
      // Pro-only knowledge was hit: name EVERY touched plugin. The hook stays
      // non-blocking (tier null), but silence here (on any of them) would be
      // a false all-clear at the keyboard.
      if (proGaps.length > 0) {
        const covered = proGaps.filter((g) => g.hasProCoverage).map((g) => g.pluginName);
        const uncovered = proGaps.filter((g) => !g.hasProCoverage).map((g) => g.pluginName);
        const parts: string[] = [];
        if (covered.length > 0) {
          // Full teaser once per plugin and install, short line after that:
          // the gap stays named, the sales copy does not repeat. One unseen
          // plugin in the set is reason enough for the full form.
          const anyUnseen = covered.some((n) => !hasSeenProTeaser(n, stateDir));
          const joined = joinPluginNames(covered);
          parts.push(anyUnseen ? buildCodeProTeaser(joined) : buildCodeProTeaserShort(joined));
          for (const n of covered) markProTeaserSeen(n, stateDir);
        }
        if (uncovered.length > 0) {
          parts.push(buildCodeDetectionNote(joinPluginNames(uncovered)));
        }
        return noFindingResult(parts.join('\n\n'), true);
      }
      return noFindingResult(CATCH_NEUTRAL_LINE, false);
    }

    const loudCount = results.filter((r) => r.tier === 'LOUD').length;
    const softCount = results.filter((r) => r.tier === 'SOFT').length;

    // checkCode() already sorts LOUD before SOFT
    const top = results[0]!;
    // Findings present AND a Pro-only signal fired: name the gap here too, or the
    // hook shows a finding that reads as the whole answer. Deliberately NOT
    // throttled like the teaser: the teaser is the pitch, this is the honesty,
    // and silencing honesty on repeat edits would restore the false all-clear.
    const message =
      proGaps.length > 0
        ? `${formatCatch(top)}\n\n${buildCodeProGapLine(joinPluginNames(proGaps.map((g) => g.pluginName)))}`
        : formatCatch(top);

    return {
      tier: top.tier,
      message,
      loudCount,
      softCount,
      didNotRun: false,
      hasCoverageGap: proGaps.length > 0,
    };
  } catch {
    return didNotRunResult();
  }
}
