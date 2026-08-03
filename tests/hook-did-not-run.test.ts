import { describe, expect, it, vi } from 'vitest';
import type * as CatchModule from '../src/detection/catch.js';
import type { Snapshot } from '../src/types.js';
import { CATCH_DID_NOT_RUN_LINE, CATCH_NEUTRAL_LINE } from '../src/lib/render.js';

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
      if (code.includes('TRIGGER_HOOK_ENGINE_FAILURE')) {
        throw new Error('simulated hook engine failure');
      }
      if (code.includes('TRIGGER_CATCH_DID_NOT_RUN')) {
        return { results: [], proGaps: [], inputTruncated: false, hitsOmitted: 0, didNotRun: true };
      }
      return actual.checkCodeWithGaps(code, language, snapshot, overrides);
    },
  };
});

const { runHookCatch } = await import('../src/hook/catch-runner.js');

describe('runHookCatch failure disclosure', () => {
  it('BELL: returns DID NOT RUN when the catch engine cannot produce a verdict', () => {
    const result = runHookCatch('<?php // TRIGGER_HOOK_ENGINE_FAILURE', 'php');

    expect(result).toMatchObject({
      tier: null,
      message: CATCH_DID_NOT_RUN_LINE,
      loudCount: 0,
      softCount: 0,
      didNotRun: true,
      hasCoverageGap: false,
    });
  });

  it('BELL: preserves the catch engine’s unavailable verdict', () => {
    const result = runHookCatch('<?php // TRIGGER_CATCH_DID_NOT_RUN', 'php');

    expect(result.didNotRun).toBe(true);
    expect(result.message).toBe(CATCH_DID_NOT_RUN_LINE);
  });

  it('SILENCE: a completed no-match result remains neutral and is not marked failed', () => {
    const result = runHookCatch('<?php echo esc_html__( "Hello", "plugin" );', 'php');

    expect(result).toMatchObject({
      tier: null,
      message: CATCH_NEUTRAL_LINE,
      didNotRun: false,
      hasCoverageGap: false,
    });
  });
});
