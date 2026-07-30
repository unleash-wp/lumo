/**
 * The three corrections the product gate demanded on Paket 0.
 *
 *   Law 2 — a Free finding used to swallow the Pro gap, so an incomplete check
 *           read as a result. The gap is now named alongside findings.
 *   Law 1 — the hook repeated the full teaser on every edit. Full teaser once
 *           per plugin, short line after that.
 *   Law 3 — the teaser listed the whole Pro catalogue next to a WooCommerce
 *           finding. It now names only what was detected.
 *
 * Each with the pair §3 demands.
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handleCheckCode } from '../src/mcp/handlers.js';
import { runHookCatch } from '../src/hook/catch-runner.js';
import { runCatch } from '../src/action/catch-runner.js';
import { checkCodeWithGaps } from '../src/detection/catch.js';
import {
  buildCodeProTeaser,
  CATCH_NEUTRAL_LINE,
  ACTION_NO_MATCH_LINE,
  ACTION_SCOPE_LINE,
  SCAN_NO_MATCH_TEMPLATE,
} from '../src/lib/render.js';
import { loadSnapshot } from '../src/lib/snapshot.js';

const snap = loadSnapshot();

/** A Free-covered violation AND a Pro-only touch in the same blob. */
const BOTH = `<?php
$id = $_GET['user_id'];
update_post_meta( $order_id, '_billing_email', $id );
`;

/** Pro-only touch alone. */
const PRO_ONLY = `<?php
update_post_meta( $order_id, '_billing_email', 'a@b.de' );
`;

/** Neither — the near case that must stay quiet. */
const NEITHER = `<?php
function my_plugin_render_notice() {
    echo esc_html__( 'Hello', 'my-plugin' );
}
`;

/** Every test gets its own state dir. Never the developer's. */
function freshStateDir(): string {
  return mkdtempSync(join(tmpdir(), 'lumo-test-state-'));
}

describe('law 2 — a Free finding must not swallow the Pro gap', () => {
  it('BELL: the answer names WooCommerce even though a Free rule fired', async () => {
    const out = await handleCheckCode({ code: BOTH, language: 'php' }, snap);
    // The Free finding is still the substance of the answer...
    expect(out).toContain('sanitize');
    // ...and the gap is named, so it cannot read as a complete check.
    expect(out).toContain('WooCommerce');
    expect(out).toContain('not the whole picture');
  });

  it('SILENCE: no gap line when nothing Pro-only was touched', async () => {
    const out = await handleCheckCode({ code: NEITHER, language: 'php' }, snap);
    expect(out).toBe(CATCH_NEUTRAL_LINE);
    expect(out).not.toContain('WooCommerce');
  });
});

describe('law 1 — the hook says it once, then keeps it short', () => {
  it('BELL: the first edit gets the full teaser', () => {
    const dir = freshStateDir();
    const first = runHookCatch(PRO_ONLY, 'php', undefined, dir);
    expect(first.message).toBe(buildCodeProTeaser('WooCommerce'));
    expect(first.tier).toBeNull();
  });

  it('SILENCE: every later edit gets the short line, not the sales copy', () => {
    const dir = freshStateDir();
    runHookCatch(PRO_ONLY, 'php', undefined, dir);
    const second = runHookCatch(PRO_ONLY, 'php', undefined, dir);
    const third = runHookCatch(PRO_ONLY, 'php', undefined, dir);

    for (const r of [second, third]) {
      expect(r.message).not.toBe(buildCodeProTeaser('WooCommerce'));
      // Still honest: the gap stays named and it is still not an all-clear.
      expect(r.message).toContain('WooCommerce');
      expect(r.message).toContain('not an all-clear');
      // But the pitch is gone.
      expect(r.message).not.toContain('Lumo Pro covers');
    }
    expect(second.message).toBe(third.message);
  });

  it('a separate install starts over — the marker is per state dir, not global', () => {
    const a = freshStateDir();
    const b = freshStateDir();
    runHookCatch(PRO_ONLY, 'php', undefined, a);
    expect(runHookCatch(PRO_ONLY, 'php', undefined, b).message).toBe(
      buildCodeProTeaser('WooCommerce'),
    );
  });
});

