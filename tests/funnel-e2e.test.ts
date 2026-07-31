import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleCheckCode } from '../src/mcp/handlers.js';
import { checkCode } from '../src/detection/catch.js';

/**
 * Checkout-funnel end-to-end guard.
 *
 * The revenue path is: a LOUD catch on the developer's own code is the
 * highest-intent moment → the upgrade prompt appears with an ATTRIBUTED
 * checkout URL (source=catch + gated count + prompt variant) → the click is
 * what the Pro funnel counts. If any link in that chain silently breaks, the
 * product still "works" while earning nothing — so it is asserted here.
 *
 * The three gates are asserted explicitly, because each one silently swallows
 * the prompt by design: LOUD result present, kill-switch on, checkout URL set.
 */

/**
 * The flagship Free demo snippet: a CERTAIN signal on a dated removal (WP 5.9),
 * which is what earns a LOUD catch. WooCommerce knowledge is Pro-only now, so
 * the funnel is asserted on the LOUD a real free user can hit — these handlers
 * read the shipped Free snapshot.
 *
 * It used to be wp_img_tag_add_decoding_attr(), which is deprecated and not
 * removed. Nothing breaks there; it reached LOUD only because the entry carried
 * a wrong breaking_change stamp, so the whole checkout funnel was demonstrated
 * on a break that never happened. isValidBlockContent() really was removed.
 */
const LOUD_SNIPPET = `const { isValidBlockContent } = wp.blocks;
const ok = isValidBlockContent( blockType, attrs, inner, html );`;

/**
 * Same signal, but wrapped in a function_exists() shim — the developer is writing
 * a polyfill, not misusing the API, so the engine caps it at SOFT.
 */
const SOFT_ONLY_SNIPPET = `<?php
if ( ! function_exists( 'wp_img_tag_add_decoding_attr' ) ) {
    $html = wp_img_tag_add_decoding_attr( $img, 'the_content' );
}`;
const CHECKOUT = 'https://buy.example.test/lumo';

describe('checkout funnel — catch → attributed upgrade prompt', () => {
  const original = { url: process.env['LUMO_CHECKOUT_URL'], sw: process.env['LUMO_UPGRADE_PROMPT'] };

  beforeEach(() => {
    process.env['LUMO_CHECKOUT_URL'] = CHECKOUT;
    delete process.env['LUMO_UPGRADE_PROMPT'];
  });
  afterEach(() => {
    if (original.url === undefined) delete process.env['LUMO_CHECKOUT_URL'];
    else process.env['LUMO_CHECKOUT_URL'] = original.url;
    if (original.sw === undefined) delete process.env['LUMO_UPGRADE_PROMPT'];
    else process.env['LUMO_UPGRADE_PROMPT'] = original.sw;
  });

  it('the flagship snippet still produces a LOUD catch (the funnel entry point)', () => {
    const results = checkCode(LOUD_SNIPPET, 'js');
    expect(results.some((r) => r.tier === 'LOUD')).toBe(true);
  });

  it('emits the checkout URL with full attribution when a LOUD catch fires', async () => {
    const out = await handleCheckCode({ code: LOUD_SNIPPET, language: 'js' });
    expect(out).toContain(CHECKOUT);
    // Attribution params the funnel digest joins on — a bare URL is a lost sale.
    expect(out).toMatch(/[?&]ref=catch\b/);
    expect(out).toMatch(/[?&]gated=\d+/);
    expect(out).toMatch(/[?&]v=block\b/);
  });

  it('prints no dead buy-link when no checkout URL is configured', async () => {
    delete process.env['LUMO_CHECKOUT_URL'];
    const out = await handleCheckCode({ code: LOUD_SNIPPET, language: 'js' });
    expect(out).not.toContain('buy.example.test');
    expect(out).not.toMatch(/lumo\.so\/pro/); // the default must stay inert too
  });

  it('honours the kill-switch even with a checkout URL set', async () => {
    process.env['LUMO_UPGRADE_PROMPT'] = 'off';
    const out = await handleCheckCode({ code: LOUD_SNIPPET, language: 'js' });
    expect(out).not.toContain(CHECKOUT);
  });

  it('never shows the upgrade prompt on clean code (no nag without a finding)', async () => {
    // The correct replacement call — near-miss of the LOUD signal, must stay silent.
    const out = await handleCheckCode({
      code: "<?php $html = wp_img_tag_add_loading_optimization_attrs( $img, 'the_content' );",
      language: 'php',
    });
    expect(out).not.toContain(CHECKOUT);
  });

  it('a SOFT-only finding gets the freshness reveal, not the buy-link', async () => {
    // The commercial boundary: the checkout ask is reserved for a certain,
    // dated break (LOUD). An ambiguous hit still nudges toward Pro, but never
    // asks for money — that is what keeps the prompt trusted rather than nagging.
    const results = checkCode(SOFT_ONLY_SNIPPET, 'php');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.tier === 'LOUD')).toBe(false);

    const out = await handleCheckCode({ code: SOFT_ONLY_SNIPPET, language: 'php' });
    expect(out).not.toContain(CHECKOUT);
    expect(out).toMatch(/Lumo Pro/);
  });
});
