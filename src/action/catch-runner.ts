/**
 * Core catch orchestration for the Lumo GitHub Action.
 *
 * Pure logic layer, no GitHub API calls, no process.exit.
 * Consumes checkCode() + formatCatch() from the free catch engine and
 * returns structured findings the action entry-point posts as review comments.
 *
 * Pro seam: when proUrl + licenseKey are present, calls the Pro MCP server's
 * lumo_check_code tool via the MCP JSON-RPC HTTP protocol. Falls back to the
 * free catch if the Pro server is unreachable.
 */

import { parseDiff } from './diff-parser.js';
import type { FileDiff } from './diff-parser.js';
import type { CatchResult, CatchTier, ProGap } from '../detection/catch.js';
import { checkCodeWithGaps, INPUT_LINE_CAP } from '../detection/catch.js';
import {
  formatCatch,
  buildCodeProTeaser,
  buildCodeProGapLine,
  joinPluginNames,
  catchInputTruncatedLine,
  catchHitsOmittedLine,
} from '../lib/render.js';

export interface Finding {
  filename: string;
  tier: CatchTier;
  /** Rendered Markdown, verbatim from formatCatch(). */
  body: string;
}

export interface RunResult {
  loudCount: number;
  softCount: number;
  findings: Finding[];
  /**
   * True when Pro credentials were configured but at least one file fell back
   * to the free catch (Pro server unreachable). The caller MUST surface this
   * in the run's visible output: a silently degraded Pro run reads as "Pro
   * checked and found nothing", which is a false all-clear on the paid layer.
   */
  proDegraded: boolean;
  /**
   * Files whose scan hit one of its own limits, and which limit. Reported ONCE
   * per run by the caller, not once per file: a limit of the scanner describes
   * the run, not the contributor's code, and repeating it twenty times in one
   * pull request is the noise that gets a reviewer switched off. The filenames
   * travel with it so the summary stays checkable.
   */
  scanLimits: Array<{ filename: string; note: string }>;
}

// ---------------------------------------------------------------------------
// Pro path, MCP JSON-RPC call against the licensed Pro server.
// Returns pre-rendered Markdown plus the Pro loudCount so the Action can fail
// on LOUD. Pro owns the tier counts in structuredContent; this client must not
// invent a softer tier than Pro reported.
// ---------------------------------------------------------------------------

interface ProRenderedFinding {
  _proRendered: true;
  body: string;
  /** From Pro structuredContent.loudCount. >= 1 → LOUD for fail_on_loud. */
  loudCount: number;
}

// ---------------------------------------------------------------------------
// Response framing.
//
// The Pro server's StreamableHTTPServerTransport runs the SDK default, which
// answers as an SSE stream (`event: message\ndata: {...}\n\n`) unless the
// server was built with enableJsonResponse. Sending the Streamable HTTP
// Accept header (`application/json, text/event-stream`) is necessary to get
// a 200 at all, but it is not sufficient: the body itself must still be
// de-framed. A client that only tries `JSON.parse` on the whole response body
// throws on every real Pro answer and only ever worked against a JSON-only
// test stub. Handle both shapes so a bare-JSON server (enableJsonResponse, or
// a future default change) keeps working too.
// ---------------------------------------------------------------------------

/**
 * Parse an MCP Streamable HTTP response body, whether the transport answered
 * with a bare JSON object or an SSE-framed stream.
 *
 * A stateless `tools/call` produces exactly one message, but a stream can in
 * principle carry more than one `data:` line; the JSON-RPC reply for this
 * request is the last one, so that is what we decode.
 */
export function parseMcpHttpResponseBody(rawBody: string): unknown {
  const trimmed = rawBody.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }

  const dataLines = trimmed
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trim())
    .filter((line) => line.length > 0);

  if (dataLines.length === 0) {
    throw new Error('response body was neither JSON nor a recognisable SSE frame');
  }

  return JSON.parse(dataLines[dataLines.length - 1]!);
}

