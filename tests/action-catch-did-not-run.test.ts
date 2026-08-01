/**
 * #113: the free catch's own outer catch (checkCodeWithGaps.didNotRun) must
 * not be silently absorbed into "no findings". A file where the engine
 * itself failed was never checked, and the Action / lumo scan must say so
 * instead of letting it read as a clean pass alongside files that actually
 * ran clean.
 */

import { describe, it, expect, vi } from 'vitest';
import type * as CatchModule from '../src/detection/catch.js';
import type { Snapshot } from '../src/types.js';

vi.mock('../src/detection/catch.js', async (importOriginal) => {
  const actual = await importOriginal<typeof CatchModule>();
  return {
    ...actual,
    checkCodeWithGaps: (
      code: string,
      language: 'php' | 'js' | 'auto' = 'auto',
      snapshot?: Snapshot,
      overrides?: CatchModule.CatchOverrides,
    ): CatchModule.CheckCodeOutcome => {
      // Simulate the engine's outer catch firing (e.g. a broken snapshot) for
      // one specific marker, and behave normally for everything else.
      if (code.includes('TRIGGER_ENGINE_FAILURE')) {
        return { results: [], proGaps: [], inputTruncated: false, hitsOmitted: 0, didNotRun: true };
      }
      return actual.checkCodeWithGaps(code, language, snapshot, overrides);
    },
  };
});

const { runCatch } = await import('../src/action/catch-runner.js');

function diffFor(filename: string, addedLine: string): string {
  return [
    `diff --git a/${filename} b/${filename}`,
    `--- a/${filename}`,
    `+++ b/${filename}`,
    '@@ -1,1 +1,2 @@',
    '+<?php',
    `+${addedLine}`,
  ].join('\n');
}

describe('runCatch: a crashed free catch surfaces as didNotRunFiles, not a clean pass', () => {
  it('BELL: the file whose engine crashed is named, findings stay empty', async () => {
    const res = await runCatch({ diff: diffFor('inc/broken.php', 'echo "TRIGGER_ENGINE_FAILURE";') });
    expect(res.didNotRunFiles).toEqual(['inc/broken.php']);
    expect(res.findings).toEqual([]);
  });

  it('SILENCE: a normal clean file is never listed in didNotRunFiles', async () => {
    const res = await runCatch({
      diff: diffFor('inc/ok.php', "echo esc_html__( 'Hi', 'my-plugin' );"),
    });
    expect(res.didNotRunFiles).toEqual([]);
  });

  it('a real finding on one file and an engine crash on another both surface, independently', async () => {
    const diff = [
      diffFor('inc/broken.php', 'echo "TRIGGER_ENGINE_FAILURE";'),
      diffFor(
        'inc/vuln.php',
        '$wpdb->query( "SELECT * FROM wp_posts WHERE id = $id" );',
      ),
    ].join('\n');
    const res = await runCatch({ diff });
    expect(res.didNotRunFiles).toEqual(['inc/broken.php']);
    expect(res.findings.length).toBeGreaterThan(0);
    expect(res.findings.every((f) => f.filename === 'inc/vuln.php')).toBe(true);
  });
});
