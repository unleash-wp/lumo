/**
 * A green check with nothing beside it is a passed review, to every human who
 * looks at it.
 *
 * Two paths in the Action end without checking anything and still leave the
 * check green on purpose, no licence, and no covered pattern in the diff.
 * Both carried a sentence saying so, and both wrote it with `core.info`, which
 * puts it in a step log nobody opens when a check is green. The sentence was
 * true, correctly worded, product-gated, and invisible at the only moment it
 * mattered.
 *
 * The unlicensed path is the first thing anyone evaluating Lumo meets, so it is
 * annotated as well as summarised. The quiet-diff path is summarised only: a
 * yellow warning on every uneventful pull request is what gets a tool muted,
 * and a muted tool is worse than a quiet one.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const write = vi.fn(async () => undefined);
const addRaw = vi.fn(() => ({ write }));
const addHeading = vi.fn(() => ({ addRaw }));

vi.mock('@actions/core', () => ({
  info: vi.fn(),
  warning: vi.fn(),
  setSecret: vi.fn(),
  setFailed: vi.fn(),
  getInput: vi.fn(() => ''),
  summary: { addHeading },
}));

const core = await import('@actions/core');
const { announce } = await import('../src/action/main.js');

const SUMMARY_ENV = 'GITHUB_STEP_SUMMARY';

beforeEach(() => {
  vi.clearAllMocks();
  process.env[SUMMARY_ENV] = '/tmp/lumo-test-summary';
});

afterEach(() => {
  delete process.env[SUMMARY_ENV];
});

describe('a check that did not run says so where it is seen', () => {
  it('annotates when asked, so the message sits beside the tick', async () => {
    await announce('Lumo: DID NOT RUN', 'nothing was checked', true);

    expect(core.warning).toHaveBeenCalledWith('nothing was checked');
    expect(core.info).not.toHaveBeenCalled();
  });

  it('stays out of the annotations when not asked', async () => {
    await announce('Lumo: nothing matched', 'no covered pattern matched', false);

    expect(core.warning).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalled();
  });

  it('writes the job summary either way: the log is not a channel', async () => {
    await announce('Lumo: nothing matched', 'no covered pattern matched', false);

    expect(addHeading).toHaveBeenCalledWith('Lumo: nothing matched', 3);
    expect(addRaw).toHaveBeenCalledWith('no covered pattern matched');
    expect(write).toHaveBeenCalled();
  });

  it('does not die where there is no summary file', async () => {
    // core.summary.write() throws without the environment variable, and the
    // runner is invoked outside Actions by tests and by hand.
    delete process.env[SUMMARY_ENV];

    await expect(announce('h', 'line', false)).resolves.toBeUndefined();
    expect(write).not.toHaveBeenCalled();
  });
});

describe('both silent paths use it', () => {
  // A behavioural test would have to drive main() through the GitHub API. This
  // pins the call sites instead: the regression is someone reaching for
  // core.info again, and that is visible in the source.
  const source = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'action', 'main.ts'),
    'utf8',
  );

  it('the unlicensed path announces and annotates', () => {
    expect(source).toMatch(/announce\(\s*'Lumo: DID NOT RUN',\s*ACTION_REQUIRES_PRO_LINE,\s*true\s*\)/);
  });

  it('the quiet-diff path announces without annotating', () => {
    expect(source).toMatch(/announce\(\s*'Lumo: nothing matched',\s*ACTION_NO_MATCH_LINE,\s*false\s*\)/);
  });

  it('neither line is written straight to the log', () => {
    expect(source).not.toMatch(/core\.info\(`?\[lumo\] \$\{ACTION_REQUIRES_PRO_LINE\}/);
    expect(source).not.toMatch(/core\.info\(`?\[lumo\] \$\{ACTION_NO_MATCH_LINE\}/);
  });

  it('a config that could not be honoured is annotated, and still falls open', () => {
    expect(source).toMatch(
      /announce\(\s*'Lumo: configuration ignored',\s*ENFORCE_CONFIG_UNREADABLE_LINE,\s*true\s*\)/,
    );
    // The behaviour must not harden with the reporting: a broken file still
    // means advisory, never a blocked merge.
    expect(source).toMatch(/'unreadable' === resolvedMode \? 'warn-only'|resolvedMode === 'unreadable' \? 'warn-only'/);
  });

  // #113: a file where the free catch itself crashed was never checked. The
  // "nothing matched" line must not fire alongside it, that would be the same
  // false all-clear this whole file exists to prevent, one layer down.
  it('a crashed-engine file gets its own DID NOT RUN notice', () => {
    expect(source).toMatch(/buildCatchDidNotRunNotice\(didNotRunFiles\)/);
  });

  it('nothing-matched is gated on no file having crashed', () => {
    expect(source).toMatch(
      /if \(didNotRunFiles\.length === 0\) \{[\s\S]{0,1200}?announce\(\s*'Lumo: nothing matched',\s*ACTION_NO_MATCH_LINE,\s*false\s*\)/,
    );
  });
});
