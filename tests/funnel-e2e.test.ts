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
 * The flagship demo snippet (README + catch demo). It carries the CERTAIN
 * 'shop_order' post-type literal, which is what earns a LOUD catch — a bare
 * `get_post_meta( $order_id )` is deliberately only SOFT (that id could be any
 * post). Asserted separately below so the commercial boundary stays explicit.
 */
const HPOS_SNIPPET = `<?php
$email = get_post_meta( $order_id, '_billing_email', true );
update_post_meta( $order_id, '_subscription_plan', 'pro' );
$orders = get_posts( array( 'post_type' => 'shop_order' ) );`;

/** Same domain, but context-dependent only — SOFT, not LOUD. */
const SOFT_ONLY_SNIPPET = "<?php $email = get_post_meta( $order_id, '_billing_email', true );";
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
    const results = checkCode(HPOS_SNIPPET, 'php');
    expect(results.some((r) => r.tier === 'LOUD')).toBe(true);
  });

  it('emits the checkout URL with full attribution when a LOUD catch fires', async () => {
    const out = await handleCheckCode({ code: HPOS_SNIPPET, language: 'php' });
    expect(out).toContain(CHECKOUT);
    // Attribution params the funnel digest joins on — a bare URL is a lost sale.
    expect(out).toMatch(/[?&]ref=catch\b/);
    expect(out).toMatch(/[?&]gated=\d+/);
    expect(out).toMatch(/[?&]v=block\b/);
  });

  it('prints no dead buy-link when no checkout URL is configured', async () => {
    delete process.env['LUMO_CHECKOUT_URL'];
    const out = await handleCheckCode({ code: HPOS_SNIPPET, language: 'php' });
    expect(out).not.toContain('buy.example.test');
    expect(out).not.toMatch(/lumo\.so\/pro/); // the default must stay inert too
  });

  it('honours the kill-switch even with a checkout URL set', async () => {
    process.env['LUMO_UPGRADE_PROMPT'] = 'off';
    const out = await handleCheckCode({ code: HPOS_SNIPPET, language: 'php' });
    expect(out).not.toContain(CHECKOUT);
  });

  it('never shows the upgrade prompt on clean code (no nag without a finding)', async () => {
    const out = await handleCheckCode({ code: '<?php $order = wc_get_order( $order_id );', language: 'php' });
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
