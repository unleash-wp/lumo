import type { LumoEvent, OnboardVariant } from './events.js';
import { getTelemetryConsent } from './events.js';

// ---------------------------------------------------------------------------
// Opt-in transmission layer — FA-31.
//
// This module builds identity-bearing payloads and transmits them ONLY when:
//   1. getTelemetryConsent() === 'granted', AND
//   2. process.env.LUMO_TELEMETRY_ENDPOINT is set (deploy-time env).
//
// Default (no endpoint, no opt-in) = strictly local. Safe to ship and test
// with no network effect — the endpoint is absent in dev/CI/repo.
//
// Rules:
//   - Types imported from events.ts; NONE defined here (single contract owner).
//   - Pure payload builders: deterministic, no Date.now/Math.random.
//   - transmit() is fire-and-forget, fail-open (never throws on sender error).
//   - Local counters (getGatedCount, the raw log) are never transmitted.
//   - No trial_started — Free IS the trial (locked team decision).
// ---------------------------------------------------------------------------

/** Minimal payload shape shared by all event transmissions. */
interface BasePayload {
  type: LumoEvent['type'];
  at: string;
  variant: OnboardVariant;
}

export interface InstallPayload extends BasePayload {
  type: 'install';
  source: string;
  os: string;
  plugin_version: string;
}

export interface ActivationPayload extends BasePayload {
  type: 'activation';
  target: 'own' | 'sample';
  gated: boolean;
  ms_since_install?: number;
}

export interface GatedTouchPayload extends BasePayload {
  type: 'pql_gated_touch';
  tool: 'wp_check' | 'wp_knowledge';
  gated: true;
  gated_count: number;
}

export interface CheckoutStartedPayload extends BasePayload {
  type: 'checkout_started';
  gated_count: number;
  prompt_variant?: string;
}

export interface CheckoutCompletedPayload extends BasePayload {
  type: 'checkout_completed';
}

export type TelemetryPayload =
  | InstallPayload
  | ActivationPayload
  | GatedTouchPayload
  | CheckoutStartedPayload
  | CheckoutCompletedPayload;

// ---------------------------------------------------------------------------
// Pure payload builders — caller injects all time-variant fields (at, counts).
// ---------------------------------------------------------------------------

export function buildInstallPayload(input: {
  at: string;
  variant: OnboardVariant;
  source: string;
  os: string;
  plugin_version: string;
}): InstallPayload {
  return {
    type: 'install',
    at: input.at,
    variant: input.variant,
    source: input.source,
    os: input.os,
    plugin_version: input.plugin_version,
  };
}

export function buildActivationPayload(input: {
  at: string;
  variant: OnboardVariant;
  target: 'own' | 'sample';
  gated: boolean;
  ms_since_install?: number;
}): ActivationPayload {
  const payload: ActivationPayload = {
    type: 'activation',
    at: input.at,
    variant: input.variant,
    target: input.target,
    gated: input.gated,
  };
  if (input.ms_since_install !== undefined) payload.ms_since_install = input.ms_since_install;
  return payload;
}

export function buildGatedTouchPayload(input: {
  at: string;
  variant: OnboardVariant;
  tool: 'wp_check' | 'wp_knowledge';
  gated_count: number;
}): GatedTouchPayload {
  return {
    type: 'pql_gated_touch',
    at: input.at,
    variant: input.variant,
    tool: input.tool,
    gated: true,
    gated_count: input.gated_count,
  };
}

export function buildCheckoutStartedPayload(input: {
  at: string;
  variant: OnboardVariant;
  gated_count: number;
  prompt_variant?: string;
}): CheckoutStartedPayload {
  const payload: CheckoutStartedPayload = {
    type: 'checkout_started',
    at: input.at,
    variant: input.variant,
    gated_count: input.gated_count,
  };
  if (input.prompt_variant !== undefined) payload.prompt_variant = input.prompt_variant;
  return payload;
}

export function buildCheckoutCompletedPayload(input: {
  at: string;
  variant: OnboardVariant;
}): CheckoutCompletedPayload {
  return {
    type: 'checkout_completed',
    at: input.at,
    variant: input.variant,
  };
}

// ---------------------------------------------------------------------------
// Guarded transmit — the only path to the network.
// ---------------------------------------------------------------------------

/** Sender dependency interface — injectable so tests never touch the network. */
export interface TransmitDeps {
  send?: (url: string, payload: TelemetryPayload) => Promise<void>;
  getConsent?: () => ReturnType<typeof getTelemetryConsent>;
  getEndpoint?: () => string | undefined;
}

/**
 * Fire-and-forget opt-in transmission.
 * Silent no-op unless consent === 'granted' AND LUMO_TELEMETRY_ENDPOINT is set.
 * Never throws — a sender error is swallowed.
 */
export async function transmit(
  payload: TelemetryPayload,
  deps?: TransmitDeps,
): Promise<void> {
  try {
    const consent = deps?.getConsent ? deps.getConsent() : getTelemetryConsent();
    if (consent !== 'granted') return;

    const endpoint = deps?.getEndpoint
      ? deps.getEndpoint()
      : process.env['LUMO_TELEMETRY_ENDPOINT'];
    if (!endpoint) return;

    const send =
      deps?.send ??
      (async (url: string, p: TelemetryPayload) => {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
        });
      });

    await send(endpoint, payload);
  } catch {
    // fail-open: network/DNS errors must not surface into any value path
  }
}
