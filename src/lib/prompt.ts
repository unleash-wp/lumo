// ---------------------------------------------------------------------------
// Upgrade-prompt state machine, pure module. No fs, no Date.now, no
// Math.random in decision paths. All ambient values injected by caller.
//
// Persistence wrappers (readPromptState / writePromptState /
// getOrAssignPromptVariant) live in events.ts: the single fs owner.
// ---------------------------------------------------------------------------

export type PromptVariant = string;

export interface PromptState {
  /** Current eligibility threshold: 3 → 6 → 12 */
  threshold: number;
  /** ISO timestamp, prompt suppressed until this time */
  cooldownUntil?: string;
  /** Consecutive non-clicks (ignores); silence at 2 */
  ignoreCount: number;
  /** Upgrade-copy A/B arm, assigned once */
  promptVariant: PromptVariant;
  /** Session identifier from last call */
  sessionId?: string;
  /** Prompt already shown this session */
  sessionPromptShown: boolean;
  /** Reveal line already shown this session */
  sessionRevealShown: boolean;
  /** Two ignores reached this session → no more prompts rest of session */
  sessionSilenced: boolean;
  /** Checkout CTA was clicked this session, distinguishes click-terminal from show-and-ignore */
  sessionClickedThrough?: boolean;
}

export interface PromptDecision {
  /** Append the value-reveal line after the Free answer? */
  showReveal: boolean;
  /** Show the upgrade prompt block? */
  showPrompt: boolean;
  /** The live gated count: the number the copy leads with */
  gatedCount: number;
  /** A/B arm for checkout_started + copy selection */
  promptVariant: PromptVariant;
  reason:
    | 'eligible'
    | 'below_threshold'
    | 'cooldown'
    | 'session_silenced'
    | 'kill_switch_off'
    | 'already_shown';
}

export const DEFAULT_PROMPT_STATE: PromptState = {
  threshold: 3,
  ignoreCount: 0,
  promptVariant: 'calm',
  sessionPromptShown: false,
  sessionRevealShown: false,
  sessionSilenced: false,
};

// ---------------------------------------------------------------------------
// 30-day windowed touch helper, pure, operates over event-log timestamps.
// Exported so tests can exercise it directly without fs.
// ---------------------------------------------------------------------------

/**
 * Count how many touch `at` timestamps fall within the trailing 30-day window.
 * Pure, caller supplies the `now` reference and the list of ISO timestamps.
 */
