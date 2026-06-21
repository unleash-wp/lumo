import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildEvent,
  isActivation,
  recordEvent,
  hasOnboarded,
  getOrAssignVariant,
} from '../src/lib/events.js';
import type { LumoEvent, OnboardVariant } from '../src/lib/events.js';

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'lumo-events-test-'));
}

// ---------------------------------------------------------------------------
// buildEvent — pure, deterministic
// ---------------------------------------------------------------------------

describe('buildEvent', () => {
  it('returns byte-equal records for identical inputs', () => {
    const input = { type: 'install' as const, at: '2026-06-21T14:00:00Z', variant: 'A' as const };
    expect(buildEvent(input)).toEqual(buildEvent(input));
    expect(JSON.stringify(buildEvent(input))).toBe(JSON.stringify(buildEvent(input)));
  });

  it('includes only defined optional fields', () => {
    const e = buildEvent({ type: 'activation', at: '2026-06-21T14:00:00Z', variant: 'B', target: 'own', gated: true });
    expect(e.target).toBe('own');
    expect(e.gated).toBe(true);
    expect('ms_since_install' in e).toBe(false);
  });

  it('omits undefined optional fields so output is compact', () => {
    const e = buildEvent({ type: 'onboarded', at: '2026-06-21T14:00:00Z', variant: 'A' });
    expect('target' in e).toBe(false);
    expect('gated' in e).toBe(false);
    expect('ms_since_install' in e).toBe(false);
  });

  it('passes ms_since_install through when provided', () => {
    const e = buildEvent({ type: 'activation', at: '2026-06-21T14:00:00Z', variant: 'A', ms_since_install: 42000 });
    expect(e.ms_since_install).toBe(42000);
  });

  it('carries variant on every event type', () => {
    for (const type of ['install', 'onboarded', 'activation', 'no_target'] as const) {
      const e = buildEvent({ type, at: '2026-06-21T00:00:00Z', variant: 'B' });
      expect(e.variant).toBe('B');
    }
  });
});

// ---------------------------------------------------------------------------
// isActivation — activation predicate
// ---------------------------------------------------------------------------

