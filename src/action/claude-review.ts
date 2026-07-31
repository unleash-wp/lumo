/**
 * Optional autonomous review stage for the GitHub Action.
 *
 * The rule engine stays the authority: its findings are deterministic, sourced
 * and tiered, and they alone decide the exit code. This stage adds what a rule
 * cannot (reading the diff as a WordPress developer would) and it is fenced
 * accordingly:
 *
 *   - OFF by default. It runs only when the workflow passes an
 *     `anthropic_api_key`; no key, no call, byte-identical behaviour to before.
 *   - Advisory only. Its output is one PR comment; it never fails a build,
 *     never changes counts, never suppresses an engine finding.
 *   - Grounded. The prompt hands the engine's findings over as established
 *     facts and forbids fresh version claims: anything the model flags beyond
 *     them must be phrased as a review observation, not as a dated fact.
 *   - Fail-open. Any API error, timeout or unparseable response degrades to
 *     "no review comment", logged: a review outage must never break CI.
 */

export interface ReviewInput {
  diff: string;
  /** Rendered engine findings (already posted as comments): the ground truth. */
  findings: Array<{ filename: string; tier: string; body: string }>;
  model: string;
}

const MAX_DIFF_CHARS = 60_000; // ~15k tokens, beyond this, review the head and say so.

export function buildReviewPrompt(input: ReviewInput): string {
  const truncated = input.diff.length > MAX_DIFF_CHARS;
  // Cut on a line boundary: a diff sliced mid-line reads as corrupted code and
  // invites the model to comment on an artifact of the cut.
  const head = input.diff.slice(0, MAX_DIFF_CHARS);
  const diff = truncated ? head.slice(0, head.lastIndexOf('\n') + 1 || undefined) : input.diff;

  const findingsBlock =
    input.findings.length === 0
      ? '(none: the rule engine found nothing it covers)'
      : input.findings
          .map((f) => `- [${f.tier}] ${f.filename}: ${f.body.split('\n')[0]}`)
          .join('\n');

  return [
    'You are a senior WordPress engineer reviewing a pull request diff.',
    '',
    'Established findings from the deterministic rule engine (already posted,',
    'do NOT repeat them, build on them):',
    findingsBlock,
    '',
    'Review ONLY the added lines of the diff below. Focus, in order:',
    '1. Security: capability checks, nonces, sanitisation at entry, escaping at output.',
    '2. WordPress correctness: hook usage, API misuse, i18n, HPOS-safe order access.',
    '3. Performance: queries in loops, unbounded get_posts, missing caching.',
    '',
    'Hard rules:',
    '- NEVER state that an API changed/was deprecated in a specific version.',
    '  Version claims are the rule engine\'s job; it cites sources, you cannot.',
    '- Only comment on code visible in the added lines. No speculation about',
    '  code you cannot see; say "cannot verify from this diff" where it matters.',
    '- Every point MUST contain a verbatim quote of at least one added line.',
    '  Before you answer, re-check each point: if its quote does not appear',
    '  verbatim in the diff below, DELETE the point. No quote, no point.',
    '- Use ONLY the diff and the established findings above. Never describe the',
    '  contents of files, functions or hooks that are not visible here, however',
    '  confident you feel about them.',
    '- If you are unsure whether a point is real, leave it out. A missed nitpick',
    '  costs little; a fabricated concern costs trust.',
    '- If the diff is fine beyond the established findings, say exactly that in',
    '  one sentence. Do not manufacture concerns.',
    '- Output: GitHub-flavoured Markdown. Up to 5 numbered points, each with',
    '  the file path and a short quoted snippet. No preamble, no sign-off.',
    truncated ? '- NOTE: the diff was truncated; state this limit in your reply.' : '',
    '',
    '```diff',
    diff,
    '```',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

export interface ClaudeReviewResult {
  body: string;
}

/**
 * One Messages-API call. Returns null on ANY failure: the caller logs and
 * moves on; CI outcome is never coupled to this stage.
 */
export async function runClaudeReview(
  apiKey: string,
  input: ReviewInput,
): Promise<ClaudeReviewResult | null> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: 1500,
        messages: [{ role: 'user', content: buildReviewPrompt(input) }],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = json.content?.find((c) => c.type === 'text')?.text?.trim();
    if (!text) return null;
    return { body: text };
  } catch {
    return null;
  }
}
