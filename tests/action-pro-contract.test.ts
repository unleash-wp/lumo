/**
 * P2: the Pro/Action contract. The server states its verdict as data
 * (structuredContent.found); the Action decides on the flag, never on prose.
 * The old string comparison matched a sentence the server never sent, so every
 * clean Pro answer was wrapped as a SOFT finding: a standing false alarm in
 * the one channel nobody watches live.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { runCatch, parseMcpHttpResponseBody } from '../src/action/catch-runner.js';
import { buildScanLimitsNotice } from '../src/lib/render.js';

const DIFF = [
  'diff --git a/inc/x.php b/inc/x.php',
  '--- a/inc/x.php',
  '+++ b/inc/x.php',
  '@@ -1,1 +1,2 @@',
  '+<?php',
  "+echo esc_html__( 'Hello', 'my-plugin' );",
].join('\n');

// Bare JSON, as a server built with enableJsonResponse would answer.
function stubProResponse(body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(body),
    })),
  );
}

// SSE-framed, the SDK's actual default for WebStandardStreamableHTTPServerTransport
// (StreamableHTTPServerTransport without enableJsonResponse). This is the shape the
// live Pro server sends, so it is the shape the contract tests must exercise, not
// just the convenience one.
function stubProResponseSSE(body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      text: async () => `event: message\ndata: ${JSON.stringify(body)}\n\n`,
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

  it('BELL: found:true with loudCount yields a LOUD finding that can fail the check', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: '## Real LOUD finding with source' }],
        structuredContent: { found: true, loudCount: 1, softCount: 0 },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.findings).toHaveLength(1);
    expect(res.findings[0]!.tier).toBe('LOUD');
    expect(res.loudCount).toBe(1);
    expect(res.findings[0]!.body).toContain('Real LOUD finding');
  });

  it('BELL: found:true with loudCount 0 yields advisory SOFT', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: '## Real finding with source' }],
        structuredContent: { found: true, loudCount: 0, softCount: 1 },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.findings).toHaveLength(1);
    expect(res.findings[0]!.tier).toBe('SOFT');
    expect(res.findings[0]!.body).toContain('Real finding');
  });

  it('legacy found:true without loudCount stays advisory (never invent a LOUD fail)', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: '## Real finding with source' }],
        structuredContent: { found: true },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.findings).toHaveLength(1);
    expect(res.findings[0]!.tier).toBe('SOFT');
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
// back to the free catch reads as "Pro checked and found nothing": the
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
// cap, the review reads as complete while the tail of the file went unseen:
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

// A licence-service outage, an inactive key, or a client that sent no device
// fingerprint all resolve the Pro server's request to the free tier. The
// server now states that as data (licenseNotice, servedTier) as well as in
// the prose notice it prepends. Before #112 the Action only ever looked at
// found/loudCount, so a free-tier answer for a licensed request read exactly
// like a healthy Pro pass, on the one layer a paying customer cannot see for
// themselves.
describe('licence degradation surfaces as a run degradation, not a Pro pass (#112)', () => {
  it.each([
    ['unverified', 'a licence-service outage'],
    ['inactive', 'a determined-inactive key'],
    ['no_instance', 'a client with no device fingerprint'],
  ] as const)('BELL: licenseNotice %s (%s) degrades even on a clean-looking answer', async (notice, _reason) => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: 'No known issues detected in the submitted code.' }],
        structuredContent: {
          computed: true,
          complete: true,
          found: false,
          loudCount: 0,
          softCount: 0,
          licenseNotice: notice,
          servedTier: 'free',
        },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.proDegraded).toBe(true);
  });

  it('BELL: servedTier free on its own degrades, even if licenseNotice says none', async () => {
    // Should not happen given how resolveTier works, but the client must not
    // trust servedTier==='free' just because licenseNotice looks healthy: this
    // client sent a licence key and Pro coverage did not run, full stop.
    stubProResponse({
      result: {
        content: [{ type: 'text', text: 'No known issues detected in the submitted code.' }],
        structuredContent: {
          computed: true,
          complete: true,
          found: false,
          loudCount: 0,
          softCount: 0,
          licenseNotice: 'none',
          servedTier: 'free',
        },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.proDegraded).toBe(true);
  });

  it('SILENCE: servedTier pro with licenseNotice none is a healthy run', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: 'No known issues detected in the submitted code.' }],
        structuredContent: {
          computed: true,
          complete: true,
          found: false,
          loudCount: 0,
          softCount: 0,
          licenseNotice: 'none',
          servedTier: 'pro',
        },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.proDegraded).toBe(false);
  });

  it('SILENCE: a server predating #112 sends neither field and is not degraded by their absence', async () => {
    stubProResponse({
      result: {
        content: [{ type: 'text', text: '## Real LOUD finding with source' }],
        structuredContent: { found: true, loudCount: 1, softCount: 0 },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.proDegraded).toBe(false);
    expect(res.loudCount).toBe(1);
  });

  it('BELL: an even older server with no structured fields at all still degrades via the prose notice', async () => {
    stubProResponse({
      result: {
        content: [
          {
            type: 'text',
            text:
              '> **Lumo Pro could not verify your licence right now.** The licence ' +
              'service did not answer, so this request was served by the free tier.\n\n' +
              'No known issues detected in the submitted code.',
          },
        ],
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.proDegraded).toBe(true);
  });

  it('BELL: the inactive-key prose notice also degrades an old server with no structured fields', async () => {
    stubProResponse({
      result: {
        content: [
          {
            type: 'text',
            text:
              '> **The licence key sent with this request is not active for Lumo Pro.** ' +
              'It was served by the free tier.',
          },
        ],
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.proDegraded).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SSE response framing (issue #109). WebStandardStreamableHTTPServerTransport
// runs the SDK default (SSE) unless the server sets enableJsonResponse, which
// the live Pro server does not. A client that only ever tested against a bare
// `json: async () => body` stub never exercised the shape the real server
// sends, so every one of the contract tests above is repeated here against
// the SSE frame to prove the parser, not just the tier logic, is correct.
// ---------------------------------------------------------------------------

describe('SSE-framed responses (the live Pro server default)', () => {
  it('BELL: a LOUD finding survives SSE framing intact', async () => {
    stubProResponseSSE({
      result: {
        content: [{ type: 'text', text: '## Real LOUD finding with source' }],
        structuredContent: { found: true, loudCount: 1, softCount: 0 },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.findings).toHaveLength(1);
    expect(res.findings[0]!.tier).toBe('LOUD');
    expect(res.loudCount).toBe(1);
    expect(res.proDegraded).toBe(false);
  });

  it('SILENCE: found:false over SSE yields zero findings, not a degraded run', async () => {
    stubProResponseSSE({
      result: {
        content: [{ type: 'text', text: 'prose' }],
        structuredContent: { found: false },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.findings).toEqual([]);
    expect(res.proDegraded).toBe(false);
  });

  it('BELL: computed:false over SSE still degrades the run (the flag survives de-framing)', async () => {
    stubProResponseSSE({
      result: {
        content: [{ type: 'text', text: 'No known issues detected in the submitted code.' }],
        structuredContent: { computed: false, found: false, loudCount: 0, softCount: 0 },
      },
    });
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.proDegraded).toBe(true);
  });

  it('an SSE stream with preceding comment/event lines and CRLF still parses', async () => {
    const payload = JSON.stringify({
      result: {
        content: [{ type: 'text', text: '## Real LOUD finding with source' }],
        structuredContent: { found: true, loudCount: 1, softCount: 0 },
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => `: keep-alive\r\nevent: message\r\ndata: ${payload}\r\n\r\n`,
      })),
    );
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.findings).toHaveLength(1);
    expect(res.loudCount).toBe(1);
  });

  it('degrades to the free catch, rather than throwing, on an unparseable body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => 'not json and not an SSE frame',
      })),
    );
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.proDegraded).toBe(true);
  });
});

describe('quota and CI gate: no free fallback', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('BELL: HTTP 429 sets checkDidNotRun without proDegraded or free findings', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 429,
        text: async () =>
          JSON.stringify({
            error: 'rate_limited',
            message: 'This check did not run (daily quota).',
          }),
      })),
    );
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.checkDidNotRun).toBe(true);
    expect(res.checkDidNotRunReason).toBe('quota');
    expect(res.proDegraded).toBe(false);
    expect(res.findings).toEqual([]);
  });

  it('BELL: HTTP 402 ci_not_included sets checkDidNotRun', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 402,
        text: async () =>
          JSON.stringify({
            error: 'ci_not_included',
            message: 'This check did not run.',
          }),
      })),
    );
    const res = await runCatch({ diff: DIFF, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(res.checkDidNotRun).toBe(true);
    expect(res.checkDidNotRunReason).toBe('ci_not_included');
    expect(res.proDegraded).toBe(false);
    expect(res.findings).toEqual([]);
  });
});

describe('batch lumo_check_code (PERF-P0-1)', () => {
  it('BELL: one fetch with files[] maps per-file LOUD findings', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          result: {
            content: [
              {
                type: 'text',
                text: '## inc/x.php\n\n## Real LOUD finding\n\n---\n\n## inc/y.php\n\nneutral',
              },
            ],
            structuredContent: {
              batch: true,
              results: [
                {
                  path: 'inc/x.php',
                  computed: true,
                  complete: true,
                  found: true,
                  loudCount: 1,
                  softCount: 0,
                },
                {
                  path: 'inc/y.php',
                  computed: true,
                  complete: true,
                  found: false,
                  loudCount: 0,
                  softCount: 0,
                },
              ],
              licenseNotice: 'none',
              servedTier: 'pro',
            },
          },
        }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const diff = [
      'diff --git a/inc/x.php b/inc/x.php',
      '--- a/inc/x.php',
      '+++ b/inc/x.php',
      '@@ -1,1 +1,2 @@',
      '+<?php',
      "+echo esc_html__( 'Hello', 'my-plugin' );",
      'diff --git a/inc/y.php b/inc/y.php',
      '--- a/inc/y.php',
      '+++ b/inc/y.php',
      '@@ -1,1 +1,2 @@',
      '+<?php',
      '+echo 1;',
    ].join('\n');

    const res = await runCatch({ diff, proUrl: 'https://pro.example', licenseKey: 'k' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(fetchMock.mock.calls)).toContain('"files"');
    expect(JSON.stringify(fetchMock.mock.calls)).toContain('inc/x.php');
    expect(res.findings.filter((f) => f.filename === 'inc/x.php')).toHaveLength(1);
    expect(res.findings.find((f) => f.filename === 'inc/x.php')!.tier).toBe('LOUD');
    expect(res.findings.filter((f) => f.filename === 'inc/y.php')).toHaveLength(0);
  });
});

describe('parseMcpHttpResponseBody: the de-framing unit', () => {
  it('parses a bare JSON object unchanged', () => {
    expect(parseMcpHttpResponseBody('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses a single SSE data: line', () => {
    expect(parseMcpHttpResponseBody('event: message\ndata: {"a":1}\n\n')).toEqual({ a: 1 });
  });

  it('takes the LAST data: line when a stream carries more than one message', () => {
    const body = ['event: message', 'data: {"a":1}', '', 'event: message', 'data: {"a":2}', ''].join(
      '\n',
    );
    expect(parseMcpHttpResponseBody(body)).toEqual({ a: 2 });
  });

  it('throws on a body with neither shape', () => {
    expect(() => parseMcpHttpResponseBody('plain text, no braces, no data: line')).toThrow();
  });

  it('throws on an empty body', () => {
    expect(() => parseMcpHttpResponseBody('')).toThrow();
  });
});
