/**
 * Blob-in catch engine — the precision model (phase 00) + matcher (phase 01).
 *
 * Entry points
 *   classify()    — pure decision function; maps (entry, signal) → tier
 *   checkCode()   — scan a raw blob or unified diff, return ranked CatchResult[]
 *
 * Contracts
 *   - Never throws (fail-open: any exception yields an empty catch list)
 *   - No Date.now() / Math.random() — all dates come from entry data
 *   - snapshot-injectable for deterministic unit tests
 *   - Does NOT touch lumo_audit / sourceSignals / project-scan paths
 */

import { loadSnapshot, findEntry } from '../lib/snapshot.js';
import { PATTERNS } from './registry.js';
import type { CatchSignal } from './registry.js';
import type { SnapshotEntry, Snapshot } from '../types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CatchTier = 'LOUD' | 'SOFT' | 'SILENT';

export interface VersionFact {
  /** 'woo' | 'wp' */
  field: 'woo' | 'wp';
  /** The version string, e.g. "8.2" or "6.4.0" */
  value: string;
  /** ISO date string from entry.updatedAt */
  date: string;
  /** Whether the entry marks this as breaking */
  breaking: boolean;
}

export interface CatchResult {
  tier: CatchTier;
  entry: SnapshotEntry;
  signal: CatchSignal;
  /** Present when tier is LOUD — the dated version anchor. */
  versionFact?: VersionFact;
  /** Present when tier is SOFT for a CONTEXT_DEPENDENT signal. */
  condition?: string;
}

// ---------------------------------------------------------------------------
// Phase 00: classify() — the pure decision function
//
// Three-guard LOUD rule (all three must hold):
//   1. Signal class is CERTAIN
//   2. Entry carries a non-null version min (wp or woo)
//   3. That version row has breaking_change === true
//
// Empty-version-slot fallback: if guard 2 or 3 fails, the LOUD template has
// nothing to interpolate, so it structurally cannot fire — we degrade to SOFT.
// This is a data-level guarantee, not a runtime check that can be forgotten.
// ---------------------------------------------------------------------------

export function classify(
  entry: SnapshotEntry,
  signal: CatchSignal,
  shimPresent: boolean,
): { tier: CatchTier; versionFact?: VersionFact; condition?: string } {
  // REPO_STATE signals on a bare blob → always SILENT (domain of lumo_audit)
  if (signal.class === 'REPO_STATE') {
    return { tier: 'SILENT' };
  }

  // CONTEXT_DEPENDENT → always SOFT, with the condition stated
  if (signal.class === 'CONTEXT_DEPENDENT') {
    return { tier: 'SOFT', condition: signal.condition };
  }

  // CERTAIN from here — but first check for shim/polyfill guard
  if (shimPresent) {
    return { tier: 'SOFT', condition: 'this call is inside a shim or compatibility wrapper' };
  }

  // Find the first version row with a non-null version min
  const vRow = entry.versions.find(
    (v) => v.woo_version_min != null || v.wp_version_min != null,
  );

  if (!vRow) {
    // No version stamp — structurally barred from LOUD
    return { tier: 'SOFT' };
  }

  // Determine the version field and value
  const field: 'woo' | 'wp' = vRow.woo_version_min != null ? 'woo' : 'wp';
  const value = (field === 'woo' ? vRow.woo_version_min : vRow.wp_version_min) as string;

  const versionFact: VersionFact = {
    field,
    value,
    date: entry.updatedAt,
    breaking: vRow.breaking_change,
  };

  if (vRow.breaking_change) {
    return { tier: 'LOUD', versionFact };
  }

  // Version stamp present but not breaking → SOFT
  return { tier: 'SOFT', versionFact };
}

// ---------------------------------------------------------------------------
// Strip helpers for CERTAIN signal matching.
//
// Two variants are pre-computed once and selected per signal:
//
//   strippedComments  — comments blanked, quoted strings kept intact.
//                       Used by signals whose match target IS a string literal
//                       (e.g. 'shop_order', 'sk_live_'). Stripping the string
//                       body would erase the very signal being detected.
//
//   strippedAll       — comments AND quoted string bodies blanked.
//                       Used by call-pattern signals whose match target is a
//                       function name with an open paren. A function name
//                       inside a string literal is not a call; keeping the
//                       string body causes false-LOUD fires on error messages,
//                       log strings, and PHP heredocs that name the old API.
//
// Signals opt into the aggressive variant via `signal.stripStrings === true`.
// ---------------------------------------------------------------------------

