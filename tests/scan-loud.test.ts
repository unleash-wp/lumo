import { describe, it, expect } from 'vitest';
import { checkCode } from '../src/detection/catch.js';
import { loadSnapshot } from '../src/lib/snapshot.js';
import type { SnapshotEntry } from '../src/types.js';

/**
 * The scan path must be able to reach LOUD.
 *
 * Commercially this is load-bearing: only a LOUD catch triggers the upgrade
 * prompt, so if a real `lumo scan` diff can never produce LOUD, the CLI funnel
 * is silently dead. Observed once during a fresh-install acceptance run: a diff
 * containing a CERTAIN literal reported only an advisory.
 *
 * The example is a Free-tier signal (wp_img_tag_add_decoding_attr, WP 6.4,
 * breaking) because that is the LOUD a free user can actually hit — WooCommerce
 * knowledge is Pro-only.
 */

const ADDED_LINES = [
  '<?php',
  "$html = wp_img_tag_add_decoding_attr( $img, 'the_content' );",
  'echo $html;',
].join('\n');

const UNIFIED_DIFF = [
  'diff --git a/images.php b/images.php',
  'index 1111111..2222222 100644',
  '--- a/images.php',
  '+++ b/images.php',
  '@@ -1,2 +1,3 @@',
  ' <?php',
  "+$html = wp_img_tag_add_decoding_attr( $img, 'the_content' );",
  '+echo $html;',
].join('\n');

/**
 * Synthetic Pro-only HPOS entry — the dedupe rule (one entry, two signals of
 * different class, highest tier wins) is engine behaviour and did not change, so
 * it keeps being exercised on the entry that actually carries both signal classes.
 */
const hposProEntry: SnapshotEntry = {
  slug: 'woocommerce-hpos-order-access',
  title: 'WooCommerce HPOS: reading and writing order data',
  category_slug: 'woocommerce',
  summary: 'Under HPOS order data lives in dedicated order tables, not wp_posts/wp_postmeta.',
  code_example: '$order = wc_get_order( $order_id );',
  bad_pattern: "$email = get_post_meta( $order_id, '_billing_email', true );",
  source_url:
    'https://github.com/woocommerce/woocommerce/wiki/High-Performance-Order-Storage-Upgrade-Recipe-Book',
  test_step: 'On staging, enable HPOS and confirm your order reads/writes still work.',
  tier: 'free' as const,
  updatedAt: '2026-06-20T09:30:00Z',
  versions: [
    { wp_version_min: null, wp_version_max: null, woo_version_min: '8.2', breaking_change: true },
  ],
};

const baseSnap = loadSnapshot();
const catchSnap = { ...baseSnap, entries: [...baseSnap.entries, hposProEntry] };

/** Carries the CERTAIN 'shop_order' literal AND the CONTEXT_DEPENDENT order-meta read. */
const HPOS_ADDED_LINES = [
  '<?php',
  '$orders = get_posts( array( "post_type" => "shop_order" ) );',
  '$email = get_post_meta( $order_id, "_billing_email", true );',
].join('\n');

describe('LOUD is reachable from scan-shaped input', () => {
  it('fires LOUD on a plain blob carrying the deprecated call', () => {
    const results = checkCode(ADDED_LINES, 'php');
    expect(results.some((r) => r.tier === 'LOUD')).toBe(true);
  });

  it('fires LOUD on the same content arriving as a unified diff', () => {
    const results = checkCode(UNIFIED_DIFF, 'php');
    expect(results.some((r) => r.tier === 'LOUD')).toBe(true);
  });

  it('keeps the highest tier when one entry has both a CERTAIN and a SOFT signal', () => {
    const results = checkCode(HPOS_ADDED_LINES, 'php', catchSnap);
    const hpos = results.find((r) => r.entry.slug === 'woocommerce-hpos-order-access');
    expect(hpos?.tier).toBe('LOUD');
  });
});
