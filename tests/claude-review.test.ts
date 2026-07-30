/**
 * The autonomous review stage — fenced, grounded, fail-open.
 *
 * What matters here is not what the model says (that is not testable), but the
 * fences: the prompt carries the engine's findings and the no-version-claims
 * rule, and ANY API failure degrades to null so CI never couples to a review
 * outage.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { buildReviewPrompt, runClaudeReview } from '../src/action/claude-review.js';

const INPUT = {
  diff: 'diff --git a/x.php b/x.php\n+<?php echo $_GET["a"];',
  findings: [
    { filename: 'x.php', tier: 'SOFT', body: '## Superglobal without sanitisation' },
  ],
  model: 'claude-sonnet-5',
};

afterEach(() => vi.unstubAllGlobals());

describe('prompt fences', () => {
  it('hands the engine findings over as established ground truth', () => {
    const p = buildReviewPrompt(INPUT);
    expect(p).toContain('Superglobal without sanitisation');
    expect(p).toContain('do NOT repeat them');
  });

  it('forbids fresh version claims — those stay with the engine', () => {
    const p = buildReviewPrompt(INPUT);
    expect(p).toContain('NEVER state that an API changed/was deprecated in a specific version');
  });

  it('pins the grounding contract: quote-or-delete, diff-only knowledge, silence in doubt', () => {
    const p = buildReviewPrompt(INPUT);
    // Copy-regression on the anti-hallucination fences — if one of these lines
    // leaves the prompt, a model may again assert code it cannot see.
    expect(p).toContain('No quote, no point.');
    expect(p).toContain('Use ONLY the diff and the established findings above');
    expect(p).toContain('If you are unsure whether a point is real, leave it out');
  });

  it('says so when the engine found nothing, instead of hiding it', () => {
    const p = buildReviewPrompt({ ...INPUT, findings: [] });
    expect(p).toContain('none — the rule engine found nothing it covers');
  });

  it('a giant diff is truncated and the prompt demands the reply admits it', () => {
    const p = buildReviewPrompt({ ...INPUT, diff: 'x'.repeat(70_000) });
    expect(p).toContain('the diff was truncated');
    expect(p.length).toBeLessThan(70_000);
  });
});

describe('fail-open', () => {
  it('returns the review body on a good response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: '1. Looks fine.' }] }),
      })),
    );
    const r = await runClaudeReview('key', INPUT);
    expect(r?.body).toBe('1. Looks fine.');
  });

  it.each([
    ['HTTP error', async () => ({ ok: false, json: async () => ({}) })],
    ['network throw', async () => Promise.reject(new Error('boom'))],
    ['empty content', async () => ({ ok: true, json: async () => ({ content: [] }) })],
  ])('%s degrades to null, never throws', async (_name, impl) => {
    vi.stubGlobal('fetch', vi.fn(impl as never));
    await expect(runClaudeReview('key', INPUT)).resolves.toBeNull();
  });
});