async function fetchProResults(
  proUrl: string,
  licenseKey: string,
  code: string,
  language: 'php' | 'js',
  instanceId?: string,
): Promise<{ results: Array<CatchResult | ProRenderedFinding>; complete: boolean; text: string }> {
  const url = `${proUrl.replace(/\/$/, '')}/mcp`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${licenseKey}`,
  };
  // #159: Pro requires this to enforce the seat. Without it, the server
  // validates the key but cannot check its activation, and resolves free.
  // Omitted only when the caller could not derive one (see deriveActionInstanceId).
  if (instanceId) headers['X-Lumo-Instance'] = instanceId;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'lumo_check_code',
        arguments: { code, language },
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Pro MCP responded ${res.status}: ${await res.text()}`);
  }

  const rawBody = await res.text();
  let json: {
    result?: {
      content?: Array<{ type: string; text?: string }>;
      structuredContent?: {
        computed?: boolean;
        complete?: boolean;
        found?: boolean;
        loudCount?: number;
        softCount?: number;
      };
    };
  };
  try {
    json = parseMcpHttpResponseBody(rawBody) as typeof json;
  } catch (err) {
    // Same failure shape as an HTTP error: caught by catchFile() below, which
    // falls back to the free catch and marks the run degraded. A response we
    // cannot decode is not a "Pro said nothing", it is "Pro did not deliver".
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Pro MCP response could not be parsed (${msg})`);
  }

  const text = json?.result?.content?.[0]?.text ?? '';

  // computed:false means the Pro scan fell into its fail-open path. It still
  // answers, and the answer still reads "no known issues": that prose is not a
  // verdict. Treat it exactly like an unreachable server: the caller below falls
  // back to the free catch and marks the run degraded. "Pro answered" and "Pro
  // checked" are not the same thing, and only the second one may end a run
  // quietly. Servers predating the flag send undefined, which is not false.
  if (json?.result?.structuredContent?.computed === false) {
    throw new Error('Pro MCP could not run the scan (computed:false)');
  }

  // The Pro server states its verdict as data: structuredContent.found. Decide
  // on the flag, never on the prose: the old string comparison matched a
  // sentence the server never sent, so every clean Pro answer was wrapped as a
  // finding. The literal below is the HISTORICAL neutral wording, kept only for
  // a server predating the flag; the current server no longer sends it and
  // always sends the flags. Fail direction on total uncertainty: treat as a
  // finding (a false alarm), never as an all-clear.

  // A server that says nothing about completeness is not claiming to be
  // incomplete. Only an explicit false counts, so a server predating the field
  // keeps behaving exactly as before.
  const complete = json?.result?.structuredContent?.complete !== false;

  const found = json?.result?.structuredContent?.found;
  if (found === false) return { results: [], complete, text };
  // trim: a single trailing newline from the transport must not turn the
  // neutral sentence into a phantom finding.
  if (
    found === undefined &&
    (!text.trim() || text.trim() === 'No known issues detected in the submitted code.')
  ) {
    return { results: [], complete, text };
  }
  if (!text.trim()) return { results: [], complete, text };

  // loudCount is the only signal that may fail the check. Servers predating the
  // field send undefined; treat that as 0 so we never invent a LOUD fail, but
  // still surface the prose as advisory. A positive loudCount from Pro must
  // never be coerced to SOFT — that was the paid-gate defect.
  const loudCount =
    typeof json?.result?.structuredContent?.loudCount === 'number'
      ? json.result.structuredContent.loudCount
      : 0;

  // Pro result is already rendered Markdown from the Pro server.
  return {
    results: [{ _proRendered: true as const, body: text, loudCount }],
    complete,
    text,
  };
}

function isProRendered(r: CatchResult | ProRenderedFinding): r is ProRenderedFinding {
  return '_proRendered' in r && r._proRendered === true;
}

// ---------------------------------------------------------------------------
// Per-file catch
// ---------------------------------------------------------------------------

async function catchFile(
  file: FileDiff,
  proUrl?: string,
  licenseKey?: string,
  instanceId?: string,
): Promise<{ findings: Finding[]; proDegraded: boolean; scanLimits: string[] }> {
  let results: Array<CatchResult | ProRenderedFinding>;
  // Set only on the free path: Pro has the knowledge, so it reports no gap.
  let proGaps: ProGap[] = [];
  let proDegraded = false;
  const scanLimits: string[] = [];

  const runFreeCatch = (): Array<CatchResult | ProRenderedFinding> => {
    const outcome = checkCodeWithGaps(file.blob, file.language);
    proGaps = outcome.proGaps;
    if (outcome.inputTruncated) scanLimits.push(catchInputTruncatedLine(INPUT_LINE_CAP));
    if (outcome.hitsOmitted > 0) scanLimits.push(catchHitsOmittedLine(outcome.hitsOmitted));
    return outcome.results;
  };

  if (proUrl && licenseKey) {
    try {
      const pro = await fetchProResults(proUrl, licenseKey, file.blob, file.language, instanceId);
      results = pro.results;
      // The Pro server names the limit in its own prose, but that prose only
      // reaches the pull request when it also reported a finding. When it did
      // not, this summary is the only place the limit can be stated, so it
      // carries the server's own words rather than a vaguer paraphrase. When it
      // did, the sentence is already in the finding above and repeating it here
      // would be the duplication this summary exists to avoid.
      if (!pro.complete) {
        // The empty-text fallback is not defensive padding: a server can set the
        // flag and send nothing readable, and an empty bullet in the summary
        // would report the limit as if it had been explained. Saying less, but
        // saying it, beats a blank line that looks like an answer.
        const fromServer = pro.text.trim();
        scanLimits.push(
          pro.results.length > 0
            ? 'the paid scan hit one of its own limits, see its answer on this file above'
            : fromServer || 'the paid scan hit one of its own limits and did not say which',
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // "did not deliver a check", not "unreachable": a server that answers but
      // could not scan lands here too, and telling the operator it was
      // unreachable sends them to look at the network instead of the server.
      console.error(`[lumo] Pro MCP did not deliver a check (${msg}), falling back to free catch`);
      proDegraded = true;
      results = runFreeCatch();
    }
  } else {
    results = runFreeCatch();
  }

  const findings: Finding[] = results.map((r) => {
    if (isProRendered(r)) {
      // Pro owns the loud/soft counts in structuredContent. A positive loudCount
      // must fail the check when fail_on_loud is on; coercing everything to SOFT
      // made the paid gate inert.
      const tier: CatchTier = r.loudCount > 0 ? 'LOUD' : 'SOFT';
      return { filename: file.filename, tier, body: r.body };
    }
    return {
      filename: file.filename,
      tier: r.tier,
      body: formatCatch(r),
    };
  });

  // A Pro-only signal fired on this file. Without this the Action reports "no
  // findings" on a WooCommerce pull request: the same false all-clear the tool
  // and hook paths already fixed, in the channel where nobody is watching live.
  //
  // Always SOFT: a coverage gap is not a defect in the contributor's code, so it
  // must never fail a build through fail_on_loud.
  if (proGaps.length > 0) {
    const names = joinPluginNames(proGaps.map((g) => g.pluginName));
    findings.push({
      filename: file.filename,
      tier: 'SOFT' as CatchTier,
      body: findings.length === 0 ? buildCodeProTeaser(names) : buildCodeProGapLine(names),
    });
  }

  return { findings, proDegraded, scanLimits };
}

// ---------------------------------------------------------------------------
// Main exported runner, injectable for tests
// ---------------------------------------------------------------------------

export interface RunCatchOptions {
  diff: string;
  proUrl?: string;
  licenseKey?: string;
  /**
   * Stable fingerprint for this installation, sent as X-Lumo-Instance
   * (#159). Required for Pro to enforce its seat limit; a Pro server that
   * receives none cannot check activation and resolves the request free,
   * even with a valid licenseKey. See deriveActionInstanceId() in main.ts.
   */
  instanceId?: string;
}

export async function runCatch(opts: RunCatchOptions): Promise<RunResult> {
  const files = parseDiff(opts.diff);
  const findings: Finding[] = [];
  const scanLimits: RunResult['scanLimits'] = [];
  let proDegraded = false;

  for (const file of files) {
    const fileResult = await catchFile(file, opts.proUrl, opts.licenseKey, opts.instanceId);
    findings.push(...fileResult.findings);
    proDegraded = proDegraded || fileResult.proDegraded;
    for (const note of fileResult.scanLimits) {
      scanLimits.push({ filename: file.filename, note });
    }
  }

  const loudCount = findings.filter((f) => f.tier === 'LOUD').length;
  const softCount = findings.filter((f) => f.tier === 'SOFT').length;

  return { loudCount, softCount, findings, proDegraded, scanLimits };
}
