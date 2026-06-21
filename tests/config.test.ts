import { describe, it, expect } from 'vitest';
import {
  isUpgradePromptEnabled,
  getCheckoutUrl,
  buildCheckoutUrl,
} from '../src/lib/config.js';

// ---------------------------------------------------------------------------
// isUpgradePromptEnabled — kill-switch, default ON
// ---------------------------------------------------------------------------

describe('isUpgradePromptEnabled', () => {
  it('returns true when env var is unset (default on)', () => {
    expect(isUpgradePromptEnabled({})).toBe(true);
  });

  it("returns false for '0'", () => {
    expect(isUpgradePromptEnabled({ LUMO_UPGRADE_PROMPT: '0' })).toBe(false);
  });

  it("returns false for 'false'", () => {
    expect(isUpgradePromptEnabled({ LUMO_UPGRADE_PROMPT: 'false' })).toBe(false);
  });

  it("returns false for 'off'", () => {
    expect(isUpgradePromptEnabled({ LUMO_UPGRADE_PROMPT: 'off' })).toBe(false);
  });

  it("returns false for 'no'", () => {
    expect(isUpgradePromptEnabled({ LUMO_UPGRADE_PROMPT: 'no' })).toBe(false);
  });

  it('opt-out is case-insensitive — OFF', () => {
    expect(isUpgradePromptEnabled({ LUMO_UPGRADE_PROMPT: 'OFF' })).toBe(false);
  });

  it('opt-out is case-insensitive — False', () => {
    expect(isUpgradePromptEnabled({ LUMO_UPGRADE_PROMPT: 'False' })).toBe(false);
  });

  it('opt-out is case-insensitive — NO', () => {
    expect(isUpgradePromptEnabled({ LUMO_UPGRADE_PROMPT: 'NO' })).toBe(false);
  });

  it("returns true for any non-opt-out value — '1'", () => {
    expect(isUpgradePromptEnabled({ LUMO_UPGRADE_PROMPT: '1' })).toBe(true);
  });

  it("returns true for any non-opt-out value — 'yes'", () => {
    expect(isUpgradePromptEnabled({ LUMO_UPGRADE_PROMPT: 'yes' })).toBe(true);
  });

  it("returns true for any non-opt-out value — 'on'", () => {
    expect(isUpgradePromptEnabled({ LUMO_UPGRADE_PROMPT: 'on' })).toBe(true);
  });

  it('returns true for empty string (empty ≠ opt-out)', () => {
    expect(isUpgradePromptEnabled({ LUMO_UPGRADE_PROMPT: '' })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getCheckoutUrl — env-injectable, default https://lumo.so/pro
// ---------------------------------------------------------------------------

describe('getCheckoutUrl', () => {
  it('returns https://lumo.so/pro when env var is unset', () => {
    expect(getCheckoutUrl({})).toBe('https://lumo.so/pro');
  });

  it('returns the env override when LUMO_CHECKOUT_URL is set', () => {
    expect(getCheckoutUrl({ LUMO_CHECKOUT_URL: 'https://staging.lumo.so/pro' }))
      .toBe('https://staging.lumo.so/pro');
  });

  it('returns any arbitrary string set in env', () => {
    expect(getCheckoutUrl({ LUMO_CHECKOUT_URL: 'https://custom.example.com' }))
      .toBe('https://custom.example.com');
  });
});

// ---------------------------------------------------------------------------
// buildCheckoutUrl — attribution params, stable order, encoded
// ---------------------------------------------------------------------------

describe('buildCheckoutUrl', () => {
  const base = 'https://lumo.so/pro';

  it('appends ref, gated, and v params', () => {
    const url = buildCheckoutUrl(base, { source: 'wp-community', gatedCount: 5, promptVariant: 'calm' });
    expect(url).toContain('ref=wp-community');
    expect(url).toContain('gated=5');
    expect(url).toContain('v=calm');
  });

  it('param order is stable: ref → gated → v', () => {
    const url = buildCheckoutUrl(base, { source: 'unknown', gatedCount: 3, promptVariant: 'calm' });
    const idx = (p: string) => url.indexOf(p);
    expect(idx('ref=')).toBeLessThan(idx('gated='));
    expect(idx('gated=')).toBeLessThan(idx('v='));
  });

  it('percent-encodes special characters in source', () => {
    const url = buildCheckoutUrl(base, { source: 'a b+c', gatedCount: 1, promptVariant: 'calm' });
    // URL encoding: space → %20 or +; + → %2B
    expect(url).not.toContain('a b+c');
  });

  it('works with a base URL that already has no trailing slash', () => {
    const url = buildCheckoutUrl('https://lumo.so/pro', { source: 'ph', gatedCount: 10, promptVariant: 'calm' });
    expect(url).toContain('lumo.so/pro');
  });

  it('gatedCount 0 is included', () => {
    const url = buildCheckoutUrl(base, { source: 'unknown', gatedCount: 0, promptVariant: 'calm' });
    expect(url).toContain('gated=0');
  });

  it('does not mutate the base string', () => {
    const original = 'https://lumo.so/pro';
    buildCheckoutUrl(original, { source: 'x', gatedCount: 1, promptVariant: 'calm' });
    expect(original).toBe('https://lumo.so/pro');
  });
});
