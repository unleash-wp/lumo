import type { AuditResult } from '../detection/index.js';
import type { OnboardVariant } from '../lib/events.js';

// Pure orchestration helpers, no I/O. The markdown command prose describes
// these decisions; tests assert them directly.

/**
 * Decide which onboarding path to follow based on prior state and A/B variant.
 *
 * Variant A auto-chains beat 1 → beat 2 in the same session.
 * Variant B shows beat 1 then waits for the dev to type /lumo:wp-check.
 * Already-onboarded users skip the flow entirely.
 */
export function decideOnboardingStep(
  hasOnboarded: boolean,
  variant: OnboardVariant,
): 'beat1-then-beat2' | 'beat1-then-wait' | 'already-onboarded' {
  if (hasOnboarded) return 'already-onboarded';
  return variant === 'A' ? 'beat1-then-beat2' : 'beat1-then-wait';
}

/**
 * Classify the outcome of running the own-code audit during beat 2.
 *
 * detected:true means WooCommerce order code was found and the HPOS guardrail
 * fires. This is the activation moment.
 * detected:false means no Woo order target exists in this repo, a distinct
 * state that is not churn and must not be recorded as activation.
 */
export function classifyOwnCodeOutcome(
  audit: Pick<AuditResult, 'detected'>,
): 'activation' | 'no_target' {
  return audit.detected ? 'activation' : 'no_target';
}