function stripComments(code: string): string {
  // Block comments: /* … */ (PHP + JS)
  let out = code.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));
  // Single-line comments: // … and PHP # …
  out = out.replace(/(?:\/\/|#)[^\n]*/g, (m) => ' '.repeat(m.length));
  return out;
}

function stripCommentsAndStrings(code: string): string {
  // Strip comments first so quote chars inside comments don't confuse the
  // string scanner.
  const noComments = stripComments(code);
  // Replace single-quoted, double-quoted, and backtick string bodies with
  // spaces. The opener and closer delimiters are kept so surrounding syntax
  // remains parseable. Handles escaped delimiters (\' \") inside strings.
  // Does NOT handle heredoc/nowdoc — those are rare and the string body is
  // already unlikely to produce a false-LOUD (no open paren follows the name).
  return noComments.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
    (m) => m[0] + ' '.repeat(Math.max(0, m.length - 2)) + m[m.length - 1],
  );
}

// ---------------------------------------------------------------------------
// Diff-mode filter: keep only added lines (lines starting with '+', excluding
// the '+++' file header). Plain blobs are returned unchanged.
//
// Detection heuristic: a unified diff starts with 'diff --git', contains
// the '--- ' / '+++ ' header pair, or contains a raw hunk header ('@@').
// Raw hunks without file headers are valid unified diff output (e.g. from
// 'git diff --no-index', clipboard pastes, AI before/after blocks). Without
// this check, removed '-' lines in a raw hunk would be scanned as plain code
// and fire LOUD on code the developer is deleting — a false accusation.
// ---------------------------------------------------------------------------

function filterDiffAddedLines(code: string): string {
  const isDiff =
    code.startsWith('diff ') ||
    (code.includes('\n--- ') && code.includes('\n+++ ')) ||
    code.startsWith('--- ') ||
    code.startsWith('@@ ') ||
    code.includes('\n@@ ');

  if (!isDiff) {
    return code;
  }

  return code
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1))
    .join('\n');
}

// ---------------------------------------------------------------------------
// Language auto-detection
// ---------------------------------------------------------------------------

type Language = 'php' | 'js';

function detectLanguage(code: string): Language {
  const phpScore =
    (code.includes('<?php') ? 3 : 0) +
    (code.includes('->') ? 1 : 0) +
    (/\$\w/.test(code) ? 2 : 0) +
    (code.includes('function_exists') ? 1 : 0);

  const jsScore =
    (code.includes('import ') ? 2 : 0) +
    (code.includes('registerBlockType') ? 3 : 0) +
    (code.includes('=>') ? 1 : 0) +
    (code.includes('const ') ? 1 : 0) +
    (code.includes('apiVersion') ? 2 : 0);

  return phpScore >= jsScore ? 'php' : 'js';
}

// ---------------------------------------------------------------------------
// Token cap — first 2 000 lines of the input
// ---------------------------------------------------------------------------

const INPUT_LINE_CAP = 2_000;

function capInput(code: string): string {
  const lines = code.split('\n');
  if (lines.length <= INPUT_LINE_CAP) return code;
  return lines.slice(0, INPUT_LINE_CAP).join('\n');
}

// ---------------------------------------------------------------------------
// Per-project catch overrides — loaded from .claude/.lumo.json catch section.
//
// Schema:
//   { "catch": { "disable": ["<slug>", ...], "downgrade": { "<slug>": "soft" } } }
//
//   disable  — slugs that must not appear in results at all.
//   downgrade — slug → "soft": caps a LOUD result to SOFT. Unknown values are
//               treated as no-op so future additions are safe with old code.
//
// No config / missing catch key = behaviour is byte-identical to baseline.
// ---------------------------------------------------------------------------

export interface CatchOverrides {
  /** Entry slugs that are completely suppressed — removed from results. */
  disable?: string[];
  /**
   * Per-slug tier cap. Currently only "soft" is meaningful: a LOUD finding for
   * that slug is downgraded to SOFT. Unknown values are treated as a no-op.
   */
  downgrade?: Record<string, string>;
}

