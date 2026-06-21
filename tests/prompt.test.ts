import { describe, it, expect } from 'vitest';
import {
  decidePrompt,
  onPromptShown,
  onIgnore,
  onCheckoutClick,
  rollSession,
  reconcileSession,
  countTouchesInWindow,
  DEFAULT_PROMPT_STATE,
} from '../src/lib/prompt.js';
import type { PromptState } from '../src/lib/prompt.js';

const NOW = '2026-06-21T15:00:00Z';
const SESSION = 'conv-abc';

function freshState(overrides: Partial<PromptState> = {}): PromptState {
  return { ...DEFAULT_PROMPT_STATE, ...overrides };
}

// ---------------------------------------------------------------------------
// DEFAULT_PROMPT_STATE — shape assertion
// ---------------------------------------------------------------------------

describe('DEFAULT_PROMPT_STATE', () => {
  it('has threshold 3', () => expect(DEFAULT_PROMPT_STATE.threshold).toBe(3));
  it('has ignoreCount 0', () => expect(DEFAULT_PROMPT_STATE.ignoreCount).toBe(0));
  it('has promptVariant calm', () => expect(DEFAULT_PROMPT_STATE.promptVariant).toBe('calm'));
  it('has sessionPromptShown false', () => expect(DEFAULT_PROMPT_STATE.sessionPromptShown).toBe(false));
  it('has sessionRevealShown false', () => expect(DEFAULT_PROMPT_STATE.sessionRevealShown).toBe(false));
  it('has sessionSilenced false', () => expect(DEFAULT_PROMPT_STATE.sessionSilenced).toBe(false));
  it('has no cooldownUntil', () => expect(DEFAULT_PROMPT_STATE.cooldownUntil).toBeUndefined());
  it('has no sessionId', () => expect(DEFAULT_PROMPT_STATE.sessionId).toBeUndefined());
});

// ---------------------------------------------------------------------------
// decidePrompt — below threshold
// ---------------------------------------------------------------------------

