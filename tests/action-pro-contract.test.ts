/**
 * P2 — the Pro/Action contract. The server states its verdict as data
 * (structuredContent.found); the Action decides on the flag, never on prose.
 * The old string comparison matched a sentence the server never sent, so every
 * clean Pro answer was wrapped as a SOFT finding — a standing false alarm in
 * the one channel nobody watches live.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { runCatch } from '../src/action/catch-runner.js';

const DIFF = [
  'diff --git a/inc/x.php b/inc/x.php',
  '--- a/inc/x.php',
  '+++ b/inc/x.php',
  '@@ -1,1 +1,2 @@',
  '+<?php',
  "+echo esc_html__( 'Hello', 'my-plugin' );",
].join('\n');

function stubProResponse(body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => body,
      text: async () => '',
    })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('action ↔ pro contract', () => {
  it('SILENCE: found:false yields zero findings, whatever the prose says', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: 'Anything at all, even scary-sounding prose.' }],
        structuredContent: { found: false },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.findings).toEqual([]);
  });

  it('BELL: found:true yields the pre-rendered finding as advisory', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: '## Real finding with source' }],
        structuredContent: { found: true },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.findings).toHaveLength(1);
    expect(res.findings[0]!.tier).toBe('SOFT');
    expect(res.findings[0]!.body).toContain('Real finding');
  });

  it('legacy server without the flag: the ACTUAL neutral wording yields zero findings', async () => {
    stubProResponse({
      result: { content: [{ type: 'text', text: 'No known issues detected in the submitted code.' }] },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.findings).toEqual([]);
  });

  it('legacy neutral with a trailing newline still yields zero findings (Gemini pass A)', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: 'No known issues detected in the submitted code.\n' }],
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.findings).toEqual([]);
  });

  it('legacy server, unknown prose: fails toward a finding, never toward an all-clear', async () => {
    stubProResponse({
      result: { content: [{ type: 'text', text: 'Some response wording we do not recognise.' }] },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.findings).toHaveLength(1);
  });
});

// Product-gate condition on the toolkit wave: a Pro run that silently fell
// back to the free catch reads as "Pro checked and found nothing" — the
// degradation must be a first-class, visible fact of the run.
describe('pro degradation announces itself', () => {
  it('BELL: unreachable Pro server sets proDegraded on the run', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.proDegraded).toBe(true);
  });

  it('SILENCE: a healthy Pro run is not marked degraded', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: 'prose' }],
        structuredContent: { found: false },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.proDegraded).toBe(false);
  });

  it('SILENCE: the free path (no Pro credentials) never claims a Pro degradation', async () => {
    const res = await runCatch({ diff: DIFF });
    expect(res.proDegraded).toBe(false);
  });
});
