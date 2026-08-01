/**
 * Core catch orchestration for the Lumo GitHub Action.
 *
 * Pure logic layer, no GitHub API calls, no process.exit.
 * Consumes checkCode() + formatCatch() from the free catch engine and
 * returns structured findings the action entry-point posts as review comments.
 *
 * Pro seam: when proUrl + licenseKey are present, calls the Pro MCP server's
 * lumo_check_code tool via the MCP JSON-RPC HTTP protocol (batch files[] when
 * possible). Falls back to the free catch if the Pro server is unreachable.
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

/** Must match lumo-pro CHECK_CODE_BATCH_FILE_CAP (PERF-P0-1). */
export const CHECK_CODE_BATCH_FILE_CAP = 50;

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
   * True when a paid-configured run hit quota or CI-not-included on the Pro
   * server. No free-catch fallback ran: the check did not happen.
   */
  checkDidNotRun: boolean;
  /** When checkDidNotRun, why the gate stopped (for PR copy). */
  checkDidNotRunReason?: 'quota' | 'ci_not_included';
  /**
   * Files whose scan hit one of its own limits, and which limit. Reported ONCE
   * per run by the caller, not once per file: a limit of the scanner describes
   * the run, not the contributor's code, and repeating it twenty times in one
   * pull request is the noise that gets a reviewer switched off. The filenames
   * travel with it so the summary stays checkable.
   */
  scanLimits: Array<{ filename: string; note: string }>;
  /**
   * Files where the free catch itself failed to produce a result (its own
   * outer catch fired, typically the local snapshot could not be loaded).
   * The caller MUST NOT treat these files as "no match": nothing was checked
   * on them at all, and a run that is otherwise silent must not post
   * ACTION_NO_MATCH_LINE while this is non-empty.
   */
  didNotRunFiles: string[];
}

// ---------------------------------------------------------------------------
// Pro path, MCP JSON-RPC call against the licensed Pro server.
// Returns pre-rendered Markdown plus the Pro loudCount so the Action can fail
// on LOUD. Pro owns the tier counts in structuredContent; this client must not
// invent a softer tier than Pro reported.
// ---------------------------------------------------------------------------

/** Pro server refused the check (quota / CI gate). No free fallback. */
export class ProCheckBlockedError extends Error {
  readonly reason: 'quota' | 'ci_not_included';

  constructor(reason: 'quota' | 'ci_not_included', detail: string) {
    super(detail);
    this.name = 'ProCheckBlockedError';
    this.reason = reason;
  }
}

export const LUMO_CLIENT_ACTION = 'action';

interface ProRenderedFinding {
  _proRendered: true;
  body: string;
  /** From Pro structuredContent.loudCount. >= 1 → LOUD for fail_on_loud. */
  loudCount: number;
}

interface ProFileStructured {
  path: string;
  computed?: boolean;
  complete?: boolean;
  found?: boolean;
  loudCount?: number;
  softCount?: number;
}

interface ProFileOutcome {
  results: Array<CatchResult | ProRenderedFinding>;
  complete: boolean;
  text: string;
}

// ---------------------------------------------------------------------------
// #112: licence-degradation fallback for servers predating licenseNotice /
// servedTier as structured fields. These are the fixed opening clauses of
// LICENSE_UNVERIFIED_NOTICE, LICENSE_INACTIVE_NOTICE, and
// LICENSE_NO_INSTANCE_NOTICE in lumo-pro's src/mcp/cap.ts, duplicated here (not
// imported: this client has no dependency on the Pro server's source) so an
// older server that only ever spoke prose still degrades this run instead of
// having its free-catch text read as a Pro verdict.
// ---------------------------------------------------------------------------
const LICENSE_DEGRADATION_NOTICE_PREFIXES = [
  '> **Lumo Pro could not verify your licence right now.**',
  '> **The licence key sent with this request is not active for Lumo Pro.**',
  '> **Lumo Pro could not confirm an activation for this request.**',
];

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

function extractBatchFileText(fullText: string, path: string, fileCount: number): string {
  if (fileCount <= 1) return fullText;
  const marker = `## ${path}\n\n`;
  const start = fullText.indexOf(marker);
  if (start === -1) return fullText;
  const after = fullText.slice(start + marker.length);
  const next = after.indexOf('\n\n---\n\n');
  return next === -1 ? after : after.slice(0, next);
}

