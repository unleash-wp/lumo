import { appendFileSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { PromptState, PromptVariant } from './prompt.js';
import { DEFAULT_PROMPT_STATE } from './prompt.js';

// ---------------------------------------------------------------------------
// Event/activation contract — canonical seam. W3 extends W2; do not fork.
//
// Invariants every caller and future extension must honour:
//   1. 'activation' requires target:'own' + gated:true. A sample save is
//      'onboarded', never 'activation'. Enforced by isActivation().
//   2. 'no_target' is its own distinct state — not a missing activation, not
//      churn. Firing false 'activation' on a clean repo is forbidden.
//   3. 'variant' rides every event from install onward so any event can be
//      segmented by A/B arm without a separate lookup.
//   4. Append-only JSON-lines. Readers must tolerate trailing/partial lines
//      (fail-open). No network transport — local store only.
//   5. 'gated:true' marks a depth-gated HPOS catch (Free withholds the version
//      matrix and verified fix). 'pql_gated_touch' counts these touches; the
//      scoreboard is derived by counting those lines — no second counter file.
//   6. Telemetry consent is persisted in a 'telemetry' file (sibling to
//      events.jsonl). Absent file = 'unset'. Never throws.
// ---------------------------------------------------------------------------

export type LumoEventType =
  | 'install'             // first-ever run on this machine
  | 'onboarded'           // beat 1 shown (the teaching save) — NOT activation
  | 'activation'          // first depth-gated HPOS catch on the dev's OWN code
  | 'no_target'           // clean repo: sample shown, no own-code Woo order target
  | 'pql_gated_touch'     // a gated HPOS catch happened; carries running gated_count
  | 'checkout_started'    // upgrade CTA clicked (emitted by W4; shape defined here)
  | 'checkout_completed'  // purchase confirmed (LS webhook reconciliation)
  | 'prompt_suppressed';  // session silenced (two ignores OR 12-tier consumed); local-only

/** A/B arm for the auto-vs-discover onboarding lever. Assigned once at install, then immutable. */
export type OnboardVariant = 'A' | 'B';

/** Tri-state telemetry consent persisted on disk. 'unset' means the file is absent. */
export type TelemetryConsent = 'granted' | 'declined' | 'unset';

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
  /** ms from install marker to this event — drives time-to-aha reporting. */
  ms_since_install?: number;
  /** Which surface produced a pql_gated_touch. */
  tool?: 'wp_check' | 'wp_knowledge';
  /** Running count of pql_gated_touch events at emit time. */
  gated_count?: number;
  /** Upgrade-copy A/B arm at checkout (filled by W4; field reserved here). */
  prompt_variant?: string;
  /** First-touch attribution channel on install. */
  source?: string;
  /** process.platform on install. */
  os?: string;
  /** Plugin version on install. */
  plugin_version?: string;
}

