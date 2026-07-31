/**
 * `lumo demo` is the first thing a new user sees work, so it carries two
 * promises that must not rot:
 *
 *   1. It shows real findings from the real engine. A demo that hardcodes its
 *      output would keep bragging after a rule stopped firing — the exact
 *      staleness this product exists to catch, turned on itself.
 *   2. It never reads as a scan of the user's project. A demonstration
 *      mistaken for a verdict on their code is the false all-clear in its
 *      friendliest costume.
 *
 * The counts are pinned deliberately: if the free snapshot is re-cut again and
 * these samples stop firing, this test fails and someone decides what the
 * first-contact moment should be, instead of shipping a silent demo.
 */

import { describe, it, expect, vi } from 'vitest';
import { runDemo } from '../src/demo/run-demo.js';
import { DEMO_SAMPLES } from '../src/demo/samples.js';
import { checkCodeWithGaps } from '../src/detection/catch.js';

const output = () => runDemo().lines.join('\n');

describe('the demo shows the catch actually working', () => {
  it('BELL: fires on every sample and reports both tiers', () => {
    const { findingCount } = runDemo();
    expect(findingCount).toBe(4);
    const text = output();
    expect(text).toContain('2 LOUD');
    expect(text).toContain('2 advisory');
  });

  it('leads with the verdict, before hundreds of lines of detail', () => {
    const lines = runDemo().lines;
    const summaryIndex = lines.findIndex((l) => l.includes('findings across 4 samples'));
    const firstDetailIndex = lines.findIndex((l) => l.startsWith('Asked for:'));
    expect(summaryIndex).toBeGreaterThan(-1);
    expect(summaryIndex).toBeLessThan(firstDetailIndex);
  });

  it('every finding carries the source it comes from', () => {
    expect(output()).toContain('https://developer.wordpress.org');
  });

  it('the SQL injection sample answers LOUD, which is the moment worth seeing', () => {
    expect(output()).toContain('$wpdb->prepare()');
    expect(output()).toContain('⚠️');
  });
});

describe('the demo never poses as a scan', () => {
  it('says in its first lines that this is sample code, not the user project', () => {
    const lines = runDemo().lines;
    const head = lines.slice(0, 4).join('\n');
    expect(head).toContain('NOT a scan of your project');
    expect(head).toContain('nothing here was read from your machine');
  });

  it('points at the command that does check their own code', () => {
    expect(output()).toContain('lumo scan');
  });

  it('names the free boundary instead of implying full coverage', () => {
    const text = output();
    // 'covers' was the over-claim: the knowledge holds those areas, the catch
    // reaches part of them. The tail must not state the claim and retract it
    // two lines later.
    expect(text).toContain('Lumo Free holds');
    expect(text).toContain('as knowledge');
    expect(text).not.toContain('Lumo Free covers');
    expect(text).toContain('Lumo Pro');
  });
});

describe('the samples stay honest about what Free can show', () => {
  it('SILENCE: no sample depends on a Pro-only ecosystem', () => {
    // A first run must demonstrate what the free tier does. A sample that
    // resolved to a paywall teaser would make the demo an advertisement.
    for (const sample of DEMO_SAMPLES) {
      const { proGaps } = checkCodeWithGaps(sample.code, 'php');
      expect(proGaps).toEqual([]);
    }
  });

  it('every sample is checked, and each one fires', () => {
    expect(DEMO_SAMPLES).toHaveLength(4);
    for (const sample of DEMO_SAMPLES) {
      expect(checkCodeWithGaps(sample.code, 'php').results.length).toBeGreaterThan(0);
    }
  });
});

/**
 * Gemini pass A/B: the demo must stay honest when the engine fails under it,
 * and it must not read as a coverage claim.
 */
describe('the demo does not overstate itself', () => {
  it('BELL: a sample the engine could not check is named, and the count says so', async () => {
    const { checkCode } = await import('../src/detection/catch.js');
    const spy = vi.spyOn(await import('../src/detection/catch.js'), 'checkCode');
    let call = 0;
    spy.mockImplementation((code: string, lang) => {
      call += 1;
      if (call === 2) throw new Error('engine blew up');
      return checkCode(code, lang);
    });
    const { lines } = runDemo();
    spy.mockRestore();
    const text = lines.join('\n');
    expect(text).toContain('could not be checked');
    expect(text).toContain('3 of 4 samples');
  });

  it('calls itself a demonstration, not a coverage list', () => {
    expect(output()).toContain('not a coverage list');
  });
});