function proOutcomeFromStructured(
  text: string,
  structured: ProFileStructured | undefined,
  licenseNotice: string | undefined,
  servedTier: string | undefined,
): ProFileOutcome {
  if (structured?.computed === false) {
    throw new Error('Pro MCP could not run the scan (computed:false)');
  }

  if (servedTier === 'free' || (licenseNotice !== undefined && licenseNotice !== 'none')) {
    throw new Error(
      `Pro MCP served the free tier for a licensed request (licenseNotice: ${licenseNotice ?? 'unknown'})`,
    );
  }

  const trimmedText = text.trim();
  if (LICENSE_DEGRADATION_NOTICE_PREFIXES.some((prefix) => trimmedText.startsWith(prefix))) {
    throw new Error('Pro MCP response opens with a licence-degradation notice');
  }

  const complete = structured?.complete !== false;
  const found = structured?.found;
  if (found === false) return { results: [], complete, text };
  if (
    found === undefined &&
    (!text.trim() || text.trim() === 'No known issues detected in the submitted code.')
  ) {
    return { results: [], complete, text };
  }
  if (!text.trim()) return { results: [], complete, text };

  const loudCount = typeof structured?.loudCount === 'number' ? structured.loudCount : 0;

  return {
    results: [{ _proRendered: true as const, body: text, loudCount }],
    complete,
    text,
  };
}

async function postProCheckCode(
  proUrl: string,
  licenseKey: string,
  body: { code?: string; language?: 'php' | 'js'; files?: Array<{ path: string; code: string; language: 'php' | 'js' }> },
  instanceId?: string,
): Promise<{
  text: string;
  structured: {
    batch?: boolean;
    results?: ProFileStructured[];
    computed?: boolean;
    complete?: boolean;
    found?: boolean;
    loudCount?: number;
    softCount?: number;
    licenseNotice?: 'none' | 'unverified' | 'inactive' | 'no_instance';
    servedTier?: 'free' | 'pro';
  };
}> {
  const url = `${proUrl.replace(/\/$/, '')}/mcp`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${licenseKey}`,
    'X-Lumo-Client': LUMO_CLIENT_ACTION,
  };
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
        arguments: body,
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    if (res.status === 429) {
      throw new ProCheckBlockedError('quota', bodyText || '429 rate_limited');
    }
    if (res.status === 402) {
      try {
        const parsed = JSON.parse(bodyText) as { error?: string };
        if (parsed.error === 'ci_not_included') {
          throw new ProCheckBlockedError('ci_not_included', bodyText);
        }
      } catch (err) {
        if (err instanceof ProCheckBlockedError) throw err;
      }
    }
    throw new Error(`Pro MCP responded ${res.status}: ${bodyText}`);
  }

  const rawBody = await res.text();
  let json: {
    result?: {
      content?: Array<{ type: string; text?: string }>;
      structuredContent?: {
        batch?: boolean;
        results?: ProFileStructured[];
        computed?: boolean;
        complete?: boolean;
        found?: boolean;
        loudCount?: number;
        softCount?: number;
        licenseNotice?: 'none' | 'unverified' | 'inactive' | 'no_instance';
        servedTier?: 'free' | 'pro';
      };
    };
  };
  try {
    json = parseMcpHttpResponseBody(rawBody) as typeof json;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Pro MCP response could not be parsed (${msg})`);
  }

  return {
    text: json?.result?.content?.[0]?.text ?? '',
    structured: json?.result?.structuredContent ?? {},
  };
}

/** Legacy single-file Pro fetch (servers predating files[] batch). */
async function fetchProResultsLegacy(
  proUrl: string,
  licenseKey: string,
  code: string,
  language: 'php' | 'js',
  instanceId?: string,
): Promise<ProFileOutcome> {
  const { text, structured } = await postProCheckCode(
    proUrl,
    licenseKey,
    { code, language },
    instanceId,
  );
  return proOutcomeFromStructured(
    text,
    structured.batch
      ? structured.results?.[0]
      : {
          path: '',
          computed: structured.computed,
          complete: structured.complete,
          found: structured.found,
          loudCount: structured.loudCount,
          softCount: structured.softCount,
        },
    structured.licenseNotice,
    structured.servedTier,
  );
}

async function fetchProBatchChunk(
  proUrl: string,
  licenseKey: string,
  files: FileDiff[],
  instanceId?: string,
): Promise<Map<string, ProFileOutcome>> {
  const out = new Map<string, ProFileOutcome>();

  const { text: fullText, structured } = await postProCheckCode(
    proUrl,
    licenseKey,
    {
      files: files.map((f) => ({ path: f.filename, code: f.blob, language: f.language })),
    },
    instanceId,
  );

  const licenseNotice = structured.licenseNotice;
  const servedTier = structured.servedTier;

  if (structured.batch && structured.results && structured.results.length > 0) {
    for (const row of structured.results) {
      const fileText = extractBatchFileText(fullText, row.path, structured.results.length);
      out.set(row.path, proOutcomeFromStructured(fileText, row, licenseNotice, servedTier));
    }
    return out;
  }

  // Server predates batch: fall back to one HTTP call per file in this chunk.
  for (const file of files) {
    out.set(file.filename, await fetchProResultsLegacy(proUrl, licenseKey, file.blob, file.language, instanceId));
  }
  return out;
}