describe('isActivation', () => {
  it('returns true for own-code gated activation', () => {
    expect(isActivation({ type: 'activation', target: 'own', gated: true })).toBe(true);
  });

  it('returns false for sample target — sample saves are never activation', () => {
    expect(isActivation({ type: 'activation', target: 'sample', gated: true })).toBe(false);
  });

  it('returns false when gated is false — ungated catch is not activation', () => {
    expect(isActivation({ type: 'activation', target: 'own', gated: false })).toBe(false);
  });

  it('returns false for no_target type', () => {
    expect(isActivation({ type: 'no_target', target: 'own', gated: true })).toBe(false);
  });

  it('returns false for onboarded type', () => {
    expect(isActivation({ type: 'onboarded' })).toBe(false);
  });

  it('returns false for install type', () => {
    expect(isActivation({ type: 'install' })).toBe(false);
  });

  it('returns false when target is missing', () => {
    expect(isActivation({ type: 'activation', gated: true })).toBe(false);
  });

  it('returns false when gated is missing', () => {
    expect(isActivation({ type: 'activation', target: 'own' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// recordEvent + hasOnboarded — against a tmp stateDir
// ---------------------------------------------------------------------------

describe('recordEvent + hasOnboarded', () => {
  it('hasOnboarded returns false on an empty dir', () => {
    const dir = makeTmpDir();
    expect(hasOnboarded(dir)).toBe(false);
  });

  it('hasOnboarded returns false when only a non-install event is recorded', () => {
    const dir = makeTmpDir();
    const e: LumoEvent = buildEvent({ type: 'onboarded', at: '2026-06-21T14:00:00Z', variant: 'A' });
    recordEvent(e, dir);
    expect(hasOnboarded(dir)).toBe(false);
  });

  it('hasOnboarded flips true once an install line is written', () => {
    const dir = makeTmpDir();
    recordEvent(buildEvent({ type: 'install', at: '2026-06-21T14:00:00Z', variant: 'A' }), dir);
    expect(hasOnboarded(dir)).toBe(true);
  });

  it('appended lines are preserved in order', () => {
    const dir = makeTmpDir();
    const e1: LumoEvent = buildEvent({ type: 'install', at: '2026-06-21T14:00:00Z', variant: 'A' });
    const e2: LumoEvent = buildEvent({ type: 'onboarded', at: '2026-06-21T14:01:00Z', variant: 'A' });
    recordEvent(e1, dir);
    recordEvent(e2, dir);
    const lines = readFileSync(join(dir, 'events.jsonl'), 'utf8')
      .split('\n')
      .filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!).type).toBe('install');
    expect(JSON.parse(lines[1]!).type).toBe('onboarded');
  });

  it('fail-open: garbage trailing line does not throw on hasOnboarded', () => {
    const dir = makeTmpDir();
    // Write a valid install line then append a partial/garbage line
    recordEvent(buildEvent({ type: 'install', at: '2026-06-21T14:00:00Z', variant: 'A' }), dir);
    appendGarbageLine(dir);
    expect(() => hasOnboarded(dir)).not.toThrow();
    expect(hasOnboarded(dir)).toBe(true);
  });

  it('fail-open: recordEvent does not throw when dir is unwritable path', () => {
    const e = buildEvent({ type: 'install', at: '2026-06-21T14:00:00Z', variant: 'A' });
    // Pass a path that cannot be created (a file used as a directory)
    const dir = makeTmpDir();
    writeFileSync(join(dir, 'blocker'), 'x');
    expect(() => recordEvent(e, join(dir, 'blocker', 'subdir'))).not.toThrow();
  });
});

function appendGarbageLine(dir: string): void {
  appendFileSync(join(dir, 'events.jsonl'), '{partial json without closing brace\n', 'utf8');
}

// ---------------------------------------------------------------------------
// getOrAssignVariant — write-once, both arms reachable, default on failure
// ---------------------------------------------------------------------------

describe('getOrAssignVariant', () => {
  it('returns A or B (valid variant)', () => {
    const dir = makeTmpDir();
    const v = getOrAssignVariant(dir);
    expect(['A', 'B']).toContain(v);
  });

  it('is write-once: subsequent calls return the same value', () => {
    const dir = makeTmpDir();
    const first = getOrAssignVariant(dir);
    expect(getOrAssignVariant(dir)).toBe(first);
    expect(getOrAssignVariant(dir)).toBe(first);
  });

  it('persists the variant to the state dir', () => {
    const dir = makeTmpDir();
    const v = getOrAssignVariant(dir);
    const stored = readFileSync(join(dir, 'variant'), 'utf8').trim();
    expect(stored).toBe(v);
  });

  it('reassigns when stored file contains unexpected content', () => {
    const dir = makeTmpDir();
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'variant'), 'X', 'utf8');
    // Falls through to assign — random draw, but does not crash
    const v = getOrAssignVariant(dir);
    expect(['A', 'B']).toContain(v);
  });

  it('defaults to A on read/write failure (unwritable path)', () => {
    const dir = makeTmpDir();
    // Use a path where the parent is a file, so mkdirSync and writeFileSync fail
    writeFileSync(join(dir, 'blocker'), 'x');
    const v = getOrAssignVariant(join(dir, 'blocker', 'subdir'));
    expect(v).toBe('A');
  });

  it('both A and B are reachable across many fresh dirs', () => {
    const seen = new Set<OnboardVariant>();
    for (let i = 0; i < 100 && seen.size < 2; i++) {
      seen.add(getOrAssignVariant(makeTmpDir()));
    }
    expect(seen.has('A')).toBe(true);
    expect(seen.has('B')).toBe(true);
  });
});
