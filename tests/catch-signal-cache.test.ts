import { describe, it, expect, beforeEach } from 'vitest';
import { checkCode, invalidateCatchSignalCache } from '../src/detection/catch.js';
import { loadSnapshot } from '../src/lib/snapshot.js';

const CORE_LOUD = `isValidBlockContent( blockType, attrs, inner, html );`;

describe('free catch signal cache (PERF-P0-2)', () => {
  beforeEach(() => {
    invalidateCatchSignalCache();
  });

  it('BELL: known bad still fires after cache warm-up', () => {
    const snap = loadSnapshot();
    checkCode(CORE_LOUD, 'js', snap);
    const second = checkCode(CORE_LOUD, 'js', snap);
    expect(second.some((r) => r.tier === 'LOUD')).toBe(true);
  });

  it('SILENCE: near case stays silent with warm cache', () => {
    const snap = loadSnapshot();
    checkCode(CORE_LOUD, 'js', snap);
    const clean = checkCode('const x = 1;', 'js', snap);
    expect(clean).toHaveLength(0);
  });
});