/** Pure builder — no Date.now, no I/O. Deterministic and unit-testable. */
export function buildEvent(input: {
  type: LumoEventType;
  at: string;
  variant: OnboardVariant;
  target?: 'own' | 'sample';
  gated?: boolean;
  ms_since_install?: number;
  tool?: 'wp_check' | 'wp_knowledge';
  gated_count?: number;
  prompt_variant?: string;
  source?: string;
  os?: string;
  plugin_version?: string;
}): LumoEvent {
  const event: LumoEvent = {
    type: input.type,
    at: input.at,
    variant: input.variant,
  };
  if (input.target !== undefined) event.target = input.target;
  if (input.gated !== undefined) event.gated = input.gated;
  if (input.ms_since_install !== undefined) event.ms_since_install = input.ms_since_install;
  if (input.tool !== undefined) event.tool = input.tool;
  if (input.gated_count !== undefined) event.gated_count = input.gated_count;
  if (input.prompt_variant !== undefined) event.prompt_variant = input.prompt_variant;
  if (input.source !== undefined) event.source = input.source;
  if (input.os !== undefined) event.os = input.os;
  if (input.plugin_version !== undefined) event.plugin_version = input.plugin_version;
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

// ---------------------------------------------------------------------------
// FA-30 — scoreboard: derived from the event log, no second counter file.
// ---------------------------------------------------------------------------

/**
 * Count 'pql_gated_touch' lines in events.jsonl. The running scoreboard total.
 * Fail-open → 0 on any read error or absent file.
 */
export function getGatedCount(stateDir?: string): number {
  try {
    const dir = stateDir ?? resolveStateDir();
    const raw = readFileSync(join(dir, EVENTS_FILE), 'utf8');
    const lines = raw.split('\n').filter((l) => l.trim().length > 0);
    let count = 0;
    for (const line of lines) {
      try {
        const parsed: unknown = JSON.parse(line);
        if (
          parsed !== null &&
          typeof parsed === 'object' &&
          'type' in parsed &&
          (parsed as { type: unknown }).type === 'pql_gated_touch'
        ) {
          count++;
        }
      } catch {
        // tolerate partial or garbage trailing lines — fail-open
      }
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * Append one 'pql_gated_touch' line to the event log.
 * The stamped gated_count equals the count AFTER this append so local reads
 * and any transmitted payload agree. Never throws.
 */
export function recordGatedTouch(
  input: { at: string; variant: OnboardVariant; tool: 'wp_check' | 'wp_knowledge' },
  stateDir?: string,
): void {
  try {
    const dir = stateDir ?? resolveStateDir();
    mkdirSync(dir, { recursive: true });
    // Derive count BEFORE the append, then stamp count+1 on the record.
    const countBefore = getGatedCount(dir);
    const event = buildEvent({
      type: 'pql_gated_touch',
      at: input.at,
      variant: input.variant,
      gated: true,
      tool: input.tool,
      gated_count: countBefore + 1,
    });
    appendFileSync(join(dir, EVENTS_FILE), JSON.stringify(event) + '\n', 'utf8');
  } catch {
    // fail-open: a bad dir or permission error must not interrupt a value path
  }
}

// ---------------------------------------------------------------------------
// FA-32 — telemetry consent: persisted tri-state, asked exactly once.
// ---------------------------------------------------------------------------

const TELEMETRY_FILE = 'telemetry';

/**
 * Read the persisted telemetry consent.
 * Returns 'unset' when the file is absent. Never throws.
 */
export function getTelemetryConsent(stateDir?: string): TelemetryConsent {
  try {
    const dir = stateDir ?? resolveStateDir();
    const value = readFileSync(join(dir, TELEMETRY_FILE), 'utf8').trim();
    if (value === 'granted' || value === 'declined') return value;
    return 'unset';
  } catch {
    return 'unset';
  }
}

/**
 * Persist the telemetry consent decision.
 * Write-once-ish — the file can be overwritten but the onboarding prompt
 * checks for 'unset' so it is effectively asked exactly once.
 * Never throws.
 */
export function setTelemetryConsent(
  consent: 'granted' | 'declined',
  stateDir?: string,
): void {
  try {
    const dir = stateDir ?? resolveStateDir();
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, TELEMETRY_FILE), consent, 'utf8');
  } catch {
    // fail-open
  }
}

// ---------------------------------------------------------------------------
// FA-34 — install-source attribution via injectable env.
// ---------------------------------------------------------------------------

/**
 * Resolve the install-source channel from the environment.
 * Distribution channels set LUMO_INSTALL_SOURCE in their install snippet.
 * Absent or empty → 'unknown' (never dropped from the install event).
 * Pure and injectable — pass a custom env object in tests.
 */
export function resolveInstallSource(env: Record<string, string | undefined> = process.env): string {
  return env['LUMO_INSTALL_SOURCE'] ?? 'unknown';
}

// ---------------------------------------------------------------------------
// W4 — prompt state persistence (fs wrappers; keeps prompt.ts pure).
// Mirrors the pattern of getOrAssignVariant / telemetry helpers above.
// ---------------------------------------------------------------------------

const PROMPT_STATE_FILE = 'prompt-state.json';
const PROMPT_VARIANT_FILE = 'prompt-variant';

/**
 * Read the persisted prompt state.
 * Fail-open → DEFAULT_PROMPT_STATE on any read, parse, or absent-file error.
 * Never throws.
 */
export function readPromptState(stateDir?: string): PromptState {
  try {
    const dir = stateDir ?? resolveStateDir();
    const raw = readFileSync(join(dir, PROMPT_STATE_FILE), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return { ...DEFAULT_PROMPT_STATE };
    const p = parsed as Record<string, unknown>;
    return {
      threshold: typeof p['threshold'] === 'number' ? p['threshold'] : DEFAULT_PROMPT_STATE.threshold,
      cooldownUntil: typeof p['cooldown_until'] === 'string' ? p['cooldown_until'] : undefined,
      ignoreCount: typeof p['ignore_count'] === 'number' ? p['ignore_count'] : DEFAULT_PROMPT_STATE.ignoreCount,
      promptVariant: typeof p['prompt_variant'] === 'string' ? p['prompt_variant'] : DEFAULT_PROMPT_STATE.promptVariant,
      sessionId: typeof p['session_id'] === 'string' ? p['session_id'] : undefined,
      sessionPromptShown: typeof p['session_prompt_shown'] === 'boolean' ? p['session_prompt_shown'] : false,
      sessionRevealShown: typeof p['session_reveal_shown'] === 'boolean' ? p['session_reveal_shown'] : false,
      sessionSilenced: typeof p['session_silenced'] === 'boolean' ? p['session_silenced'] : false,
      sessionClickedThrough: typeof p['session_clicked_through'] === 'boolean' ? p['session_clicked_through'] : false,
    };
  } catch {
    return { ...DEFAULT_PROMPT_STATE };
  }
}

/**
 * Persist the prompt state to disk.
 * Uses snake_case JSON keys to match the prompt-state.json spec.
 * Never throws.
 */
export function writePromptState(state: PromptState, stateDir?: string): void {
  try {
    const dir = stateDir ?? resolveStateDir();
    mkdirSync(dir, { recursive: true });
    const obj: Record<string, unknown> = {
      threshold: state.threshold,
      ignore_count: state.ignoreCount,
      prompt_variant: state.promptVariant,
      session_prompt_shown: state.sessionPromptShown,
      session_reveal_shown: state.sessionRevealShown,
      session_silenced: state.sessionSilenced,
      session_clicked_through: state.sessionClickedThrough ?? false,
    };
    if (state.cooldownUntil !== undefined) obj['cooldown_until'] = state.cooldownUntil;
    if (state.sessionId !== undefined) obj['session_id'] = state.sessionId;
    writeFileSync(join(dir, PROMPT_STATE_FILE), JSON.stringify(obj, null, 2), 'utf8');
  } catch {
    // fail-open: a bad dir or permission error must not interrupt a value path
  }
}

/**
 * Read or assign the persisted prompt variant. Write-once: on first call the
 * variant is written; subsequent calls return the same value.
 * Defaults to 'calm' on any read or write failure. Never throws.
 * Mirrors getOrAssignVariant — randomness lives here, not in the pure module.
 */
export function getOrAssignPromptVariant(stateDir?: string): PromptVariant {
  try {
    const dir = stateDir ?? resolveStateDir();
    mkdirSync(dir, { recursive: true });
    const variantPath = join(dir, PROMPT_VARIANT_FILE);
    try {
      const stored = readFileSync(variantPath, 'utf8').trim();
      if (stored.length > 0) return stored;
    } catch {
      // file absent — assign now
    }
    // W4 ships one arm; field recorded for future A/B without code change.
    const assigned: PromptVariant = 'calm';
    writeFileSync(variantPath, assigned, 'utf8');
    return assigned;
  } catch {
    return 'calm';
  }
}
