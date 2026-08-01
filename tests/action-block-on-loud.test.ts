/**
 * resolveBlockOnLoud() precedence (#110).
 *
 * The bug: action.yml defaulted fail_on_loud to "true", and main() OR-combined
 * that with enforce.mode:block. A repository that never touched fail_on_loud
 * inherited "true" and could never reach warn-only through the Action, no
 * matter what its own .claude/.lumo.json asked for. The fix makes an explicit
 * true/false win, and hands everything else to enforce.mode alone.
 */

import { describe, it, expect } from 'vitest';
import { resolveBlockOnLoud } from '../src/action/main.js';

describe('resolveBlockOnLoud: empty input defers entirely to enforce.mode', () => {
  it('BELL: warn-only + empty fail_on_loud does not block (the bug this fixes)', () => {
    expect(resolveBlockOnLoud('', 'warn-only')).toBe(false);
  });

  it('BELL: block + empty fail_on_loud blocks', () => {
    expect(resolveBlockOnLoud('', 'block')).toBe(true);
  });

  it('off + empty fail_on_loud does not block', () => {
    expect(resolveBlockOnLoud('', 'off')).toBe(false);
  });

  it('whitespace-only input is treated the same as empty', () => {
    expect(resolveBlockOnLoud('   ', 'warn-only')).toBe(false);
    expect(resolveBlockOnLoud('   ', 'block')).toBe(true);
  });
});

describe('resolveBlockOnLoud: an explicit input always wins over enforce.mode', () => {
  it('BELL: true + warn-only still blocks (explicit input overrides)', () => {
    expect(resolveBlockOnLoud('true', 'warn-only')).toBe(true);
  });

  it('BELL: false + block does not block (explicit input overrides)', () => {
    expect(resolveBlockOnLoud('false', 'block')).toBe(false);
  });

  it('true + off still blocks: an explicit input overrides off too', () => {
    expect(resolveBlockOnLoud('true', 'off')).toBe(true);
  });

  it('is case-insensitive and tolerates surrounding whitespace', () => {
    expect(resolveBlockOnLoud('  TRUE  ', 'warn-only')).toBe(true);
    expect(resolveBlockOnLoud('  FALSE  ', 'block')).toBe(false);
  });
});

describe('resolveBlockOnLoud: an unrecognised value is treated as absent', () => {
  it('falls back to enforce.mode rather than guessing at a typo', () => {
    expect(resolveBlockOnLoud('yes', 'block')).toBe(true);
    expect(resolveBlockOnLoud('yes', 'warn-only')).toBe(false);
  });
});
