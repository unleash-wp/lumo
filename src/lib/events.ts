import { appendFileSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Event/activation contract — W2 local seam. W3 (FA-30/31) extends, not replaces.
//
// Invariants every caller and future W3 extension must honour:
//   1. 'activation' requires target:'own' + gated:true. A sample save is
//      'onboarded', never 'activation'. Enforced by isActivation().
//   2. 'no_target' is its own distinct state — not a missing activation, not
//      churn. Firing false 'activation' on a clean repo is forbidden.
//   3. 'variant' rides every event from install onward so any event can be
//      segmented by A/B arm without a separate lookup.
//   4. Append-only JSON-lines. Readers must tolerate trailing/partial lines
//      (fail-open). No network transport in W2 — local store only.
//   5. 'gated:true' is hard-coded for own-code HPOS catches in W2 because
//      every Free HPOS catch withholds the version matrix and verified fix.
//      W3's scoreboard generalises the gating predicate; update that comment
//      when it does.
// ---------------------------------------------------------------------------

/**
 * Closed set for W2.
 * W3 (FA-30/31) adds: 'pql_gated_touch' | 'checkout_started' |
 * 'checkout_completed' | 'prompt_suppressed'.
 */
export type LumoEventType =
  | 'install'      // first-ever run on this machine
  | 'onboarded'    // beat 1 shown (the teaching save) — NOT activation
  | 'activation'   // first depth-gated HPOS catch on the dev's OWN code
  | 'no_target';   // clean repo: sample shown, no own-code Woo order target

/** A/B arm for the auto-vs-discover onboarding lever. Assigned once at install, then immutable. */
export type OnboardVariant = 'A' | 'B';

/** One append-only record. snake_case matches snapshot/types.ts house style. */
export interface LumoEvent {
  type: LumoEventType;
  /** ISO 8601. Caller injects so pure builders stay deterministic and testable. */
  at: string;
  /** Stamped on every event so any event can be segmented by A/B arm. */
  variant: OnboardVariant;
  /** Only meaningful on 'activation' & 'no_target'. */
  target?: 'own' | 'sample';
  /** Whether the answer was depth-gated (Free withholds version matrix + verified fix). */
  gated?: boolean;
  /** ms from install marker to this event — drives time-to-aha reporting. Optional in W2. */
  ms_since_install?: number;
}

/** Pure builder — no Date.now, no I/O. Deterministic and unit-testable. */
export function buildEvent(input: {
  type: LumoEventType;
  at: string;
  variant: OnboardVariant;
  target?: 'own' | 'sample';
  gated?: boolean;
  ms_since_install?: number;
}): LumoEvent {
  const event: LumoEvent = {
    type: input.type,
    at: input.at,
    variant: input.variant,
  };
  if (input.target !== undefined) event.target = input.target;
  if (input.gated !== undefined) event.gated = input.gated;
  if (input.ms_since_install !== undefined) event.ms_since_install = input.ms_since_install;
  return event;
}

/**
 * Activation predicate — the single definition beat 2, no-target, and every
 * W3 dashboard key off. Activation = own-code, depth-gated HPOS catch.
 * Sample interactions NEVER satisfy it.
 */
export function isActivation(e: {
  type: LumoEventType;
  target?: 'own' | 'sample';
  gated?: boolean;
}): boolean {
  return e.type === 'activation' && e.target === 'own' && e.gated === true;
}

/** Resolve the state directory for this plugin. */
export function resolveStateDir(): string {
  const pluginData = process.env['CLAUDE_PLUGIN_DATA'];
  return pluginData ?? join(homedir(), '.lumo');
}

const EVENTS_FILE = 'events.jsonl';
const VARIANT_FILE = 'variant';

/**
 * Append one JSON line to the local event log.
 * Never throws — mirrors auditProject's fail-open contract.
 */
export function recordEvent(e: LumoEvent, stateDir?: string): void {
  try {
    const dir = stateDir ?? resolveStateDir();
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, EVENTS_FILE), JSON.stringify(e) + '\n', 'utf8');
  } catch {
    // fail-open: a bad dir or permission error must not interrupt a value path
  }
}

/**
 * Returns true once an 'install' line has been written to the event log.
 * Gates first-run detection. Never throws.
 */
export function hasOnboarded(stateDir?: string): boolean {
  try {
    const dir = stateDir ?? resolveStateDir();
    const raw = readFileSync(join(dir, EVENTS_FILE), 'utf8');
    const lines = raw.split('\n').filter((l) => l.trim().length > 0);
    for (const line of lines) {
      try {
        const parsed: unknown = JSON.parse(line);
        if (
          parsed !== null &&
          typeof parsed === 'object' &&
          'type' in parsed &&
          (parsed as { type: unknown }).type === 'install'
        ) {
          return true;
        }
      } catch {
        // tolerate partial or garbage trailing lines — fail-open
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Read or assign the persisted A/B variant. Write-once: on first call a random
 * 50/50 draw is persisted; subsequent calls return that same value.
 * Defaults to 'A' on any read or write failure. Never throws.
 */
export function getOrAssignVariant(stateDir?: string): OnboardVariant {
  try {
    const dir = stateDir ?? resolveStateDir();
    mkdirSync(dir, { recursive: true });
    const variantPath = join(dir, VARIANT_FILE);
    try {
      const stored = readFileSync(variantPath, 'utf8').trim();
      if (stored === 'A' || stored === 'B') return stored;
    } catch {
      // file absent — assign now
    }
    const assigned: OnboardVariant = Math.random() < 0.5 ? 'A' : 'B';
    writeFileSync(variantPath, assigned, 'utf8');
    return assigned;
  } catch {
    return 'A';
  }
}
