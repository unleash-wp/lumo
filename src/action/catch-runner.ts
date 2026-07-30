/**
 * Core catch orchestration for the Lumo GitHub Action.
 *
 * Pure logic layer — no GitHub API calls, no process.exit.
 * Consumes checkCode() + formatCatch() from the free catch engine and
 * returns structured findings the action entry-point posts as review comments.
 *
 * Pro seam: when proUrl + licenseKey are present, calls the Pro MCP server's
 * wp_check_code tool via the MCP JSON-RPC HTTP protocol. Falls back to the
 * free catch if the Pro server is unreachable.
 */

import { parseDiff } from './diff-parser.js';
import type { FileDiff } from './diff-parser.js';
import type { CatchResult, CatchTier, ProGap } from '../detection/catch.js';
import { checkCodeWithGaps } from '../detection/catch.js';
import { formatCatch, buildCodeProTeaser, buildCodeProGapLine } from '../lib/render.js';

export interface Finding {
  filename: string;
  tier: CatchTier;
  /** Rendered Markdown — verbatim from formatCatch(). */
  body: string;
}

export interface RunResult {
  loudCount: number;
  softCount: number;
  findings: Finding[];
}

// ---------------------------------------------------------------------------
// Pro path — MCP JSON-RPC call against the licensed Pro server.
// Returns raw results; each pre-rendered finding comes back as a single SOFT
// sentinel (the Pro server enforces its own tier; we never re-classify here).
// ---------------------------------------------------------------------------

interface ProRenderedFinding {
  _proRendered: true;
  body: string;
}

async function fetchProResults(
  proUrl: string,
  licenseKey: string,
  code: string,
  language: 'php' | 'js',
): Promise<Array<CatchResult | ProRenderedFinding>> {
  const url = `${proUrl.replace(/\/$/, '')}/mcp`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${licenseKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'wp_check_code',
        arguments: { code, language },
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Pro MCP responded ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as {
    result?: {
      content?: Array<{ type: string; text?: string }>;
      structuredContent?: { found?: boolean };
    };
  };

  const text = json?.result?.content?.[0]?.text ?? '';

  // The Pro server states its verdict as data: structuredContent.found. Decide
  // on the flag, never on the prose — the old string comparison matched a
  // sentence the server never sent, so every clean Pro answer was wrapped as a
  // finding. Fallback for servers predating the flag: the server's ACTUAL
  // neutral wording. Fail direction on total uncertainty: treat as a finding
  // (a false alarm), never as an all-clear.
  const found = json?.result?.structuredContent?.found;
  if (found === false) return [];
  // trim: a single trailing newline from the transport must not turn the
  // neutral sentence into a phantom finding.
  if (
    found === undefined &&
    (!text.trim() || text.trim() === 'No known issues detected in the submitted code.')
  ) {
    return [];
  }
  if (!text.trim()) return [];

  // Pro result is already rendered Markdown from the Pro server.
  return [{ _proRendered: true as const, body: text }];
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
): Promise<Finding[]> {
  let results: Array<CatchResult | ProRenderedFinding>;
  // Set only on the free path: Pro has the knowledge, so it reports no gap.
  let proGap: ProGap | undefined;

  if (proUrl && licenseKey) {
    try {
      results = await fetchProResults(proUrl, licenseKey, file.blob, file.language);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[lumo] Pro MCP unreachable (${msg}), falling back to free catch`);
      ({ results, proGap } = checkCodeWithGaps(file.blob, file.language));
    }
  } else {
    ({ results, proGap } = checkCodeWithGaps(file.blob, file.language));
  }

  const findings: Finding[] = results.map((r) => {
    if (isProRendered(r)) {
      // Pro server pre-renders; surface as SOFT so it never triggers fail_on_loud
      // (the Pro server itself controls blocking via its own tier model).
      return { filename: file.filename, tier: 'SOFT' as CatchTier, body: r.body };
    }
    return {
      filename: file.filename,
      tier: r.tier,
      body: formatCatch(r),
    };
  });

  // A Pro-only signal fired on this file. Without this the Action reports "no
  // findings" on a WooCommerce pull request — the same false all-clear the tool
  // and hook paths already fixed, in the channel where nobody is watching live.
  //
  // Always SOFT: a coverage gap is not a defect in the contributor's code, so it
  // must never fail a build through fail_on_loud.
  if (proGap) {
    findings.push({
      filename: file.filename,
      tier: 'SOFT' as CatchTier,
      body:
        findings.length === 0
          ? buildCodeProTeaser(proGap.pluginName)
          : buildCodeProGapLine(proGap.pluginName),
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Main exported runner — injectable for tests
// ---------------------------------------------------------------------------

export interface RunCatchOptions {
  diff: string;
  proUrl?: string;
  licenseKey?: string;
}

export async function runCatch(opts: RunCatchOptions): Promise<RunResult> {
  const files = parseDiff(opts.diff);
  const findings: Finding[] = [];

  for (const file of files) {
    const fileFindings = await catchFile(file, opts.proUrl, opts.licenseKey);
    findings.push(...fileFindings);
  }

  const loudCount = findings.filter((f) => f.tier === 'LOUD').length;
  const softCount = findings.filter((f) => f.tier === 'SOFT').length;

  return { loudCount, softCount, findings };
}
