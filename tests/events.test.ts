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
  getTelemetryConsent,
  setTelemetryConsent,
  resolveInstallSource,
  readPromptState,
  writePromptState,
  getOrAssignPromptVariant,
} from '../src/lib/events.js';
import type { LumoEvent, OnboardVariant } from '../src/lib/events.js';
import { DEFAULT_PROMPT_STATE } from '../src/lib/prompt.js';

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

// ---------------------------------------------------------------------------
// getTelemetryConsent + setTelemetryConsent — FA-32 opt-in persistence
// ---------------------------------------------------------------------------

describe('getTelemetryConsent', () => {
  it("returns 'unset' on a fresh tmp dir (no telemetry file)", () => {
    const dir = makeTmpDir();
    expect(getTelemetryConsent(dir)).toBe('unset');
  });

  it("returns 'granted' after setTelemetryConsent('granted')", () => {
    const dir = makeTmpDir();
    setTelemetryConsent('granted', dir);
    expect(getTelemetryConsent(dir)).toBe('granted');
  });

  it("returns 'declined' after setTelemetryConsent('declined')", () => {
    const dir = makeTmpDir();
    setTelemetryConsent('declined', dir);
    expect(getTelemetryConsent(dir)).toBe('declined');
  });

  it("persists 'declined' across multiple reads (asked-once semantics)", () => {
    const dir = makeTmpDir();
    setTelemetryConsent('declined', dir);
    expect(getTelemetryConsent(dir)).toBe('declined');
    expect(getTelemetryConsent(dir)).toBe('declined');
    expect(getTelemetryConsent(dir)).toBe('declined');
  });

  it("persists 'granted' across multiple reads", () => {
    const dir = makeTmpDir();
    setTelemetryConsent('granted', dir);
    expect(getTelemetryConsent(dir)).toBe('granted');
    expect(getTelemetryConsent(dir)).toBe('granted');
  });

  it('fail-open: does not throw when stateDir is unwritable', () => {
    const dir = makeTmpDir();
    writeFileSync(join(dir, 'blocker'), 'x');
    expect(() => getTelemetryConsent(join(dir, 'blocker', 'subdir'))).not.toThrow();
    expect(getTelemetryConsent(join(dir, 'blocker', 'subdir'))).toBe('unset');
  });
});

