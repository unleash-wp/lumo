/**
 * detectLanguage — the pasted-fragment gap (FINDINGS 30.07.2026).
 *
 * A PHP fragment without <?php and without $ used to score PHP 0 / JS 1 on the
 * bare `=>` and lost every PHP signal. The fix scores PHP array syntax — a
 * quoted string directly before `=>`, and `array(` — which a JS arrow never
 * produces (its parameter list sits before the arrow, never a string literal).
 *
 * Pairs: fragments that MUST reach their PHP signals, and real JS that MUST
 * NOT tip over to PHP (which would run PHP rules on JS and invent findings).
 */

import { describe, it, expect } from 'vitest';
import { checkCode, checkCodeWithGaps } from '../src/detection/catch.js';
import { loadSnapshot } from '../src/lib/snapshot.js';

const snap = loadSnapshot();

describe('detectLanguage — PHP fragments reach their signals', () => {
  it('BELL: shop_order array fragment without <?php draws the WooCommerce gap', () => {
    const { proGap } = checkCodeWithGaps(`array( 'post_type' => 'shop_order' )`, 'auto', snap);
    expect(proGap?.pluginName).toBe('WooCommerce');
  });

  it('BELL: a REST route fragment with __return_true is caught', () => {
    const code = `register_rest_route( 'x/v1', '/items', array( 'methods' => 'POST', 'callback' => 'cb', 'permission_callback' => '__return_true' ) );`;
    const slugs = checkCode(code, 'auto', snap).map((r) => r.entry.slug);
    expect(slugs).toContain('rest-route-missing-permission-callback');
  });
});

describe('detectLanguage — real JS does not tip over to PHP', () => {
  it.each([
    ['arrow chain', `const ids = items.map((x) => x.id).filter((id) => id > 0);`],
    ['object literal with strings', `const cfg = { type: 'shop_order', mode: 'list' };`],
    [
      'block registration',
      `import { registerBlockType } from '@wordpress/blocks';\nregisterBlockType('my/block', { apiVersion: 3, edit: () => null });`,
    ],
  ])('SILENCE on PHP rules: %s', (_name, code) => {
    const { results, proGap } = checkCodeWithGaps(code, 'auto', snap);
    // JS signals may fire (that is their job); PHP-only rules must not.
    const phpHits = results.filter((r) => r.signal.language === 'php');
    expect(phpHits).toEqual([]);
    expect(proGap).toBeUndefined();
  });
});