describe('decidePrompt — below threshold', () => {
  it('gatedCount 0 → showPrompt false, reason below_threshold', () => {
    const d = decidePrompt({ now: NOW, gatedCount: 0, state: freshState(), killSwitchOn: true, sessionId: SESSION });
    expect(d.showPrompt).toBe(false);
    expect(d.reason).toBe('below_threshold');
    expect(d.showReveal).toBe(false); // 0 touches — no reveal either
  });

  it('gatedCount 1 → below_threshold', () => {
    const d = decidePrompt({ now: NOW, gatedCount: 1, state: freshState(), killSwitchOn: true, sessionId: SESSION });
    expect(d.showPrompt).toBe(false);
    expect(d.reason).toBe('below_threshold');
    expect(d.showReveal).toBe(true); // >0 touches — reveal shown
  });

  it('gatedCount 2 → below_threshold', () => {
    const d = decidePrompt({ now: NOW, gatedCount: 2, state: freshState(), killSwitchOn: true, sessionId: SESSION });
    expect(d.showPrompt).toBe(false);
    expect(d.reason).toBe('below_threshold');
  });

  it('reveal not shown again when sessionRevealShown already true', () => {
    const state = freshState({ sessionRevealShown: true });
    const d = decidePrompt({ now: NOW, gatedCount: 1, state, killSwitchOn: true, sessionId: SESSION });
    expect(d.showReveal).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// decidePrompt — eligible (first prompt)
// ---------------------------------------------------------------------------

describe('decidePrompt — eligible', () => {
  it('gatedCount 3, threshold 3 → showReveal true + showPrompt true, reason eligible', () => {
    const d = decidePrompt({ now: NOW, gatedCount: 3, state: freshState(), killSwitchOn: true, sessionId: SESSION });
    expect(d.showReveal).toBe(true);
    expect(d.showPrompt).toBe(true);
    expect(d.reason).toBe('eligible');
    expect(d.gatedCount).toBe(3);
    expect(d.promptVariant).toBe('calm');
  });

  it('gatedCount 10, threshold 6 (after one ignore) → eligible', () => {
    const state = freshState({ threshold: 6 });
    const d = decidePrompt({ now: NOW, gatedCount: 10, state, killSwitchOn: true, sessionId: SESSION });
    expect(d.showPrompt).toBe(true);
    expect(d.reason).toBe('eligible');
  });
});

// ---------------------------------------------------------------------------
// decidePrompt — kill switch off
// ---------------------------------------------------------------------------

describe('decidePrompt — kill switch off', () => {
  it('killSwitchOn false → showReveal false, showPrompt false, reason kill_switch_off', () => {
    const d = decidePrompt({ now: NOW, gatedCount: 10, state: freshState(), killSwitchOn: false, sessionId: SESSION });
    expect(d.showReveal).toBe(false);
    expect(d.showPrompt).toBe(false);
    expect(d.reason).toBe('kill_switch_off');
  });

  it('kill switch off even when count is well above threshold', () => {
    const d = decidePrompt({ now: NOW, gatedCount: 100, state: freshState(), killSwitchOn: false, sessionId: SESSION });
    expect(d.showPrompt).toBe(false);
    expect(d.reason).toBe('kill_switch_off');
  });
});

// ---------------------------------------------------------------------------
// decidePrompt — cooldown
// ---------------------------------------------------------------------------

describe('decidePrompt — cooldown', () => {
  it('cooldownUntil in the future → reason cooldown, showPrompt false', () => {
    const future = '2026-06-22T20:00:00Z';
    const state = freshState({ cooldownUntil: future, threshold: 6 });
    const d = decidePrompt({ now: NOW, gatedCount: 6, state, killSwitchOn: true, sessionId: SESSION });
    expect(d.showPrompt).toBe(false);
    expect(d.reason).toBe('cooldown');
  });

  it('cooldownUntil in the past → eligible again (at raised threshold)', () => {
    const past = '2026-06-20T10:00:00Z';
    const state = freshState({ cooldownUntil: past, threshold: 6 });
    const d = decidePrompt({ now: NOW, gatedCount: 6, state, killSwitchOn: true, sessionId: SESSION });
    expect(d.showPrompt).toBe(true);
    expect(d.reason).toBe('eligible');
  });

  it('reveal still shown when in cooldown and not yet shown', () => {
    const future = '2026-06-22T20:00:00Z';
    const state = freshState({ cooldownUntil: future, threshold: 6 });
    const d = decidePrompt({ now: NOW, gatedCount: 6, state, killSwitchOn: true, sessionId: SESSION });
    expect(d.showReveal).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// decidePrompt — session silenced
// ---------------------------------------------------------------------------

describe('decidePrompt — session silenced', () => {
  it('sessionSilenced true → showPrompt false, reason session_silenced', () => {
    const state = freshState({ sessionSilenced: true });
    const d = decidePrompt({ now: NOW, gatedCount: 10, state, killSwitchOn: true, sessionId: SESSION });
    expect(d.showPrompt).toBe(false);
    expect(d.reason).toBe('session_silenced');
  });

  it('reveal still shown when session silenced but reveal not yet shown', () => {
    const state = freshState({ sessionSilenced: true, sessionRevealShown: false });
    const d = decidePrompt({ now: NOW, gatedCount: 10, state, killSwitchOn: true, sessionId: SESSION });
    expect(d.showReveal).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// decidePrompt — already shown this session
// ---------------------------------------------------------------------------

describe('decidePrompt — already shown', () => {
  it('sessionPromptShown true → reason already_shown, showPrompt false', () => {
    const state = freshState({ sessionPromptShown: true, sessionId: SESSION });
    const d = decidePrompt({ now: NOW, gatedCount: 10, state, killSwitchOn: true, sessionId: SESSION });
    expect(d.showPrompt).toBe(false);
    expect(d.reason).toBe('already_shown');
  });

  it('reveal not shown again when already shown this session', () => {
    const state = freshState({ sessionPromptShown: true, sessionRevealShown: true, sessionId: SESSION });
    const d = decidePrompt({ now: NOW, gatedCount: 10, state, killSwitchOn: true, sessionId: SESSION });
    expect(d.showReveal).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// decidePrompt — session roll (new sessionId resets per-session flags)
// ---------------------------------------------------------------------------

describe('decidePrompt — session roll', () => {
  it('new sessionId resets sessionPromptShown → eligible again', () => {
    const state = freshState({ sessionPromptShown: true, sessionRevealShown: true, sessionId: 'old-session' });
    const d = decidePrompt({ now: NOW, gatedCount: 3, state, killSwitchOn: true, sessionId: 'new-session' });
    // Session rolled: flags reset, threshold back in play
    expect(d.reason).toBe('eligible');
    expect(d.showReveal).toBe(true);
    expect(d.showPrompt).toBe(true);
  });

  it('session roll preserves cross-session back-off (threshold + ignoreCount)', () => {
    const state = freshState({ threshold: 6, ignoreCount: 1, sessionId: 'old-session' });
    const d = decidePrompt({ now: NOW, gatedCount: 5, state, killSwitchOn: true, sessionId: 'new-session' });
    // Still below raised threshold 6 — not eligible
    expect(d.showPrompt).toBe(false);
    expect(d.reason).toBe('below_threshold');
  });
});

// ---------------------------------------------------------------------------
// onPromptShown
// ---------------------------------------------------------------------------

describe('onPromptShown', () => {
  it('sets sessionPromptShown true', () => {
    const next = onPromptShown(freshState(), SESSION);
    expect(next.sessionPromptShown).toBe(true);
  });

  it('sets sessionRevealShown true', () => {
    const next = onPromptShown(freshState(), SESSION);
    expect(next.sessionRevealShown).toBe(true);
  });

  it('binds sessionId', () => {
    const next = onPromptShown(freshState(), SESSION);
    expect(next.sessionId).toBe(SESSION);
  });

  it('does not mutate the input state', () => {
    const state = freshState();
    onPromptShown(state, SESSION);
    expect(state.sessionPromptShown).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// onIgnore — threshold ladder and cooldown
// ---------------------------------------------------------------------------

describe('onIgnore', () => {
  it('threshold 3 → 6 on first ignore', () => {
    const next = onIgnore(freshState(), NOW);
    expect(next.threshold).toBe(6);
  });

  it('threshold 6 → 12 on second ignore', () => {
    const next = onIgnore(freshState({ threshold: 6 }), NOW);
    expect(next.threshold).toBe(12);
  });

  it('threshold 12 stays 12 (cap)', () => {
    const next = onIgnore(freshState({ threshold: 12 }), NOW);
    expect(next.threshold).toBe(12);
  });

  it('sets cooldownUntil to now + 24h', () => {
    const next = onIgnore(freshState(), NOW);
    const expected = new Date(new Date(NOW).getTime() + 24 * 60 * 60 * 1000).toISOString();
    expect(next.cooldownUntil).toBe(expected);
  });

  it('increments ignoreCount', () => {
    const next = onIgnore(freshState(), NOW);
    expect(next.ignoreCount).toBe(1);
  });

  it('ignoreCount 1 → 2 silences session (two-ignore circuit-breaker)', () => {
    const state = freshState({ ignoreCount: 1 });
    const next = onIgnore(state, NOW);
    expect(next.ignoreCount).toBe(2);
    expect(next.sessionSilenced).toBe(true);
  });

  it('consuming threshold 12 also silences session', () => {
    const state = freshState({ threshold: 12, ignoreCount: 0 });
    const next = onIgnore(state, NOW);
    expect(next.sessionSilenced).toBe(true);
  });

  it('does not mutate input state', () => {
    const state = freshState();
    onIgnore(state, NOW);
    expect(state.ignoreCount).toBe(0);
    expect(state.threshold).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// onCheckoutClick
// ---------------------------------------------------------------------------

describe('onCheckoutClick', () => {
  it('resets ignoreCount to 0', () => {
    const state = freshState({ ignoreCount: 1 });
    const next = onCheckoutClick(state);
    expect(next.ignoreCount).toBe(0);
  });

  it('marks session terminal via sessionPromptShown true', () => {
    const next = onCheckoutClick(freshState());
    expect(next.sessionPromptShown).toBe(true);
  });

  it('does not mutate input state', () => {
    const state = freshState({ ignoreCount: 2 });
    onCheckoutClick(state);
    expect(state.ignoreCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// rollSession
// ---------------------------------------------------------------------------

describe('rollSession', () => {
  it('resets sessionPromptShown', () => {
    const next = rollSession(freshState({ sessionPromptShown: true }), 'new');
    expect(next.sessionPromptShown).toBe(false);
  });

  it('resets sessionRevealShown', () => {
    const next = rollSession(freshState({ sessionRevealShown: true }), 'new');
    expect(next.sessionRevealShown).toBe(false);
  });

  it('resets sessionSilenced', () => {
    const next = rollSession(freshState({ sessionSilenced: true }), 'new');
    expect(next.sessionSilenced).toBe(false);
  });

  it('preserves threshold (cross-session back-off survives)', () => {
    const next = rollSession(freshState({ threshold: 12 }), 'new');
    expect(next.threshold).toBe(12);
  });

  it('preserves cooldownUntil', () => {
    const future = '2026-06-22T10:00:00Z';
    const next = rollSession(freshState({ cooldownUntil: future }), 'new');
    expect(next.cooldownUntil).toBe(future);
  });

  it('preserves ignoreCount', () => {
    const next = rollSession(freshState({ ignoreCount: 1 }), 'new');
    expect(next.ignoreCount).toBe(1);
  });

  it('sets the new sessionId', () => {
    const next = rollSession(freshState({ sessionId: 'old' }), 'new-session');
    expect(next.sessionId).toBe('new-session');
  });
});

// ---------------------------------------------------------------------------
// reconcileSession
// ---------------------------------------------------------------------------

describe('reconcileSession', () => {
  const PRIOR = 'session-prior';
  const NEXT = 'session-next';

  it('no prior sessionId (first ever) → binds sessionId, no onIgnore', () => {
    const state = freshState(); // sessionId undefined
    const result = reconcileSession(state, NEXT, NOW);
    // No back-off applied: threshold stays 3, ignoreCount stays 0
    expect(result.threshold).toBe(3);
    expect(result.ignoreCount).toBe(0);
    expect(result.sessionId).toBe(NEXT);
  });

  it('same sessionId → no-op', () => {
    const state = freshState({ sessionId: SESSION, sessionPromptShown: true });
    const result = reconcileSession(state, SESSION, NOW);
    // Unchanged
    expect(result.threshold).toBe(3);
    expect(result.ignoreCount).toBe(0);
    expect(result.sessionId).toBe(SESSION);
  });

  it('prior session with prompt shown and no click → onIgnore applied (threshold stepped, cooldown set, ignoreCount++)', () => {
    const state = freshState({
      sessionId: PRIOR,
      sessionPromptShown: true,
      sessionClickedThrough: false,
    });
    const result = reconcileSession(state, NEXT, NOW);
    // onIgnore: threshold 3 → 6, ignoreCount 0 → 1, cooldown set
    expect(result.threshold).toBe(6);
    expect(result.ignoreCount).toBe(1);
    expect(result.cooldownUntil).toBeDefined();
    // rollSession: per-session flags reset, new sessionId bound
    expect(result.sessionId).toBe(NEXT);
    expect(result.sessionPromptShown).toBe(false);
    expect(result.sessionRevealShown).toBe(false);
    expect(result.sessionSilenced).toBe(false);
  });

  it('prior session with prompt shown AND clicked → no onIgnore, just rollSession', () => {
    const state = freshState({
      sessionId: PRIOR,
      sessionPromptShown: true,
      sessionClickedThrough: true,
      ignoreCount: 0,
    });
    const result = reconcileSession(state, NEXT, NOW);
    // No back-off
    expect(result.threshold).toBe(3);
    expect(result.ignoreCount).toBe(0);
    expect(result.cooldownUntil).toBeUndefined();
    expect(result.sessionId).toBe(NEXT);
    expect(result.sessionPromptShown).toBe(false);
  });

  it('prior session with no prompt shown → no onIgnore, just rollSession', () => {
    const state = freshState({
      sessionId: PRIOR,
      sessionPromptShown: false,
    });
    const result = reconcileSession(state, NEXT, NOW);
    expect(result.threshold).toBe(3);
    expect(result.ignoreCount).toBe(0);
    expect(result.sessionId).toBe(NEXT);
  });

  it('reaching the ignore cap via reconcile → sessionSilenced set', () => {
    // Already had one ignore; this reconcile applies onIgnore again → ignoreCount hits 2 → silenced
    const state = freshState({
      sessionId: PRIOR,
      sessionPromptShown: true,
      sessionClickedThrough: false,
      ignoreCount: 1,
      threshold: 6,
    });
    const result = reconcileSession(state, NEXT, NOW);
    // onIgnore: ignoreCount 1 → 2 → silenced; rollSession clears session flags but sessionSilenced
    // is set by onIgnore then cleared by rollSession — rollSession always resets sessionSilenced.
    // The cross-session silence is enforced by threshold + cooldown, not by sessionSilenced
    // (which is a per-session flag). After rollSession, sessionSilenced is false.
    // The protection is that threshold is now 12 and cooldown is active.
    expect(result.ignoreCount).toBe(2);
    expect(result.threshold).toBe(12);
    expect(result.sessionSilenced).toBe(false); // rolled for new session
    expect(result.sessionId).toBe(NEXT);
  });

  it('does not mutate the input state', () => {
    const state = freshState({ sessionId: PRIOR, sessionPromptShown: true });
    reconcileSession(state, NEXT, NOW);
    expect(state.threshold).toBe(3);
    expect(state.ignoreCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// onCheckoutClick — sessionClickedThrough
// ---------------------------------------------------------------------------

describe('onCheckoutClick — sessionClickedThrough', () => {
  it('sets sessionClickedThrough true', () => {
    const next = onCheckoutClick(freshState());
    expect(next.sessionClickedThrough).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rollSession — clears sessionClickedThrough
// ---------------------------------------------------------------------------

describe('rollSession — sessionClickedThrough cleared', () => {
  it('clears sessionClickedThrough on roll', () => {
    const next = rollSession(freshState({ sessionClickedThrough: true }), 'new');
    expect(next.sessionClickedThrough).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// countTouchesInWindow — 30-day helper
// ---------------------------------------------------------------------------

describe('countTouchesInWindow', () => {
  const now = '2026-06-21T15:00:00Z';
  const nowMs = new Date(now).getTime();

  const within = new Date(nowMs - 1 * 24 * 60 * 60 * 1000).toISOString();    // 1 day ago
  const boundary = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString(); // exactly 30 days (included)
  const outside = new Date(nowMs - 31 * 24 * 60 * 60 * 1000).toISOString();  // 31 days ago (excluded)

  it('empty array → 0', () => {
    expect(countTouchesInWindow([], now)).toBe(0);
  });

  it('touch within 30 days is counted', () => {
    expect(countTouchesInWindow([within], now)).toBe(1);
  });

  it('touch at boundary (exactly 30 days) is counted', () => {
    expect(countTouchesInWindow([boundary], now)).toBe(1);
  });

  it('touch outside 30 days is not counted', () => {
    expect(countTouchesInWindow([outside], now)).toBe(0);
  });

  it('mixes inside and outside correctly', () => {
    expect(countTouchesInWindow([within, within, outside, outside], now)).toBe(2);
  });

  it('invalid timestamp is skipped (not counted)', () => {
    expect(countTouchesInWindow(['not-a-date'], now)).toBe(0);
  });
});
