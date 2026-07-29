import { describe, it, expect } from 'vitest';
import { checkCode } from '../src/detection/catch.js';

/**
 * The scan path must be able to reach LOUD.
 *
 * Commercially this is load-bearing: only a LOUD catch triggers the upgrade
 * prompt, so if a real `lumo scan` diff can never produce LOUD, the CLI funnel
 * is silently dead. Observed once during a fresh-install acceptance run: a diff
 * containing the CERTAIN 'shop_order' literal reported only an advisory.
 */

const ADDED_LINES = [
  '<?php',
  '$orders = get_posts( array( "post_type" => "shop_order" ) );',
  '$email = get_post_meta( $order_id, "_billing_email", true );',
].join('\n');

const UNIFIED_DIFF = [
  'diff --git a/orders.php b/orders.php',
  'index 1111111..2222222 100644',
  '--- a/orders.php',
  '+++ b/orders.php',
  '@@ -1,2 +1,3 @@',
  ' <?php',
  '+$orders = get_posts( array( "post_type" => "shop_order" ) );',
  '+$email = get_post_meta( $order_id, "_billing_email", true );',
].join('\n');

describe('LOUD is reachable from scan-shaped input', () => {
  it('fires LOUD on a plain blob carrying the shop_order literal', () => {
    const results = checkCode(ADDED_LINES, 'php');
    expect(results.some((r) => r.tier === 'LOUD')).toBe(true);
  });

  it('fires LOUD on the same content arriving as a unified diff', () => {
    const results = checkCode(UNIFIED_DIFF, 'php');
    expect(results.some((r) => r.tier === 'LOUD')).toBe(true);
  });

  it('keeps the highest tier when one entry has both a CERTAIN and a SOFT signal', () => {
    const results = checkCode(ADDED_LINES, 'php');
    const hpos = results.find((r) => r.entry.slug === 'woocommerce-hpos-order-access');
    expect(hpos?.tier).toBe('LOUD');
  });
});
