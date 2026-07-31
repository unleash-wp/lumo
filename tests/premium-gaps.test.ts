/**
 * P13: premium-plugin presence detection + the multi-gap contract.
 *
 * The signals are the curated sourceSignals verbatim, so this file tests the
 * product promise, not invented regexes: touching a premium plugin's API in a
 * blob surfaces a NAMED gap (teaser when Pro covers it, honest note when not),
 * and touching several names ALL of them, reporting only the first is the
 * same silence, one plugin later.
 */

import { describe, it, expect } from 'vitest';
import { checkCodeWithGaps } from '../src/detection/catch.js';
import { handleCheckCode } from '../src/mcp/handlers.js';
import { loadSnapshot } from '../src/lib/snapshot.js';

const snap = loadSnapshot();
const gapsOf = (code: string) => checkCodeWithGaps(code, 'php', snap).proGaps;

describe('premium presence, covered plugins draw the named teaser', () => {
  it.each([
    ['Advanced Custom Fields Pro', `<?php acf_add_local_field_group( array( 'key' => 'g1' ) );`],
    ['Gravity Forms', `<?php add_action( 'gform_after_submission', 'my_handler', 10, 2 );`],
    ['Meta Box', `<?php $v = rwmb_meta( 'my_field' );`],
    ['Carbon Fields', `<?php $v = carbon_get_post_meta( $id, 'crb_text' );`],
    ['Elementor Pro', `<?php class My_Widget extends \\Elementor\\Widget_Base {}`],
    ['WooCommerce Subscriptions', `<?php $sub = wcs_get_subscription( $id );`],
  ])('BELL: %s is named with Pro coverage', (name, code) => {
    const gaps = gapsOf(code);
    expect(gaps.map((g) => g.pluginName)).toContain(name);
    expect(gaps.find((g) => g.pluginName === name)?.hasProCoverage).toBe(true);
  });
});

describe('premium presence, uncovered plugins get the honest note, no promise', () => {
  it.each([
    ['Pods', `<?php $v = pods_field( 'my_pod', $id, 'field' );`],
    ['WP Rocket', `<?php rocket_clean_domain();`],
    ['Polylang', `<?php pll_e( 'label' );`],
  ])('BELL: %s is named without coverage', (name, code) => {
    const gap = gapsOf(code).find((g) => g.pluginName === name);
    expect(gap).toBeDefined();
    expect(gap?.hasProCoverage).toBe(false);
  });

  it('the rendered answer for an uncovered plugin promises nothing', async () => {
    const out = await handleCheckCode({ code: `<?php rocket_clean_domain();`, language: 'php' }, snap);
    expect(out).toContain('WP Rocket');
    expect(out).toContain('not an all-clear');
    expect(out).not.toContain('Lumo Pro covers');
  });
});

describe('multi-gap. Every touched plugin is named', () => {
  const MIXED = `<?php
$order_id = 123;
update_post_meta( $order_id, '_billing_email', 'a@b.de' );
$field = rwmb_meta( 'my_field' );
add_action( 'gform_after_submission', 'my_handler' );
`;

  it('BELL: the engine reports all three, deduped, registry order', () => {
    const names = gapsOf(MIXED).map((g) => g.pluginName);
    expect(names).toEqual(['WooCommerce', 'Gravity Forms', 'Meta Box']);
  });

  it('BELL: the answer names all three in one sentence', async () => {
    const out = await handleCheckCode({ code: MIXED, language: 'php' }, snap);
    expect(out).toContain('WooCommerce, Gravity Forms and Meta Box');
  });

  it('SILENCE: plain WordPress code names nobody', () => {
    expect(gapsOf(`<?php function my_plugin_x() { return get_option( 'my_opt' ); }`)).toEqual([]);
  });

  it('SILENCE: a premium function name inside a string is not a call', () => {
    const code = `<?php $msg = 'call rwmb_meta( in your theme'; echo esc_html( $msg );`;
    expect(gapsOf(code)).toEqual([]);
  });
});

describe('namespace signals match real code (escaping regression)', () => {
  it.each([
    ['Carbon Fields', `<?php use Carbon_Fields\\Container\\Container; Container::make( 'post_meta', 'x' );`],
    ['Elementor Pro', `<?php class W extends \\Elementor\\Widget_Base {}`],
  ])('BELL: %s namespace reference is heard', (name, code) => {
    expect(gapsOf(code).map((g) => g.pluginName)).toContain(name);
  });
});

describe('namespace signals ignore prose (Gemini pass A)', () => {
  it('SILENCE: a class name inside a string literal is documentation, not usage', () => {
    const code = `<?php $doc = 'extend \\Elementor\\Widget_Base for widgets'; echo esc_html( $doc );`;
    expect(gapsOf(code)).toEqual([]);
  });
});

describe('read-side APIs are heard too (Gemini pass B)', () => {
  it.each([
    ['Advanced Custom Fields Pro', `<?php if ( have_rows( 'gallery' ) ) { $v = get_sub_field( 'img' ); }`],
    ['Gravity Forms', `<?php $forms = GFAPI::get_forms();`],
    ['Elementor Pro', `<?php $inst = \\Elementor\\Plugin::instance();`],
  ])('BELL: %s read API draws the gap', (name, code) => {
    expect(gapsOf(code).map((g) => g.pluginName)).toContain(name);
  });
});
