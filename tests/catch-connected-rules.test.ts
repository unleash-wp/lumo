/**
 * The 22 curated rules that were connected from the knowledge base into the
 * registry, each with the pair §3 demands.
 *
 * The pair is taken from the knowledge entry itself rather than invented here:
 *   bad_pattern   — the documented wrong form. MUST be caught.
 *   code_example  — the documented correct form. MUST stay quiet.
 *
 * That makes the test a statement about the product promise, not about a regex:
 * if a rule cannot catch its own documented counter-example, the rule is not
 * connected, whatever the registry says. And if it fires on its own documented
 * fix, it would tell a developer their correct code is wrong.
 */

import { describe, it, expect } from 'vitest';
import { checkCode } from '../src/detection/catch.js';
import { loadSnapshot } from '../src/lib/snapshot.js';

const snap = loadSnapshot();

const CONNECTED_SLUGS = [
  'superglobal-without-sanitize',
  'wpdb-query-without-prepare-sql-injection',
  'i18n-function-missing-text-domain',
  'wp-redirect-with-user-input-use-wp-safe-redirect',
  'wp-current-user-can-role-name-not-capability',
  'wp-direct-role-check-instead-of-capability',
  'wp-raw-curl-instead-of-http-api',
  // Connected with validated suppressGuards — the guard silences the entry's
  // own documented fix, which is what held these back before.
  'admin-action-without-capability-check',
  'rest-route-missing-permission-callback',
  'the-content-filter-without-loop-guard',
  'wp-ajax-handler-without-nonce',
  'enqueue-scripts-styles-global-scope',
  'wp-add-option-large-data-missing-autoload-false',
  'wp-cron-missing-deactivation-unschedule',
  'wp-is-admin-not-authorization-check',
  'wp-remote-missing-is-wp-error-check',
  'wp-transient-missing-false-check-fallback',
] as const;

function entryFor(slug: string) {
  const e = snap.entries.find((x) => x.slug === slug);
  if (!e) throw new Error(`slug not in snapshot: ${slug}`);
  return e;
}

function slugsCaught(code: string): string[] {
  return checkCode(code, 'php', snap).map((r) => r.entry.slug);
}

describe('connected rules — every rule catches its own documented wrong form', () => {
  it.each(CONNECTED_SLUGS)('BELL: %s fires on its bad_pattern', (slug) => {
    const bad = entryFor(slug).bad_pattern;
    expect(bad, `${slug} has no bad_pattern to test against`).toBeTruthy();
    expect(slugsCaught(bad!)).toContain(slug);
  });
});

describe('connected rules — no rule fires on its own documented fix', () => {
  it.each(CONNECTED_SLUGS)('SILENCE: %s stays quiet on its code_example', (slug) => {
    const good = entryFor(slug).code_example;
    expect(good, `${slug} has no code_example to test against`).toBeTruthy();
    expect(slugsCaught(good!)).not.toContain(slug);
  });
});

/**
 * From the false-positive review (Gemini, Stufe 3). Two rules fired on correct
 * code, and the documented pair could not see it:
 *
 *   wp_redirect — the signal was a bare `wp_redirect(`, so every use of an
 *   ordinary WordPress function was flagged. The pair passed only because the
 *   entry's correct example uses wp_safe_redirect(), so the signal never met
 *   correct wp_redirect() code at all.
 *
 *   the order-shaped variable — any `_suffix` counted, so $order_status and
 *   $order_number drew a WooCommerce upsell although neither is a post id.
 */
describe('connected rules — precision against correct code', () => {
  const fires = (code: string, slug: string) => slugsCaught(code).includes(slug);
  const REDIRECT = 'wp-redirect-with-user-input-use-wp-safe-redirect';

  it('BELL: wp_redirect with request input is still caught', () => {
    expect(fires(`<?php wp_redirect( $_GET['next'] );`, REDIRECT)).toBe(true);
  });

  it.each([
    ['a static redirect', `<?php wp_redirect( home_url( '/thanks/' ) ); exit;`],
    [
      'a whitelisted one where the superglobal is only in the check',
      `<?php if ( in_array( $_GET['p'], array( 'home' ), true ) ) { wp_redirect( site_url( 'home' ) ); }`,
    ],
  ])('SILENCE: %s must not be flagged', (_name, code) => {
    expect(fires(code, REDIRECT)).toBe(false);
  });
});

/**
 * Known limit, pinned deliberately (Gemini pass B, measured): suppressGuards
 * work at blob level. Two AJAX handlers in one blob, one verified, one not —
 * the guard sees the one check and silences both. Per law 1 the mechanism errs
 * quiet; scoping guards per handler needs real parsing, not regex, and is a
 * separate decision. If this test starts failing, the limit was lifted —
 * delete the test alongside that change, not before.
 */
describe('connected rules — blob-level guard limit (documented)', () => {
  it('a guarded handler silences an unguarded sibling in the same blob', () => {
    const two = `<?php
add_action('wp_ajax_safe', function() { check_ajax_referer('n'); update_option('a', 1); });
add_action('wp_ajax_unsafe', function() { update_option('b', $_POST['v']); });
`;
    expect(slugsCaught(two)).not.toContain('wp-ajax-handler-without-nonce');
  });
});

/**
 * Both rules below described a case in their own title that their signal could
 * not see (issue #101, measured against ordinary insecure PHP). Neither was a
 * missing entry: the knowledge was there and the signal looked for the wrong
 * shape, which is the failure mode a bell/silence pair taken from the entry
 * cannot catch — the entry's own example happened to use the covered form.
 */
