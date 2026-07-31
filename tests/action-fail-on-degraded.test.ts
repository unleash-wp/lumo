/**
 * The opt-in gate on a degraded run (issue #99).
 *
 * A run where the paid check did not deliver stays green by default, and that
 * default is the product decision: our outage must not fail a contributor's
 * build. The pair below is what keeps both halves honest — the default really
 * does stay green, and the opt-in really does bite.
 *
 * The scan-limit half matters most. Those limits describe how far the scanner
 * read, not what the contributor wrote, and no setting may turn one into a red
 * check. They are absent from the signature so that cannot be configured back
 * in by accident.
 */

import { describe, it, expect } from 'vitest';
import { failsOnDegraded } from '../src/action/main.js';
import { ACTION_PRO_DEGRADED_FAIL_LINE } from '../src/lib/render.js';

describe('fail_on_degraded — default off', () => {
  it.each([
    ['unset', ''],
    ['explicitly false', 'false'],
    ['whitespace only', '   '],
    ['any other value', 'yes'],
  ])('SILENCE: a degraded run with the input %s stays green', (_name, input) => {
    expect(failsOnDegraded(input, true)).toBe(false);
  });
});

describe('fail_on_degraded — opted in', () => {
  it.each([
    ['true', 'true'],
    ['padded', '  true  '],
    ['capitalised', 'TRUE'],
  ])('BELL: a degraded run with the input %s fails', (_name, input) => {
    expect(failsOnDegraded(input, true)).toBe(true);
  });
});

describe('fail_on_degraded — only a degraded run is gated', () => {
  it.each([
    ['unset', ''],
    ['opted in', 'true'],
  ])('a run that did not degrade stays green with the input %s', (_name, input) => {
    expect(failsOnDegraded(input, false)).toBe(false);
  });

  // Not a parameter, on purpose. A run whose only issue is a scan limit has no
  // proDegraded to gate on, so it stays green under both settings — the same
  // guarantee the notice makes in prose, held here by the signature.
  it('has no way to be told about a scan limit', () => {
    expect(failsOnDegraded.length).toBe(2);
  });
});

describe('fail_on_degraded — the failure names the cause', () => {
  it('blames the server, not the pull request, and says how to turn it off', () => {
    expect(ACTION_PRO_DEGRADED_FAIL_LINE).toContain('the Pro server, not the code');
    expect(ACTION_PRO_DEGRADED_FAIL_LINE).toContain('fail_on_degraded');
  });
});