async function fetchProBatch(
  proUrl: string,
  licenseKey: string,
  files: FileDiff[],
  instanceId?: string,
): Promise<Map<string, ProFileOutcome>> {
  const out = new Map<string, ProFileOutcome>();
  for (let i = 0; i < files.length; i += CHECK_CODE_BATCH_FILE_CAP) {
    const chunk = files.slice(i, i + CHECK_CODE_BATCH_FILE_CAP);
    const chunkOut = await fetchProBatchChunk(proUrl, licenseKey, chunk, instanceId);
    for (const [path, result] of chunkOut) {
      out.set(path, result);
    }
  }
  return out;
}

function isProRendered(r: CatchResult | ProRenderedFinding): r is ProRenderedFinding {
  return '_proRendered' in r && r._proRendered === true;
}

function findingsFromResults(
  filename: string,
  results: Array<CatchResult | ProRenderedFinding>,
  proGaps: ProGap[],
): Finding[] {
  const findings: Finding[] = results.map((r) => {
    if (isProRendered(r)) {
      const tier: CatchTier = r.loudCount > 0 ? 'LOUD' : 'SOFT';
      return { filename, tier, body: r.body };
    }
    return {
      filename,
      tier: r.tier,
      body: formatCatch(r),
    };
  });

  if (proGaps.length > 0) {
    const names = joinPluginNames(proGaps.map((g) => g.pluginName));
    findings.push({
      filename,
      tier: 'SOFT' as CatchTier,
      body: findings.length === 0 ? buildCodeProTeaser(names) : buildCodeProGapLine(names),
    });
  }

  return findings;
}

function runFreeCatch(file: FileDiff): {
  results: Array<CatchResult | ProRenderedFinding>;
  proGaps: ProGap[];
  didNotRun: boolean;
  scanLimits: string[];
} {
  const outcome = checkCodeWithGaps(file.blob, file.language);
  const scanLimits: string[] = [];
  if (outcome.inputTruncated) scanLimits.push(catchInputTruncatedLine(INPUT_LINE_CAP));
  if (outcome.hitsOmitted > 0) scanLimits.push(catchHitsOmittedLine(outcome.hitsOmitted));
  return {
    results: outcome.results,
    proGaps: outcome.proGaps,
    didNotRun: outcome.didNotRun,
    scanLimits,
  };
}

function scanLimitNoteFromPro(pro: ProFileOutcome, hasFindings: boolean): string | undefined {
  if (pro.complete) return undefined;
  const fromServer = pro.text.trim();
  if (hasFindings) {
    return 'the paid scan hit one of its own limits, see its answer on this file above';
  }
  return fromServer || 'the paid scan hit one of its own limits and did not say which';
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
  const didNotRunFiles: string[] = [];
  let proDegraded = false;
  let checkDidNotRun = false;
  let checkDidNotRunReason: RunResult['checkDidNotRunReason'];

  if (opts.proUrl && opts.licenseKey && files.length > 0) {
    try {
      const proByFile = await fetchProBatch(opts.proUrl, opts.licenseKey, files, opts.instanceId);
      for (const file of files) {
        const pro = proByFile.get(file.filename);
        if (!pro) {
          console.error(`[lumo] Pro MCP returned no result for ${file.filename}, falling back to free catch`);
          proDegraded = true;
          const free = runFreeCatch(file);
          if (free.didNotRun) didNotRunFiles.push(file.filename);
          findings.push(...findingsFromResults(file.filename, free.results, free.proGaps));
          for (const note of free.scanLimits) {
            scanLimits.push({ filename: file.filename, note });
          }
          continue;
        }

        const fileFindings = findingsFromResults(file.filename, pro.results, []);
        findings.push(...fileFindings);
        const limitNote = scanLimitNoteFromPro(pro, fileFindings.length > 0);
        if (limitNote) scanLimits.push({ filename: file.filename, note: limitNote });
      }
    } catch (err) {
      if (err instanceof ProCheckBlockedError) {
        checkDidNotRun = true;
        checkDidNotRunReason = err.reason;
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[lumo] Pro MCP did not deliver a check (${msg}), falling back to free catch`);
        proDegraded = true;
        for (const file of files) {
          const free = runFreeCatch(file);
          if (free.didNotRun) didNotRunFiles.push(file.filename);
          findings.push(...findingsFromResults(file.filename, free.results, free.proGaps));
          for (const note of free.scanLimits) {
            scanLimits.push({ filename: file.filename, note });
          }
        }
      }
    }
  } else {
    for (const file of files) {
      const free = runFreeCatch(file);
      if (free.didNotRun) didNotRunFiles.push(file.filename);
      findings.push(...findingsFromResults(file.filename, free.results, free.proGaps));
      for (const note of free.scanLimits) {
        scanLimits.push({ filename: file.filename, note });
      }
    }
  }

  const loudCount = findings.filter((f) => f.tier === 'LOUD').length;
  const softCount = findings.filter((f) => f.tier === 'SOFT').length;

  return {
    loudCount,
    softCount,
    findings,
    proDegraded,
    checkDidNotRun,
    checkDidNotRunReason,
    scanLimits,
    didNotRunFiles,
  };
}
