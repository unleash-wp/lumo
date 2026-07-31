/**
 * Tests for the pure version-comparison utilities.
 *
 * Covers:
 *   compareVersions, part-wise numeric comparison, zero-pad, garbage tolerance
 *   resolveVersionState, already-broken / upcoming / unknown, boundary, nulls
 */

import { describe, it, expect } from 'vitest';
import { compareVersions, resolveVersionState } from '../src/lib/version.js';

// ---------------------------------------------------------------------------
// compareVersions
// ---------------------------------------------------------------------------

describe('compareVersions', () => {
  it('6.9 < 7.0', () => {
    expect(compareVersions('6.9', '7.0')).toBe(-1);
  });

  it('6.4 == 6.4.0 (missing part treated as 0)', () => {
    expect(compareVersions('6.4', '6.4.0')).toBe(0);
  });

  it('8.2 < 8.2.1', () => {
    expect(compareVersions('8.2', '8.2.1')).toBe(-1);
  });

  it('8.2.1 > 8.2', () => {
    expect(compareVersions('8.2.1', '8.2')).toBe(1);
  });

  it('7.0 > 6.9', () => {
    expect(compareVersions('7.0', '6.9')).toBe(1);
  });

  it('same version returns 0', () => {
    expect(compareVersions('6.9', '6.9')).toBe(0);
  });

  it('garbage string is treated as 0, does not throw', () => {
    expect(() => compareVersions('garbage', '6.9')).not.toThrow();
    // 'garbage' → 0, so 0 < 6.9 → -1
    expect(compareVersions('garbage', '6.9')).toBe(-1);
  });

  it('empty string does not throw and is treated as 0', () => {
    expect(() => compareVersions('', '1.0')).not.toThrow();
    expect(compareVersions('', '1.0')).toBe(-1);
  });

  it('both garbage → 0 == 0 → returns 0', () => {
    expect(compareVersions('abc', 'xyz')).toBe(0);
  });

  it('three-part vs two-part: 6.4.1 > 6.4', () => {
    expect(compareVersions('6.4.1', '6.4')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// resolveVersionState
// ---------------------------------------------------------------------------

describe('resolveVersionState', () => {
  it('project >= breaking → already-broken (equal boundary)', () => {
    expect(resolveVersionState('8.2', '8.2')).toBe('already-broken');
  });

  it('project > breaking → already-broken', () => {
    expect(resolveVersionState('8.3', '8.2')).toBe('already-broken');
  });

  it('project < breaking → upcoming', () => {
    expect(resolveVersionState('6.8', '6.9')).toBe('upcoming');
  });

  it('project well past breaking → already-broken', () => {
    expect(resolveVersionState('7.0', '6.4')).toBe('already-broken');
  });

  it('null projectVersion → unknown', () => {
    expect(resolveVersionState(null, '6.9')).toBe('unknown');
  });

  it('undefined projectVersion → unknown', () => {
    expect(resolveVersionState(undefined, '6.9')).toBe('unknown');
  });

  it('null breakingVersion → unknown', () => {
    expect(resolveVersionState('6.9', null)).toBe('unknown');
  });

  it('both null → unknown', () => {
    expect(resolveVersionState(null, null)).toBe('unknown');
  });

  it('empty string projectVersion → unknown', () => {
    expect(resolveVersionState('', '6.9')).toBe('unknown');
  });

  it('purely non-numeric projectVersion → unknown', () => {
    expect(resolveVersionState('garbage', '6.9')).toBe('unknown');
  });

  it('purely non-numeric breakingVersion → unknown', () => {
    expect(resolveVersionState('6.9', 'garbage')).toBe('unknown');
  });

  it('3-part vs 2-part: 6.4.0 on breaking 6.4 → already-broken', () => {
    expect(resolveVersionState('6.4.0', '6.4')).toBe('already-broken');
  });

  it('upcoming with 3-part versions: 6.3.2 before 6.4', () => {
    expect(resolveVersionState('6.3.2', '6.4')).toBe('upcoming');
  });
});
