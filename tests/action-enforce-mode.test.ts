/**
 * Tests for the CI gate enforcement-ladder: resolveActionEnforceMode().
 *
 * Verifies the default-safe contract: absent config = warn-only (advisory).
 * Only enforce.mode:"block" enables non-zero exit on LOUD catches.
 *
 * Tests are pure function tests — no GitHub API calls, no real Action runner.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveActionEnforceMode } from '../src/action/main.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'lumo-action-mode-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function writeConfig(content: unknown): void {
  mkdirSync(join(tmpDir, '.claude'), { recursive: true });
  writeFileSync(join(tmpDir, '.claude', '.lumo.json'), JSON.stringify(content));
}

// ---------------------------------------------------------------------------
// Default-safe: no config → warn-only
// ---------------------------------------------------------------------------

describe('resolveActionEnforceMode — default-safe', () => {
  it('returns warn-only when no .claude directory exists', () => {
    expect(resolveActionEnforceMode(tmpDir)).toBe('warn-only');
  });

  it('returns warn-only when .claude dir exists but no .lumo.json', () => {
    mkdirSync(join(tmpDir, '.claude'), { recursive: true });
    expect(resolveActionEnforceMode(tmpDir)).toBe('warn-only');
  });

  it('returns warn-only when enforce key is absent', () => {
    writeConfig({ catch: { disable: [] } });
    expect(resolveActionEnforceMode(tmpDir)).toBe('warn-only');
  });

  // A file that is present and broken used to be indistinguishable from no file
  // at all: both answered 'warn-only'. Falling open is right — a typo must not
  // block a team's merges — but answering it silently let a repository ask for
  // a blocking gate, lose it, and go on reading its green checks as enforced.
  // 'unreadable' still falls open at the call site; it exists so the run can
  // say what happened.
  it('separates a broken config from an absent one', () => {
    mkdirSync(join(tmpDir, '.claude'), { recursive: true });
    writeFileSync(join(tmpDir, '.claude', '.lumo.json'), '{ not valid json }');
    expect(resolveActionEnforceMode(tmpDir)).toBe('unreadable');
  });

  it('treats a mode it does not recognise as unreadable, not as advisory', () => {
    // The dangerous shape: someone meant "block" and wrote something else.
    writeConfig({ enforce: { mode: 'strict' } });
    expect(resolveActionEnforceMode(tmpDir)).toBe('unreadable');
  });

  it('never answers unreadable for a config that simply says nothing', () => {
    // Guards the fall-open direction: the common cases must stay quiet, or the
    // annotation becomes noise on repositories that did nothing wrong.
    writeConfig({ enforce: {} });
    expect(resolveActionEnforceMode(tmpDir)).toBe('warn-only');
  });

  it('returns warn-only when enforce.mode is explicitly warn-only', () => {
    writeConfig({ enforce: { mode: 'warn-only' } });
    expect(resolveActionEnforceMode(tmpDir)).toBe('warn-only');
  });
});

// ---------------------------------------------------------------------------
// Explicit block
// ---------------------------------------------------------------------------

describe('resolveActionEnforceMode — block', () => {
  it('returns block when enforce.mode is "block"', () => {
    writeConfig({ enforce: { mode: 'block' } });
    expect(resolveActionEnforceMode(tmpDir)).toBe('block');
  });

  it('returns block even when catch overrides are also set', () => {
    writeConfig({
      enforce: { mode: 'block' },
      catch: { disable: ['some-slug'] },
    });
    expect(resolveActionEnforceMode(tmpDir)).toBe('block');
  });
});

// ---------------------------------------------------------------------------
// Off mode
// ---------------------------------------------------------------------------

describe('resolveActionEnforceMode — off', () => {
  it('returns off when enforce.mode is "off"', () => {
    writeConfig({ enforce: { mode: 'off' } });
    expect(resolveActionEnforceMode(tmpDir)).toBe('off');
  });
});