/**
 * Apply project-level catch overrides to a finished results list.
 *
 * Called after the full catch pipeline so the baseline contracts (shim guards,
 * version facts, deduplication) are unaffected. Override logic runs at the
 * result boundary only.
 */
export function applyCatchOverrides(
  results: CatchResult[],
  overrides: CatchOverrides | undefined,
): CatchResult[] {
  if (!overrides) return results;

  const disabled = new Set(overrides.disable ?? []);
  const downgrade = overrides.downgrade ?? {};

  return results
    .filter((r) => !disabled.has(r.entry.slug))
    .map((r) => {
      const cap = downgrade[r.entry.slug];
      if (cap === 'soft' && r.tier === 'LOUD') {
        return { ...r, tier: 'SOFT' as CatchTier };
      }
      return r;
    });
}

// ---------------------------------------------------------------------------
// Phase 01: checkCode() — pure, snapshot-injectable
// ---------------------------------------------------------------------------

const CATCH_CAP = 3;

export function checkCode(
  code: string,
  language: 'php' | 'js' | 'auto' = 'auto',
  snapshot?: Snapshot,
  overrides?: CatchOverrides,
): CatchResult[] {
  try {
    const snap = snapshot ?? loadSnapshot();

    // 1. Normalize input
    const capped = capInput(code);
    const diffFiltered = filterDiffAddedLines(capped);

    const lang: Language = language === 'auto' ? detectLanguage(diffFiltered) : language;

    // Two stripped variants, computed once and selected per signal:
    //   strippedComments  — strings intact (for literal-content signals like 'shop_order')
    //   strippedAll       — strings also blanked (for call-pattern signals like func_name()
    //                       where a mention inside a string is not an actual call)
    const strippedComments = stripComments(diffFiltered);
    const strippedAll = stripCommentsAndStrings(diffFiltered);

    // Collect all catch signals from the registry for the detected language
    const allSignals: CatchSignal[] = [];
    for (const pattern of PATTERNS) {
      for (const sig of pattern.catchSignals ?? []) {
        if (sig.language === lang || lang === undefined) {
          allSignals.push(sig);
        }
      }
    }

    // 2. Run each signal against the blob
    const seen = new Map<string, CatchResult>(); // keyed by entrySlug

    for (const signal of allSignals) {
      // Select test blob per signal:
      //   CERTAIN + stripStrings → strip both comments and string bodies
      //   CERTAIN (no stripStrings) → strip comments only (string literals are the signal)
      //   non-CERTAIN → raw diff-filtered blob (context needed for shim guards etc.)
      const testBlob =
        signal.class !== 'CERTAIN'
          ? diffFiltered
          : signal.stripStrings
            ? strippedAll
            : strippedComments;
      const hit =
        typeof signal.match === 'string'
          ? testBlob.includes(signal.match)
          : signal.match.test(testBlob);

      if (!hit) continue;

      const entry = findEntry(snap, signal.entrySlug);
      if (!entry) continue;

      // Check suppress-guard: if the correct form is already present, fire nothing.
      // Used for absence-in-presence signals (the flag we expect to be missing is there).
      if (signal.suppressGuard && signal.suppressGuard.test(diffFiltered)) continue;

      // Check shim guard on the original (non-stripped) blob
      const shimPresent = signal.shimGuard ? signal.shimGuard.test(diffFiltered) : false;

      const result = classify(entry, signal, shimPresent);
      const tier = result.tier;

      if (tier === 'SILENT') continue;

      const catchResult: CatchResult = {
        tier,
        entry,
        signal,
        versionFact: result.versionFact,
        condition: result.condition,
      };

      // Dedupe by entrySlug — keep the highest tier (LOUD > SOFT)
      const existing = seen.get(signal.entrySlug);
      if (!existing || tierRank(tier) > tierRank(existing.tier)) {
        seen.set(signal.entrySlug, catchResult);
      }
    }

    // 3. Sort LOUD before SOFT, cap at CATCH_CAP, then apply project overrides
    const raw = [...seen.values()]
      .sort((a, b) => tierRank(b.tier) - tierRank(a.tier))
      .slice(0, CATCH_CAP);

    return applyCatchOverrides(raw, overrides);
  } catch {
    return [];
  }
}

function tierRank(tier: CatchTier): number {
  return tier === 'LOUD' ? 2 : tier === 'SOFT' ? 1 : 0;
}