describe('connected rules — REST route with no permission_callback at all', () => {
  const REST = 'rest-route-missing-permission-callback';
  const fires = (code: string) => slugsCaught(code).includes(REST);

  it.each([
    ['a single-call inline array', `<?php register_rest_route( 'x/v1', '/y', array( 'callback' => 'cb' ) );`],
    [
      'a multi-line inline array',
      `<?php
register_rest_route(
    'myplugin/v1',
    '/settings',
    [
        'methods'  => WP_REST_Server::EDITABLE,
        'callback' => 'myplugin_update_settings',
    ]
);`,
    ],
  ])('BELL: %s with no permission_callback is caught', (_name, code) => {
    expect(fires(code)).toBe(true);
  });

  it.each([
    [
      'permission_callback present in the same call',
      `<?php register_rest_route( 'x/v1', '/y', array( 'callback' => 'cb', 'permission_callback' => 'perm' ) );`,
    ],
    [
      'permission_callback written before callback',
      `<?php register_rest_route( 'x/v1', '/y', array( 'permission_callback' => 'perm', 'callback' => 'cb' ) );`,
    ],
    [
      // The false positive the issue warned about: no literal 'callback' key
      // stands in the call, so there is nothing for the signal to key on.
      'the argument array assembled in a variable',
      `<?php
$args = array( 'methods' => 'GET', 'callback' => 'cb', 'permission_callback' => '__return_true' );
register_rest_route( 'x/v1', '/y', $args );`,
    ],
    [
      'two correct registrations back to back',
      `<?php
register_rest_route( 'x/v1', '/a', array( 'callback' => 'a', 'permission_callback' => 'pa' ) );
register_rest_route( 'x/v1', '/b', array( 'callback' => 'b', 'permission_callback' => 'pb' ) );`,
    ],
  ])('SILENCE: %s must not be flagged', (_name, code) => {
    expect(fires(code)).toBe(false);
  });

  /**
   * Stated boundary, not an oversight. A closure among the arguments carries
   * braces and semicolons, and a regex cannot tell where such a span ends. The
   * span therefore refuses to cross them, so this registration stays silent
   * even though it really is missing its permission_callback. Silence with a
   * boundary the entry states beats an alarm on correct code. Lifting this
   * needs parsing — delete this test alongside that change, not before.
   */
  it('LIMIT: a closure among the arguments keeps the rule silent', () => {
    const code = `<?php
register_rest_route( 'x/v1', '/y', [
    'callback' => function () { return rest_ensure_response( array() ); },
] );`;
    expect(fires(code)).toBe(false);
  });
});

describe('connected rules — superglobal used inline, not assigned', () => {
  const SG = 'superglobal-without-sanitize';
  const fires = (code: string) => slugsCaught(code).includes(SG);

  it.each([
    ['concatenated straight into echo', `<?php echo '<div>' . $_GET['name'] . '</div>';`],
    ['echoed bare', `<?php echo $_POST['message'];`],
    ['printed bare', `<?php print $_REQUEST['q'];`],
    [
      // Bounded by `;`, so one escaped statement cannot vouch for the next.
      'an escaped echo followed by an unescaped one',
      `<?php echo esc_html( $_GET['ok'] ); echo $_GET['bad'];`,
    ],
    [
      // Found in the Stufe-3 gap pass by probing the channel list: `\bprint\b`
      // never reaches printf, because the word boundary fails on the trailing f.
      'passed to printf',
      `<?php printf( '<b>%s</b>', $_GET['q'] );`,
    ],
    ['passed to vprintf', `<?php vprintf( '<b>%s</b>', array( $_GET['q'] ) );`],
    ['emitted through the short echo tag', `<?= $_GET['name'] ?>`],
    [
      // The span crosses newlines — only a semicolon stops it.
      'concatenated across several lines',
      `<?php echo '<div>'\n  . '<span>'\n  . $_GET['name']\n  . '</span>';`,
    ],
  ])('BELL: a superglobal %s is caught', (_name, code) => {
    expect(fires(code)).toBe(true);
  });

  it.each([
    ['escaped on output', `<?php echo esc_html( $_GET['q'] );`],
    ['cast with absint', `<?php $id = absint( $_GET['id'] );`],
    ['escaped inside an attribute', `<?php echo '<input value="' . esc_attr( $_POST['v'] ) . '">';`],
    ['unslashed then escaped', `<?php echo esc_html( wp_unslash( $_POST['name'] ) );`],
    ['only checked with isset', `<?php if ( isset( $_GET['x'] ) ) { echo 'yes'; }`],
    [
      // A read compared against a literal is not a defect, and flagging it
      // would be the noise this product exists to avoid.
      'compared against a literal',
      `<?php if ( isset( $_POST['action'] ) && 'save' === $_POST['action'] ) { echo 'saved'; }`,
    ],
    ['escaped inside printf', `<?php printf( '<b>%s</b>', esc_html( $_GET['q'] ) );`],
    [
      // sprintf returns a string rather than emitting one, so its result can
      // still be escaped on the way out. Treating it as a sink would flag this.
      'built with sprintf and escaped on output',
      `<?php $s = sprintf( '<b>%s</b>', $_GET['q'] ); echo wp_kses_post( $s );`,
    ],
  ])('SILENCE: %s must not be flagged', (_name, code) => {
    expect(fires(code)).toBe(false);
  });
});

describe('connected rules — the registry really carries them', () => {
  it('all 17 slugs resolve to a snapshot entry', () => {
    for (const slug of CONNECTED_SLUGS) expect(entryFor(slug).slug).toBe(slug);
  });
});
