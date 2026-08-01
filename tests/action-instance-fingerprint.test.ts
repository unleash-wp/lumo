/**
 * #159: Pro requires a device fingerprint (X-Lumo-Instance) to enforce its
 * seat limit. Without one, the server validates the licence key but cannot
 * check its activation, so a run that omits the header silently loses Pro
 * even with a valid key configured.
 *
 * Two things must hold:
 *   1. deriveActionInstanceId() is stable across runs on the same repository
 *      (same owner/repo → same hash, every time, not per-run).
 *   2. the header actually reaches the Pro server on every request.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { deriveActionInstanceId } from '../src/action/main.js';
import { runCatch } from '../src/action/catch-runner.js';

const DIFF = [
  'diff --git a/inc/x.php b/inc/x.php',
  '--- a/inc/x.php',
  '+++ b/inc/x.php',
  '@@ -1,1 +1,2 @@',
  '+<?php',
  "+echo esc_html__( 'Hello', 'my-plugin' );",
].join('\n');

describe('deriveActionInstanceId', () => {
  it('is deterministic: the same repository always hashes to the same id', () => {
    const a = deriveActionInstanceId('unleash-wp/lumo');
    const b = deriveActionInstanceId('unleash-wp/lumo');
    expect(a).toBe(b);
  });

  it('matches a plain sha256 of "owner/repo", so it is auditable, not a black box', () => {
    const expected = createHash('sha256').update('unleash-wp/lumo').digest('hex');
    expect(deriveActionInstanceId('unleash-wp/lumo')).toBe(expected);
  });

  it('different repositories get different fingerprints', () => {
    const a = deriveActionInstanceId('unleash-wp/lumo');
    const b = deriveActionInstanceId('unleash-wp/lumo-pro');
    expect(a).not.toBe(b);
  });

  it('never sends the raw repository name: the hash does not contain it', () => {
    const id = deriveActionInstanceId('unleash-wp/lumo');
    expect(id).not.toContain('unleash-wp');
    expect(id).not.toContain('lumo');
    // A sha256 hex digest, not a JSON blob or anything else identifiable.
    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('empty or missing repository → undefined, never a fingerprint of the empty string', () => {
    expect(deriveActionInstanceId('')).toBeUndefined();
    expect(deriveActionInstanceId('   ')).toBeUndefined();
    expect(deriveActionInstanceId(undefined)).toBeUndefined();
  });
});

describe('runCatch forwards the fingerprint as X-Lumo-Instance', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends the header on every Pro request when instanceId is provided', async () => {
    const seenHeaders: Array<Record<string, string>> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        seenHeaders.push(init.headers as Record<string, string>);
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              result: {
                content: [{ type: 'text', text: '' }],
                structuredContent: { found: false },
              },
            }),
        };
      }),
    );

    await runCatch({
      diff: DIFF,
      proUrl: 'https://pro.example',
      licenseKey: 'k',
      instanceId: 'fingerprint-abc123',
    });

    expect(seenHeaders).toHaveLength(1);
    expect(seenHeaders[0]!['X-Lumo-Instance']).toBe('fingerprint-abc123');
  });

  it('omits the header rather than sending an empty one when no instanceId is given', async () => {
    const seenHeaders: Array<Record<string, string>> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        seenHeaders.push(init.headers as Record<string, string>);
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              result: {
                content: [{ type: 'text', text: '' }],
                structuredContent: { found: false },
              },
            }),
        };
      }),
    );

    await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });

    expect(seenHeaders).toHaveLength(1);
    expect(seenHeaders[0]!['X-Lumo-Instance']).toBeUndefined();
  });
});