describe('law 2 — the hook names the gap next to a finding too', () => {
  it('BELL: hook output carries both the finding and the gap line', () => {
    const dir = freshStateDir();
    const res = runHookCatch(BOTH, 'php', undefined, dir);
    expect(res.tier).not.toBeNull(); // a real finding fired
    expect(res.message).toContain('WooCommerce');
    expect(res.message).toContain('not the whole picture');
  });

  it('the gap line is NOT throttled — honesty repeats where the pitch does not', () => {
    const dir = freshStateDir();
    const first = runHookCatch(BOTH, 'php', undefined, dir);
    const tenth = runHookCatch(BOTH, 'php', undefined, dir);
    expect(tenth.message).toBe(first.message);
    expect(tenth.message).toContain('not the whole picture');
  });

  it('SILENCE: a finding with no Pro touch carries no gap line', () => {
    const dir = freshStateDir();
    const res = runHookCatch(`<?php $id = $_GET['x']; echo $id;`, 'php', undefined, dir);
    expect(res.tier).not.toBeNull();
    expect(res.message).not.toContain('not the whole picture');
    expect(res.message).not.toContain('WooCommerce');
  });
});

describe('law 2 — the GitHub Action names the gap too', () => {
  const diffFor = (body: string) =>
    [
      'diff --git a/inc/orders.php b/inc/orders.php',
      '--- a/inc/orders.php',
      '+++ b/inc/orders.php',
      '@@ -1,2 +1,4 @@',
      ...body.split('\n').map((l) => `+${l}`),
    ].join('\n');

  it('BELL: a WooCommerce-touching pull request no longer reports nothing', async () => {
    const res = await runCatch({ diff: diffFor(PRO_ONLY) });
    expect(res.findings.length).toBeGreaterThan(0);
    expect(res.findings.some((f) => f.body.includes('WooCommerce'))).toBe(true);
  });

  it('the gap is always SOFT — a coverage gap must never fail a build', async () => {
    const res = await runCatch({ diff: diffFor(PRO_ONLY) });
    const gap = res.findings.find((f) => f.body.includes('WooCommerce'))!;
    expect(gap.tier).toBe('SOFT');
    expect(res.loudCount).toBe(0);
  });

  it('SILENCE: a pull request touching nothing covered reports no findings', async () => {
    const res = await runCatch({ diff: diffFor(NEITHER) });
    expect(res.findings).toEqual([]);
  });
});

/**
 * The gate's own note: this phrasing has regressed once per channel, because each
 * channel carried its own literal. Pinned here so a fourth regression fails a build.
 */
describe('law 2 — no channel may phrase a coverage limit as a verdict', () => {
  it.each([
    ['CATCH_NEUTRAL_LINE', CATCH_NEUTRAL_LINE],
    ['ACTION_NO_MATCH_LINE', ACTION_NO_MATCH_LINE],
    ['SCAN_NO_MATCH_TEMPLATE', SCAN_NO_MATCH_TEMPLATE],
  ])('%s never says clean and always denies being an all-clear', (_name, line) => {
    expect(line.toLowerCase()).not.toContain('clean');
    expect(line).toContain('not an all-clear');
  });

  it('the Action summary states its scope even when findings exist', () => {
    expect(ACTION_SCOPE_LINE).toContain('added lines');
    expect(ACTION_SCOPE_LINE).toContain('were not checked');
  });
});

describe('law 1 — the order-shaped variable must also be id-shaped', () => {
  const gap = (code: string) => checkCodeWithGaps(code, 'php', snap).proGap;

  it.each([
    ['$order_id', `<?php update_post_meta( $order_id, 'k', 1 );`],
    ['$wc_order_id', `<?php get_post_meta( $wc_order_id, 'k', true );`],
  ])('BELL: %s still reaches the teaser', (_n, code) => {
    expect(gap(code)?.pluginName).toBe('WooCommerce');
  });

  it.each([
    ['$order_status', `<?php update_post_meta( $order_status, 'k', 1 );`],
    ['$order_number', `<?php update_post_meta( $order_number, 'k', 1 );`],
  ])('SILENCE: %s is not a post id and draws no upsell', (_n, code) => {
    expect(gap(code)).toBeUndefined();
  });
});

describe('law 3 — the teaser names only what was detected', () => {
  it('makes no claim about the reader’s AI', () => {
    // Unverifiable at output time and identical regardless of the code — the same
    // defect as listing unrelated plugins.
    expect(buildCodeProTeaser('WooCommerce')).not.toContain('training data');
    expect(buildCodeProTeaser('WooCommerce')).not.toContain('your AI');
  });

  it('names the detected plugin', () => {
    expect(buildCodeProTeaser('WooCommerce')).toContain('Lumo Pro covers WooCommerce');
  });

  it.each(['ACF Pro', 'Gravity Forms', 'Elementor Pro', 'Meta Box', 'Carbon Fields'])(
    'does not advertise %s next to an unrelated finding',
    (other) => {
      expect(buildCodeProTeaser('WooCommerce')).not.toContain(other);
    },
  );
});
