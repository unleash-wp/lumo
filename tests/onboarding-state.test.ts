import { describe, it, expect } from 'vitest';
import { decideOnboardingStep, classifyOwnCodeOutcome } from '../src/onboarding/state.js';
import type { AuditResult } from '../src/detection/index.js';

// ---------------------------------------------------------------------------
// decideOnboardingStep, pure flow-policy, no I/O
// ---------------------------------------------------------------------------

describe('decideOnboardingStep', () => {
  it('Variant A + not yet onboarded → auto-chain beat 1 then beat 2', () => {
    expect(decideOnboardingStep(false, 'A')).toBe('beat1-then-beat2');
  });

  it('Variant B + not yet onboarded → beat 1 then wait for developer', () => {
    expect(decideOnboardingStep(false, 'B')).toBe('beat1-then-wait');
  });

  it('already onboarded + Variant A → no re-onboard regardless of variant', () => {
    expect(decideOnboardingStep(true, 'A')).toBe('already-onboarded');
  });

  it('already onboarded + Variant B → no re-onboard regardless of variant', () => {
    expect(decideOnboardingStep(true, 'B')).toBe('already-onboarded');
  });
});

// ---------------------------------------------------------------------------
// classifyOwnCodeOutcome, pure, stubbed AuditResult, no disk
// ---------------------------------------------------------------------------

describe('classifyOwnCodeOutcome', () => {
  it('detected:true → activation (Woo order code found in dev repo)', () => {
    const audit: Pick<AuditResult, 'detected'> = { detected: true };
    expect(classifyOwnCodeOutcome(audit)).toBe('activation');
  });

  it('detected:false → no_target (clean repo, not churn)', () => {
    const audit: Pick<AuditResult, 'detected'> = { detected: false };
    expect(classifyOwnCodeOutcome(audit)).toBe('no_target');
  });

  it('does not throw for a detected:true result', () => {
    expect(() => classifyOwnCodeOutcome({ detected: true })).not.toThrow();
  });

  it('does not throw for a detected:false result', () => {
    expect(() => classifyOwnCodeOutcome({ detected: false })).not.toThrow();
  });

  it('activation outcome is never returned for a clean repo', () => {
    // Regression guard: no_target must not bleed into activation
    const result = classifyOwnCodeOutcome({ detected: false });
    expect(result).not.toBe('activation');
  });

  it('no_target outcome is never returned when Woo code is found', () => {
    const result = classifyOwnCodeOutcome({ detected: true });
    expect(result).not.toBe('no_target');
  });
});
