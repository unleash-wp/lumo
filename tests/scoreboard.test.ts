import { describe, it, expect } from 'vitest';
import { mkdtempSync, appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { recordEvent, buildEvent, recordGatedTouch, getGatedCount } from '../src/lib/events.js';

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'lumo-scoreboard-test-'));
}

// ---------------------------------------------------------------------------
// getGatedCount, derived from log, single source of truth
// ---------------------------------------------------------------------------

describe('getGatedCount', () => {
  it('returns 0 on a fresh tmp dir (no events file)', () => {
    const dir = makeTmpDir();
    expect(getGatedCount(dir)).toBe(0);
  });

  it('returns 0 when the log contains only non-gated-touch events', () => {
    const dir = makeTmpDir();
    recordEvent(buildEvent({ type: 'install', at: '2026-06-21T10:00:00Z', variant: 'A' }), dir);
    recordEvent(buildEvent({ type: 'onboarded', at: '2026-06-21T10:01:00Z', variant: 'A' }), dir);
    recordEvent(
      buildEvent({ type: 'activation', at: '2026-06-21T10:02:00Z', variant: 'A', target: 'own', gated: true }),
      dir,
    );
    expect(getGatedCount(dir)).toBe(0);
  });

  it('counts only pql_gated_touch lines, not other event types', () => {
    const dir = makeTmpDir();
    recordEvent(buildEvent({ type: 'install', at: '2026-06-21T10:00:00Z', variant: 'A' }), dir);
    recordGatedTouch({ at: '2026-06-21T10:01:00Z', variant: 'A', tool: 'wp_check' }, dir);
    recordEvent(
      buildEvent({ type: 'activation', at: '2026-06-21T10:02:00Z', variant: 'A', target: 'own', gated: true }),
      dir,
    );
    expect(getGatedCount(dir)).toBe(1);
  });

  it('fail-open: does not throw on garbage or partial trailing line', () => {
    const dir = makeTmpDir();
    recordGatedTouch({ at: '2026-06-21T10:00:00Z', variant: 'A', tool: 'wp_check' }, dir);
    appendFileSync(join(dir, 'events.jsonl'), '{partial json without closing brace\n', 'utf8');
    expect(() => getGatedCount(dir)).not.toThrow();
    // the valid gated touch line is still counted; garbage is skipped
    expect(getGatedCount(dir)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// recordGatedTouch, appends the increment + stamps correct gated_count
// ---------------------------------------------------------------------------

describe('recordGatedTouch', () => {
  it('increments gated count by 1 on each call', () => {
    const dir = makeTmpDir();
    expect(getGatedCount(dir)).toBe(0);

    recordGatedTouch({ at: '2026-06-21T10:00:00Z', variant: 'A', tool: 'wp_check' }, dir);
    expect(getGatedCount(dir)).toBe(1);

    recordGatedTouch({ at: '2026-06-21T10:01:00Z', variant: 'A', tool: 'wp_knowledge' }, dir);
    expect(getGatedCount(dir)).toBe(2);

    recordGatedTouch({ at: '2026-06-21T10:02:00Z', variant: 'B', tool: 'wp_check' }, dir);
    expect(getGatedCount(dir)).toBe(3);
  });

  it('stamps gated_count equal to count AFTER the append (1, 2, 3)', () => {
    const dir = makeTmpDir();

    recordGatedTouch({ at: '2026-06-21T10:00:00Z', variant: 'A', tool: 'wp_check' }, dir);
    recordGatedTouch({ at: '2026-06-21T10:01:00Z', variant: 'A', tool: 'wp_check' }, dir);
    recordGatedTouch({ at: '2026-06-21T10:02:00Z', variant: 'A', tool: 'wp_check' }, dir);

    const lines = readFileSync(join(dir, 'events.jsonl'), 'utf8')
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .filter((l) => {
        try {
          return (JSON.parse(l) as { type: string }).type === 'pql_gated_touch';
        } catch {
          return false;
        }
      });

    expect(lines).toHaveLength(3);
    expect((JSON.parse(lines[0]!) as { gated_count: number }).gated_count).toBe(1);
    expect((JSON.parse(lines[1]!) as { gated_count: number }).gated_count).toBe(2);
    expect((JSON.parse(lines[2]!) as { gated_count: number }).gated_count).toBe(3);
  });

  it('each appended line has type pql_gated_touch and gated:true', () => {
    const dir = makeTmpDir();
    recordGatedTouch({ at: '2026-06-21T10:00:00Z', variant: 'B', tool: 'wp_knowledge' }, dir);

    const raw = readFileSync(join(dir, 'events.jsonl'), 'utf8')
      .split('\n')
      .filter((l) => l.trim().length > 0);
    expect(raw).toHaveLength(1);
    const parsed = JSON.parse(raw[0]!) as Record<string, unknown>;
    expect(parsed['type']).toBe('pql_gated_touch');
    expect(parsed['gated']).toBe(true);
    expect(parsed['tool']).toBe('wp_knowledge');
    expect(parsed['variant']).toBe('B');
  });

  it('fail-open: does not throw when stateDir is unwritable', () => {
    const dir = makeTmpDir();
    writeFileSync(join(dir, 'blocker'), 'x');
    expect(() =>
      recordGatedTouch(
        { at: '2026-06-21T10:00:00Z', variant: 'A', tool: 'wp_check' },
        join(dir, 'blocker', 'subdir'),
      ),
    ).not.toThrow();
  });

  it('non-pql_gated_touch lines in the log do not affect the count', () => {
    const dir = makeTmpDir();
    // Write an activation line directly (not via recordGatedTouch)
    recordEvent(
      buildEvent({ type: 'activation', at: '2026-06-21T10:00:00Z', variant: 'A', target: 'own', gated: true }),
      dir,
    );
    expect(getGatedCount(dir)).toBe(0);

    // Now a real gated touch
    recordGatedTouch({ at: '2026-06-21T10:01:00Z', variant: 'A', tool: 'wp_check' }, dir);
    expect(getGatedCount(dir)).toBe(1);
  });
});
