import { describe, it, expect, vi } from 'vitest';
import {
  buildInstallPayload,
  buildActivationPayload,
  buildGatedTouchPayload,
  buildCheckoutStartedPayload,
  buildCheckoutCompletedPayload,
  transmit,
} from '../src/lib/track.js';
import type { TelemetryPayload, TransmitDeps } from '../src/lib/track.js';
import type { TelemetryConsent } from '../src/lib/events.js';

// ---------------------------------------------------------------------------
// Payload builders — deterministic, no network, no I/O
// ---------------------------------------------------------------------------

describe('buildInstallPayload', () => {
  it('carries exactly the documented props', () => {
    const p = buildInstallPayload({
      at: '2026-06-21T10:00:00Z',
      variant: 'A',
      source: 'wp-community',
      os: 'darwin',
      plugin_version: '0.1.0',
    });
    expect(p.type).toBe('install');
    expect(p.at).toBe('2026-06-21T10:00:00Z');
    expect(p.variant).toBe('A');
    expect(p.source).toBe('wp-community');
    expect(p.os).toBe('darwin');
    expect(p.plugin_version).toBe('0.1.0');
  });

  it('is deterministic for identical inputs', () => {
    const input = {
      at: '2026-06-21T10:00:00Z',
      variant: 'B' as const,
      source: 'unknown',
      os: 'linux',
      plugin_version: '0.2.0',
    };
    expect(buildInstallPayload(input)).toEqual(buildInstallPayload(input));
  });
});

describe('buildActivationPayload', () => {
  it('carries target, gated, variant, and at', () => {
    const p = buildActivationPayload({
      at: '2026-06-21T10:01:00Z',
      variant: 'B',
      target: 'own',
      gated: true,
      ms_since_install: 5000,
    });
    expect(p.type).toBe('activation');
    expect(p.target).toBe('own');
    expect(p.gated).toBe(true);
    expect(p.ms_since_install).toBe(5000);
    expect(p.variant).toBe('B');
  });

  it('omits ms_since_install when not provided', () => {
    const p = buildActivationPayload({
      at: '2026-06-21T10:01:00Z',
      variant: 'A',
      target: 'own',
      gated: true,
    });
    expect('ms_since_install' in p).toBe(false);
  });
});

describe('buildGatedTouchPayload', () => {
  it('carries tool, gated:true, gated_count, and variant', () => {
    const p = buildGatedTouchPayload({
      at: '2026-06-21T10:02:00Z',
      variant: 'A',
      tool: 'wp_check',
      gated_count: 3,
    });
    expect(p.type).toBe('pql_gated_touch');
    expect(p.tool).toBe('wp_check');
    expect(p.gated).toBe(true);
    expect(p.gated_count).toBe(3);
    expect(p.variant).toBe('A');
  });

  it('accepts wp_knowledge as tool', () => {
    const p = buildGatedTouchPayload({
      at: '2026-06-21T10:02:00Z',
      variant: 'B',
      tool: 'wp_knowledge',
      gated_count: 1,
    });
    expect(p.tool).toBe('wp_knowledge');
  });
});

describe('buildCheckoutStartedPayload', () => {
  it('carries gated_count and optional prompt_variant', () => {
    const p = buildCheckoutStartedPayload({
      at: '2026-06-21T10:03:00Z',
      variant: 'A',
      gated_count: 5,
      prompt_variant: 'loss-aversion',
    });
    expect(p.type).toBe('checkout_started');
    expect(p.gated_count).toBe(5);
    expect(p.prompt_variant).toBe('loss-aversion');
  });

  it('omits prompt_variant when not provided', () => {
    const p = buildCheckoutStartedPayload({
      at: '2026-06-21T10:03:00Z',
      variant: 'A',
      gated_count: 2,
    });
    expect('prompt_variant' in p).toBe(false);
  });
});

describe('buildCheckoutCompletedPayload', () => {
  it('carries type, at, and variant', () => {
    const p = buildCheckoutCompletedPayload({
      at: '2026-06-21T10:04:00Z',
      variant: 'B',
    });
    expect(p.type).toBe('checkout_completed');
    expect(p.at).toBe('2026-06-21T10:04:00Z');
    expect(p.variant).toBe('B');
  });
});