export function countTouchesInWindow(
  touchTimestamps: readonly string[],
  now: string,
  windowDays = 30,
): number {
  const nowMs = new Date(now).getTime();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  let count = 0;
  for (const ts of touchTimestamps) {
    const ms = new Date(ts).getTime();
    if (!Number.isNaN(ms) && nowMs - ms <= windowMs) {
      count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// decidePrompt, pure decision. No I/O, no Date.now.
// ---------------------------------------------------------------------------

/**
 * Compute what to show after a Free answer. Pure, caller injects all ambient
 * values (now, gatedCount, state, killSwitchOn, sessionId).
 */
export function decidePrompt(input: {
  now: string;
  gatedCount: number;
  state: PromptState;
  killSwitchOn: boolean;
  sessionId: string;
}): PromptDecision {
  const { now, gatedCount, state, killSwitchOn, sessionId } = input;

  // Resolve effective state. Roll per-session flags only when a *prior* sessionId
  // was recorded and it differs from the current one. On the very first call
  // (sessionId undefined) we bind without resetting any persisted flags.
  const effective =
    state.sessionId !== undefined && state.sessionId !== sessionId
      ? rollSession(state, sessionId)
      : { ...state, sessionId };

  const base: Omit<PromptDecision, 'reason' | 'showReveal' | 'showPrompt'> = {
    gatedCount,
    promptVariant: effective.promptVariant,
  };

  if (!killSwitchOn) {
    return { ...base, showReveal: false, showPrompt: false, reason: 'kill_switch_off' };
  }

  if (effective.sessionSilenced) {
    const showReveal = !effective.sessionRevealShown;
    return { ...base, showReveal, showPrompt: false, reason: 'session_silenced' };
  }

  if (effective.sessionPromptShown) {
    const showReveal = !effective.sessionRevealShown;
    return { ...base, showReveal, showPrompt: false, reason: 'already_shown' };
  }

  if (gatedCount < effective.threshold) {
    const showReveal = !effective.sessionRevealShown && gatedCount > 0;
    return { ...base, showReveal, showPrompt: false, reason: 'below_threshold' };
  }

  // Check cooldown
  if (effective.cooldownUntil !== undefined) {
    const cooldownMs = new Date(effective.cooldownUntil).getTime();
    const nowMs = new Date(now).getTime();
    if (!Number.isNaN(cooldownMs) && nowMs < cooldownMs) {
      const showReveal = !effective.sessionRevealShown;
      return { ...base, showReveal, showPrompt: false, reason: 'cooldown' };
    }
  }

  // Eligible
  const showReveal = !effective.sessionRevealShown;
  return { ...base, showReveal, showPrompt: true, reason: 'eligible' };
}

// ---------------------------------------------------------------------------
// Pure reducers, return NEXT state; caller persists. No I/O.
// ---------------------------------------------------------------------------

/**
 * Mark the prompt as shown for this session. Binds the sessionId.
 */
export function onPromptShown(state: PromptState, sessionId: string): PromptState {
  return {
    ...state,
    sessionId,
    sessionPromptShown: true,
    sessionRevealShown: true,
  };
}

/**
 * Record a non-click (ignore). Applies the 3→6→12 ladder, 24h cooldown,
 * increments ignoreCount, and silences the session when the cap is reached.
 */
export function onIgnore(state: PromptState, now: string): PromptState {
  const nextIgnoreCount = state.ignoreCount + 1;

  // Advance the threshold: 3 → 6 → 12
  const nextThreshold =
    state.threshold === 3 ? 6
    : state.threshold === 6 ? 12
    : state.threshold;

  // 24h cooldown from this ignore
  const nowMs = new Date(now).getTime();
  const cooldownUntil = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();

  // Two distinct silence triggers:
  // 1. ignoreCount reaches 2 (two consecutive ignores within session)
  // 2. We just consumed threshold 12 (nextThreshold stays 12, was 12 before)
  const hitIgnoreCap = nextIgnoreCount >= 2;
  const hitThresholdCap = state.threshold === 12;
  const sessionSilenced = hitIgnoreCap || hitThresholdCap;

  return {
    ...state,
    threshold: nextThreshold,
    cooldownUntil,
    ignoreCount: nextIgnoreCount,
    sessionSilenced,
  };
}

/**
 * Record a checkout click. Resets ignoreCount; marks session terminal via
 * sessionPromptShown so the prompt does not re-fire this session.
 * Sets sessionClickedThrough so reconcileSession can distinguish a click from
 * a show-and-ignore when the next session starts.
 */
export function onCheckoutClick(state: PromptState): PromptState {
  return {
    ...state,
    ignoreCount: 0,
    sessionPromptShown: true,
    sessionClickedThrough: true,
  };
}

/**
 * Reset per-session flags when the sessionId changes between invocations.
 * Preserves cross-session back-off state (threshold, cooldownUntil, ignoreCount).
 */
export function rollSession(state: PromptState, sessionId: string): PromptState {
  return {
    ...state,
    sessionId,
    sessionPromptShown: false,
    sessionRevealShown: false,
    sessionSilenced: false,
    sessionClickedThrough: false,
  };
}

/**
 * Reconcile persisted prompt state at the start of a surface invocation.
 * If a prior session showed a prompt but never recorded a checkout click,
 * that is a non-click: apply the back-off (onIgnore) before starting the new
 * session. Then roll into the current session. Pure; caller injects now + sessionId.
 *
 * Transitions:
 * - Prior session, prompt shown, NOT clicked → onIgnore then rollSession
 * - Prior session, prompt shown, clicked (sessionClickedThrough) → rollSession only
 * - Same session OR no prior sessionId → return state unchanged (no-op)
 */
export function reconcileSession(state: PromptState, sessionId: string, now: string): PromptState {
  // No prior session recorded, first ever run, or already on the current session.
  if (state.sessionId === undefined || state.sessionId === sessionId) {
    // Ensure the session is bound on first ever call.
    if (state.sessionId === undefined) {
      return { ...state, sessionId };
    }
    return state;
  }

  // A prior session exists and differs from the current one.
  // Check if that prior session ended in a checkout click.
  if (state.sessionPromptShown && !state.sessionClickedThrough) {
    // Prompt was shown but not clicked. This is a non-click (ignore).
    const afterIgnore = onIgnore(state, now);
    return rollSession(afterIgnore, sessionId);
  }

  // Prior session ended in a click, or no prompt was shown, just roll.
  return rollSession(state, sessionId);
}
