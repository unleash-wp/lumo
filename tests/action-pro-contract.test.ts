/**
 * P2 — the Pro/Action contract. The server states its verdict as data
 * (structuredContent.found); the Action decides on the flag, never on prose.
 * The old string comparison matched a sentence the server never sent, so every
 * clean Pro answer was wrapped as a SOFT finding — a standing false alarm in
 * the one channel nobody watches live.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { runCatch } from '../src/action/catch-runner.js';
import { buildScanLimitsNotice } from '../src/lib/render.js';

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

  // The pair the whole `computed` flag exists for. Both responses carry
  // found:false and the same neutral prose; only the marker says whether the
  // scan ran. A run that ends quietly on the second one is a false all-clear
  // produced by a database fault, on the paid layer, in CI.
  it('BELL: computed:false is a degraded run, not a clean one', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: 'No known issues detected in the submitted code.' }],
        structuredContent: { computed: false, found: false, loudCount: 0, softCount: 0 },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.proDegraded).toBe(true);
  });

  it('SILENCE: computed:true with the same prose stays a clean, undegraded run', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: 'No known issues detected in the submitted code.' }],
        structuredContent: { computed: true, found: false, loudCount: 0, softCount: 0 },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.proDegraded).toBe(false);
    expect(res.findings).toEqual([]);
  });

  it('SILENCE: a server predating the flag sends no marker and is not degraded', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: 'prose' }],
        structuredContent: { found: false },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.proDegraded).toBe(false);
  });
});

// The degraded path is where a paying customer's pull request actually gets
// reviewed by the free catch. If that catch quietly stops reading at its line
// cap, the review reads as complete while the tail of the file went unseen —
// the same false all-clear, one layer down and harder to notice.
describe('a degraded run still names the free catch limits', () => {
  it('BELL: a file longer than the scanner reads says so in the review', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );

    const body = Array.from(
      { length: 2_100 },
      () => '+$post = get_post( $id );',
    ).join('\n');
    const longDiff = [
      'diff --git a/inc/big.php b/inc/big.php',
      '--- a/inc/big.php',
      '+++ b/inc/big.php',
      '@@ -1,1 +1,2100 @@',
      body,
    ].join('\n');

    const res = await runCatch({ diff: longDiff, proUrl: 'https://pro.example', licenseKey: 'k' });

    expect(res.proDegraded).toBe(true);
    expect(res.scanLimits).toHaveLength(1);
    expect(res.scanLimits[0]!.filename).toBe('inc/big.php');
    expect(res.scanLimits[0]!.note).toContain('were scanned');
    // A limit of the scanner is not a defect in the contributor's code, so it
    // never travels as a finding and can never fail a build.
    expect(res.findings.some((f) => f.body.includes('were scanned'))).toBe(false);
  });

  it('SILENCE: a short file reports no limits at all', async () => {
    const res = await runCatch({ diff: DIFF });

    expect(res.scanLimits).toEqual([]);
  });

  // Said once per run, not once per file: the sentence describes the scanner,
  // and twenty copies of it under one pull request is how a reviewer learns to
  // scroll past Lumo.
  it('collapses the same limit across many files into one notice that still names them', () => {
    const notice = buildScanLimitsNotice([
      { filename: 'a.php', note: 'only the first 2000 lines were scanned' },
      { filename: 'b.php', note: 'only the first 2000 lines were scanned' },
      { filename: 'c.php', note: '2 further matches are not listed' },
    ]);

    expect(notice.match(/only the first 2000 lines were scanned/g)).toHaveLength(1);
    for (const file of ['a.php', 'b.php', 'c.php']) {
      expect(notice).toContain(file);
    }
    expect(notice).toContain('not the whole picture');
  });

  // The dangerous shape: the paid scan hit a limit AND reported no finding, so
  // its own prose never reaches the pull request as a finding. Without this the
  // limit vanished in exactly the case that already looked like an all-clear.
  it('the Pro server saying complete:false is enough on its own, with no finding', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: 'Only the first 2000 lines were scanned.' }],
        structuredContent: { computed: true, complete: false, found: false, loudCount: 0, softCount: 0 },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });

    expect(res.proDegraded).toBe(false);
    expect(res.findings).toEqual([]);
    expect(res.scanLimits).toHaveLength(1);
    // The server's own words, not a paraphrase: this is the only place the
    // limit gets stated, so it has to say which limit it was.
    expect(res.scanLimits[0]!.note).toBe('Only the first 2000 lines were scanned.');
  });

  it('SILENCE: a server that says nothing about completeness is not called incomplete', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: 'prose' }],
        structuredContent: { found: false },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });

    expect(res.scanLimits).toEqual([]);
  });
});

// Two limits biting the same file must both survive the summary. Grouping by
// note keeps them apart; grouping by file would have collapsed them into
// whichever one happened to be first.
describe('the run summary loses nothing on the way', () => {
  it('keeps both limits when they bite the same file', () => {
    const notice = buildScanLimitsNotice([
      { filename: 'big.php', note: 'only the first 2000 lines were scanned' },
      { filename: 'big.php', note: '2 further matches are not listed' },
    ]);

    expect(notice).toContain('only the first 2000 lines were scanned');
    expect(notice).toContain('2 further matches are not listed');
    expect(notice.match(/big\.php/g)).toHaveLength(2);
  });

  it('a Pro server that flags a limit but says nothing readable still gets a line', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: '   ' }],
        structuredContent: { computed: true, complete: false, found: false, loudCount: 0, softCount: 0 },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });

    expect(res.scanLimits).toHaveLength(1);
    expect(res.scanLimits[0]!.note.trim()).not.toBe('');
    expect(res.scanLimits[0]!.note).toContain('did not say which');
  });
});