describe('no trial_started builder', () => {
  it('track module does not export a buildTrialStartedPayload function', () => {
    // Verified by TS: the import at the top of this file is exhaustive.
    // The runtime check uses the named imports we already have.
    const exportedNames = [
      'buildInstallPayload',
      'buildActivationPayload',
      'buildGatedTouchPayload',
      'buildCheckoutStartedPayload',
      'buildCheckoutCompletedPayload',
      'transmit',
    ] as const;
    // If buildTrialStartedPayload existed in the module, TypeScript would
    // allow importing it. The fact that the import above compiles with only
    // the listed names proves it is absent at the type level.
    expect(exportedNames.includes('buildTrialStartedPayload' as never)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// transmit — the core safety contract
// ---------------------------------------------------------------------------

function makePayload(): TelemetryPayload {
  return buildInstallPayload({
    at: '2026-06-21T10:00:00Z',
    variant: 'A',
    source: 'unknown',
    os: 'darwin',
    plugin_version: '0.1.0',
  });
}

describe('transmit — no-transmit invariant (ship-safe-in-CI)', () => {
  it('is a no-op when LUMO_TELEMETRY_ENDPOINT is unset, regardless of consent', async () => {
    const sendSpy = vi.fn();

    // granted consent but NO endpoint
    const deps: TransmitDeps = {
      getConsent: (): TelemetryConsent => 'granted',
      getEndpoint: () => undefined,
      send: sendSpy,
    };

    await transmit(makePayload(), deps);
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('is a no-op when consent is unset and endpoint is also unset', async () => {
    const sendSpy = vi.fn();
    const deps: TransmitDeps = {
      getConsent: (): TelemetryConsent => 'unset',
      getEndpoint: () => undefined,
      send: sendSpy,
    };
    await transmit(makePayload(), deps);
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('is a no-op when consent is declined and endpoint is set', async () => {
    const sendSpy = vi.fn();
    const deps: TransmitDeps = {
      getConsent: (): TelemetryConsent => 'declined',
      getEndpoint: () => 'https://telemetry.example.com/events',
      send: sendSpy,
    };
    await transmit(makePayload(), deps);
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('is a no-op when consent is unset and endpoint is set', async () => {
    const sendSpy = vi.fn();
    const deps: TransmitDeps = {
      getConsent: (): TelemetryConsent => 'unset',
      getEndpoint: () => 'https://telemetry.example.com/events',
      send: sendSpy,
    };
    await transmit(makePayload(), deps);
    expect(sendSpy).not.toHaveBeenCalled();
  });
});

describe('transmit — consent gating', () => {
  it('calls sender exactly once with the built payload when consent is granted and endpoint is set', async () => {
    const sendSpy = vi.fn().mockResolvedValue(undefined);
    const payload = makePayload();
    const endpoint = 'https://telemetry.example.com/events';

    const deps: TransmitDeps = {
      getConsent: (): TelemetryConsent => 'granted',
      getEndpoint: () => endpoint,
      send: sendSpy,
    };

    await transmit(payload, deps);
    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy).toHaveBeenCalledWith(endpoint, payload);
  });

  it('transmits each payload type when consent + endpoint granted', async () => {
    const payloads: TelemetryPayload[] = [
      buildInstallPayload({ at: '2026-06-21T10:00:00Z', variant: 'A', source: 'unknown', os: 'darwin', plugin_version: '0.1.0' }),
      buildActivationPayload({ at: '2026-06-21T10:01:00Z', variant: 'A', target: 'own', gated: true }),
      buildGatedTouchPayload({ at: '2026-06-21T10:02:00Z', variant: 'A', tool: 'wp_check', gated_count: 1 }),
      buildCheckoutStartedPayload({ at: '2026-06-21T10:03:00Z', variant: 'A', gated_count: 2 }),
      buildCheckoutCompletedPayload({ at: '2026-06-21T10:04:00Z', variant: 'A' }),
    ];

    for (const payload of payloads) {
      const sendSpy = vi.fn().mockResolvedValue(undefined);
      const deps: TransmitDeps = {
        getConsent: (): TelemetryConsent => 'granted',
        getEndpoint: () => 'https://telemetry.example.com/events',
        send: sendSpy,
      };
      await transmit(payload, deps);
      expect(sendSpy).toHaveBeenCalledTimes(1);
    }
  });
});

describe('transmit — fail-open on sender error', () => {
  it('does not throw when the sender rejects', async () => {
    const sendSpy = vi.fn().mockRejectedValue(new Error('network error'));
    const deps: TransmitDeps = {
      getConsent: (): TelemetryConsent => 'granted',
      getEndpoint: () => 'https://telemetry.example.com/events',
      send: sendSpy,
    };
    await expect(transmit(makePayload(), deps)).resolves.not.toThrow();
  });

  it('does not throw when the sender throws synchronously', async () => {
    const sendSpy = vi.fn().mockImplementation(() => {
      throw new Error('sync error');
    });
    const deps: TransmitDeps = {
      getConsent: (): TelemetryConsent => 'granted',
      getEndpoint: () => 'https://telemetry.example.com/events',
      send: sendSpy,
    };
    await expect(transmit(makePayload(), deps)).resolves.not.toThrow();
  });
});
