/**
 * Paket 0 — the two false-all-clear fixes.
 *
 * 0a: a signal that fires into Pro-only knowledge must name the gap, never be
 *     dropped in silence. Silence on a fired signal reads as a clean bill of
 *     health on code Lumo cannot see.
 * 0b: the neutral line must report the scope that was checked, never claim the
 *     code is clean.
 *
 * Every rule here carries a pair: a case that MUST speak, and a near case that
 * MUST stay quiet.
 */

import { describe, it, expect } from 'vitest';
import { checkCode, checkCodeWithGaps } from '../src/detection/catch.js';
import { handleCheckCode } from '../src/mcp/handlers.js';
import { runHookCatch } from '../src/hook/catch-runner.js';
import { CATCH_NEUTRAL_LINE } from '../src/lib/render.js';
import { loadSnapshot } from '../src/lib/snapshot.js';

const snap = loadSnapshot();

// WooCommerce/HPOS knowledge is Pro-only: the signal fires, Free has no entry.
const HPOS_BLOB = `<?php
$order_id = 123;
update_post_meta( $order_id, '_billing_email', 'a@b.de' );
`;

// Same shape, no WooCommerce relation — the near case that must stay quiet.
const PLAIN_BLOB = `<?php
function my_plugin_render_notice() {
    echo esc_html__( 'Hello', 'my-plugin' );
}
`;

describe('0a — a fired signal into Pro-only knowledge names the gap', () => {
  it('BELL: engine reports a proGap for HPOS order meta', () => {
    const { results, proGap } = checkCodeWithGaps(HPOS_BLOB, 'php', snap);
    expect(results).toHaveLength(0); // Free has no entry to render
    expect(proGap).toBeDefined();
    expect(proGap?.pluginName).toBe('WooCommerce');
    expect(proGap?.hasProCoverage).toBe(true);
  });

  it('SILENCE: engine reports no proGap for unrelated WordPress code', () => {
    const { results, proGap } = checkCodeWithGaps(PLAIN_BLOB, 'php', snap);
    expect(results).toHaveLength(0);
    expect(proGap).toBeUndefined();
  });

  it('BELL: lumo_check_code names WooCommerce instead of staying neutral', async () => {
    const out = await handleCheckCode({ code: HPOS_BLOB, language: 'php' }, snap);
    expect(out).not.toBe(CATCH_NEUTRAL_LINE);
    expect(out).toContain('WooCommerce');
    expect(out).toContain('not an all-clear');
  });

  it('SILENCE: lumo_check_code returns the neutral line for unrelated code', async () => {
    const out = await handleCheckCode({ code: PLAIN_BLOB, language: 'php' }, snap);
    expect(out).toBe(CATCH_NEUTRAL_LINE);
  });

  it('BELL: the hook path names the gap and stays non-blocking', () => {
    const res = runHookCatch(HPOS_BLOB, 'php');
    expect(res.tier).toBeNull(); // never blocks the keyboard
    expect(res.message).toContain('WooCommerce');
    expect(res.message).not.toBe(CATCH_NEUTRAL_LINE);
  });

  it('SILENCE: the hook path stays neutral for unrelated code', () => {
    const res = runHookCatch(PLAIN_BLOB, 'php');
    expect(res.tier).toBeNull();
    expect(res.message).toBe(CATCH_NEUTRAL_LINE);
  });
});

/**
 * Review finding (Gemini, false-positive lens): making the Pro gap visible turned
 * an invisible regex imprecision into a visible WooCommerce upsell. `\w*order\w*`
 * also matches recorder, border, orderby and reorder. Named upsells on unrelated
 * code are exactly the noise §3 forbids, so `order` must sit on a name boundary.
 */
describe('0a — the order-shaped variable must be WooCommerce-shaped', () => {
  const gap = (code: string) => checkCodeWithGaps(code, 'php', snap).proGap;

  it.each([
    ['$order_id', '<?php update_post_meta( $order_id, "k", 1 );'],
    ['$order', '<?php update_post_meta( $order, "k", 1 );'],
    ['$wc_order', '<?php get_post_meta( $wc_order, "k", true );'],
    ['$the_order_id', '<?php get_post_meta( $the_order_id, "k", true );'],
  ])('BELL: %s still reaches the WooCommerce teaser', (_name, code) => {
    expect(gap(code)?.pluginName).toBe('WooCommerce');
  });

  it.each([
    ['$recorder_id', '<?php update_post_meta( $recorder_id, "audio_path", $f );'],
    ['$border_id', '<?php get_post_meta( $border_id, "border_style", true );'],
    ['$orderby_post_id', '<?php update_post_meta( $orderby_post_id, "menu_order", 3 );'],
    ['$reorder_id', '<?php update_post_meta( $reorder_id, "pos", 1 );'],
  ])('SILENCE: %s must not trigger a WooCommerce upsell', (_name, code) => {
    expect(gap(code)).toBeUndefined();
  });
});

describe('0b — the neutral line states scope, not cleanliness', () => {
  it('never claims the code is clean', () => {
    expect(CATCH_NEUTRAL_LINE.toLowerCase()).not.toContain('clean.');
    expect(CATCH_NEUTRAL_LINE.toLowerCase()).not.toContain('looks clean');
  });

  it('names what was checked and denies being an all-clear', () => {
    expect(CATCH_NEUTRAL_LINE).toContain('Lumo Free');
    expect(CATCH_NEUTRAL_LINE).toContain('not an all-clear');
  });
});

describe('regression — the normal Free path is untouched', () => {
  it('checkCode still returns a plain array and still catches a Free signal', () => {
    const out = checkCode(
      '<?php wp_register_ability( "my/thing", array( "label" => "x" ) );',
      'php',
      snap,
    );
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]!.entry.slug).toBe('wp-ability-missing-mcp-public');
  });

  it('checkCode returns an empty array, not an object, for unrelated code', () => {
    expect(checkCode(PLAIN_BLOB, 'php', snap)).toEqual([]);
  });
});