describe('setTelemetryConsent', () => {
  it('fail-open: does not throw when stateDir is unwritable', () => {
    const dir = makeTmpDir();
    writeFileSync(join(dir, 'blocker'), 'x');
    expect(() => setTelemetryConsent('granted', join(dir, 'blocker', 'subdir'))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// resolveInstallSource — FA-34 injectable env
// ---------------------------------------------------------------------------

describe('resolveInstallSource', () => {
  it("returns the LUMO_INSTALL_SOURCE value when present", () => {
    expect(resolveInstallSource({ LUMO_INSTALL_SOURCE: 'wp-community' })).toBe('wp-community');
  });

  it("returns 'unknown' when LUMO_INSTALL_SOURCE is absent", () => {
    expect(resolveInstallSource({})).toBe('unknown');
  });

  it("returns 'unknown' when LUMO_INSTALL_SOURCE is undefined", () => {
    expect(resolveInstallSource({ LUMO_INSTALL_SOURCE: undefined })).toBe('unknown');
  });

  it('passes through arbitrary channel strings without normalisation', () => {
    expect(resolveInstallSource({ LUMO_INSTALL_SOURCE: 'mcp-directory' })).toBe('mcp-directory');
    expect(resolveInstallSource({ LUMO_INSTALL_SOURCE: 'ph' })).toBe('ph');
    expect(resolveInstallSource({ LUMO_INSTALL_SOURCE: 'some-new-channel' })).toBe('some-new-channel');
  });

  it('does not mutate process.env (injectable env, not real env)', () => {
    const before = process.env['LUMO_INSTALL_SOURCE'];
    resolveInstallSource({ LUMO_INSTALL_SOURCE: 'test-channel' });
    expect(process.env['LUMO_INSTALL_SOURCE']).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// buildEvent — prompt_suppressed type
// ---------------------------------------------------------------------------

describe('buildEvent prompt_suppressed', () => {
  it('builds a prompt_suppressed event with prompt_variant and gated_count', () => {
    const e = buildEvent({
      type: 'prompt_suppressed',
      at: '2026-06-21T15:00:00Z',
      variant: 'A',
      prompt_variant: 'calm',
      gated_count: 5,
    });
    expect(e.type).toBe('prompt_suppressed');
    expect(e.prompt_variant).toBe('calm');
    expect(e.gated_count).toBe(5);
    expect(e.variant).toBe('A');
  });

  it('omits undefined optional fields (compact output)', () => {
    const e = buildEvent({
      type: 'prompt_suppressed',
      at: '2026-06-21T15:00:00Z',
      variant: 'B',
      gated_count: 3,
    });
    expect('target' in e).toBe(false);
    expect('tool' in e).toBe(false);
    expect(e.gated_count).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// readPromptState / writePromptState — round-trip + fail-open
// ---------------------------------------------------------------------------

describe('readPromptState', () => {
  it('returns DEFAULT_PROMPT_STATE on a fresh dir (no file)', () => {
    const dir = makeTmpDir();
    const state = readPromptState(dir);
    expect(state.threshold).toBe(DEFAULT_PROMPT_STATE.threshold);
    expect(state.ignoreCount).toBe(DEFAULT_PROMPT_STATE.ignoreCount);
    expect(state.promptVariant).toBe(DEFAULT_PROMPT_STATE.promptVariant);
    expect(state.sessionPromptShown).toBe(false);
    expect(state.sessionRevealShown).toBe(false);
    expect(state.sessionSilenced).toBe(false);
  });

  it('returns DEFAULT_PROMPT_STATE on garbage file content (fail-open)', () => {
    const dir = makeTmpDir();
    writeFileSync(join(dir, 'prompt-state.json'), '{not valid json', 'utf8');
    expect(() => readPromptState(dir)).not.toThrow();
    const state = readPromptState(dir);
    expect(state.threshold).toBe(DEFAULT_PROMPT_STATE.threshold);
  });

  it('returns DEFAULT_PROMPT_STATE on empty file (fail-open)', () => {
    const dir = makeTmpDir();
    writeFileSync(join(dir, 'prompt-state.json'), '', 'utf8');
    expect(() => readPromptState(dir)).not.toThrow();
    const state = readPromptState(dir);
    expect(state.threshold).toBe(DEFAULT_PROMPT_STATE.threshold);
  });
});

describe('writePromptState + readPromptState — round-trip', () => {
  it('round-trips threshold, ignoreCount, promptVariant', () => {
    const dir = makeTmpDir();
    const written = {
      ...DEFAULT_PROMPT_STATE,
      threshold: 6,
      ignoreCount: 1,
      promptVariant: 'calm',
    };
    writePromptState(written, dir);
    const read = readPromptState(dir);
    expect(read.threshold).toBe(6);
    expect(read.ignoreCount).toBe(1);
    expect(read.promptVariant).toBe('calm');
  });

  it('round-trips cooldownUntil', () => {
    const dir = makeTmpDir();
    const cooldown = '2026-06-22T15:00:00Z';
    writePromptState({ ...DEFAULT_PROMPT_STATE, cooldownUntil: cooldown }, dir);
    const read = readPromptState(dir);
    expect(read.cooldownUntil).toBe(cooldown);
  });

  it('round-trips sessionId', () => {
    const dir = makeTmpDir();
    writePromptState({ ...DEFAULT_PROMPT_STATE, sessionId: 'conv-xyz' }, dir);
    const read = readPromptState(dir);
    expect(read.sessionId).toBe('conv-xyz');
  });

  it('round-trips boolean session flags', () => {
    const dir = makeTmpDir();
    writePromptState({
      ...DEFAULT_PROMPT_STATE,
      sessionPromptShown: true,
      sessionRevealShown: true,
      sessionSilenced: true,
    }, dir);
    const read = readPromptState(dir);
    expect(read.sessionPromptShown).toBe(true);
    expect(read.sessionRevealShown).toBe(true);
    expect(read.sessionSilenced).toBe(true);
  });

  it('writePromptState does not throw on unwritable path (fail-open)', () => {
    const dir = makeTmpDir();
    writeFileSync(join(dir, 'blocker'), 'x');
    expect(() =>
      writePromptState(DEFAULT_PROMPT_STATE, join(dir, 'blocker', 'subdir')),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getOrAssignPromptVariant — write-once, defaults to 'calm'
// ---------------------------------------------------------------------------

describe('getOrAssignPromptVariant', () => {
  it("returns 'calm' on a fresh dir", () => {
    const dir = makeTmpDir();
    expect(getOrAssignPromptVariant(dir)).toBe('calm');
  });

  it('is write-once: subsequent calls return the same value', () => {
    const dir = makeTmpDir();
    const first = getOrAssignPromptVariant(dir);
    expect(getOrAssignPromptVariant(dir)).toBe(first);
    expect(getOrAssignPromptVariant(dir)).toBe(first);
  });

  it('persists the variant to disk', () => {
    const dir = makeTmpDir();
    const v = getOrAssignPromptVariant(dir);
    const stored = readFileSync(join(dir, 'prompt-variant'), 'utf8').trim();
    expect(stored).toBe(v);
  });

  it("defaults to 'calm' on read/write failure (unwritable path)", () => {
    const dir = makeTmpDir();
    writeFileSync(join(dir, 'blocker'), 'x');
    const v = getOrAssignPromptVariant(join(dir, 'blocker', 'subdir'));
    expect(v).toBe('calm');
  });
});
