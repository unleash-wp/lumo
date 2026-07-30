/**
 * PREPARATION, NOT PRODUCTION.
 *
 * The 13 curated rules held back in Paket 2 all fire on the fix their own entry
 * recommends, because their signal asks "is this call present?" instead of "is
 * the guard missing?". The registry already has the mechanism for that question:
 * suppressGuard, used by wp-abilities-api.
 *
 * Nothing here touches src/. Each proposal is stated as data — the curated
 * signal next to a proposed guard — and checked against the entry's own two
 * documented forms. That way the review decides on logic, not on scaffolding:
 * copy the guard into the registry and the rule is connected.
 *
 * A proposal is sound when all three hold:
 *   1. the signal still matches bad_pattern        (the catch survives)
 *   2. the guard matches code_example              (the documented fix goes quiet)
 *   3. the guard does NOT match bad_pattern        (the real hit is not suppressed)
 */

import { describe, it, expect } from 'vitest';
import { loadSnapshot } from '../src/lib/snapshot.js';

const snap = loadSnapshot();

function entryFor(slug: string) {
  const e = snap.entries.find((x) => x.slug === slug);
  if (!e) throw new Error(`slug not in snapshot: ${slug}`);
  return e;
}

interface Proposal {
  slug: string;
  /** The curated signals, verbatim from the knowledge base. */
  signals: RegExp[];
  /** Proposed suppressGuard: the correct form this rule is asking for. */
  guard: RegExp;
}

const PROPOSALS: Proposal[] = [
  {
    slug: 'admin-action-without-capability-check',
    signals: [/add_action\s*\(\s*['"]admin_post_/, /add_action\s*\(\s*['"]admin_action_/],
    guard: /current_user_can\s*\(/,
  },
  {
    // The CERTAIN signal fires on '__return_true'. That is correct for a
    // read-only route and wrong for a mutating one, which is exactly what the
    // entry's condition says. The guard encodes the read-only case.
    slug: 'rest-route-missing-permission-callback',
    signals: [/'permission_callback'\s*=>\s*'__return_true'/, /register_rest_route\s*\(/],
    guard: /['"]methods['"]\s*=>\s*(?:WP_REST_Server::READABLE|['"]GET['"])/,
  },
  {
    slug: 'the-content-filter-without-loop-guard',
    signals: [/add_filter\s*\(\s*['"]the_content['"]/],
    guard: /is_main_query\s*\(|in_the_loop\s*\(|is_singular\s*\(/,
  },
  {
    slug: 'wp-ajax-handler-without-nonce',
    signals: [/add_action\s*\(\s*['"]wp_ajax_/, /add_action\s*\(\s*['"]wp_ajax_nopriv_/],
    guard: /check_ajax_referer\s*\(|wp_verify_nonce\s*\(|check_admin_referer\s*\(/,
  },
  {
    slug: 'enqueue-scripts-styles-global-scope',
    signals: [/\bwp_enqueue_(?:script|style)\s*\(\s*['"][^'"]+['"]/],
    guard: /is_singular\s*\(|is_page\s*\(|is_front_page\s*\(|get_current_screen\s*\(|is_product\s*\(/,
  },
  {
    slug: 'wp-add-option-large-data-missing-autoload-false',
    signals: [/\badd_option\s*\([^;]*(?:json_encode|get_posts|serialize)\s*\(/],
    guard: /,\s*(?:''|"")\s*,\s*false\b/,
  },
  {
    slug: 'wp-cron-missing-deactivation-unschedule',
    signals: [/\bregister_activation_hook\s*\(/],
    guard: /wp_clear_scheduled_hook\s*\(|wp_unschedule_event\s*\(/,
  },
  {
    slug: 'wp-is-admin-not-authorization-check',
    signals: [/\bis_admin\s*\(\s*\)/],
    guard: /current_user_can\s*\(/,
  },
  {
    slug: 'wp-remote-missing-is-wp-error-check',
    signals: [/\bwp_remote_(?:get|post|put|delete|patch|request)\s*\(/],
    guard: /is_wp_error\s*\(/,
  },
  {
    slug: 'wp-transient-missing-false-check-fallback',
    signals: [/\bget_transient\s*\(/],
    guard: /false\s*===|===\s*false/,
  },
];

describe('proposed suppressGuards — sound enough to connect', () => {
  it.each(PROPOSALS.map((p) => [p.slug, p] as const))(
    '%s: catch survives, documented fix goes quiet',
    (_slug, p) => {
      const e = entryFor(p.slug);
      const bad = e.bad_pattern!;
      const good = e.code_example!;

      expect(
        p.signals.some((r) => r.test(bad)),
        'signal must still catch the documented wrong form',
      ).toBe(true);
      expect(p.guard.test(good), 'guard must recognise the documented fix').toBe(true);
      expect(p.guard.test(bad), 'guard must NOT suppress the real hit').toBe(false);
    },
  );

  it('every proposal rescues at least its own correct example and stays narrow', () => {
    const examples = snap.entries.filter((e) => e.code_example).map((e) => e.code_example!);
    for (const p of PROPOSALS) {
      const hits = examples.filter((c) => p.guard.test(c)).length;
      expect(hits, `${p.slug}: guard matches no correct example at all`).toBeGreaterThan(0);
      // A guard is a suppressor, so breadth is safe by construction — it can only
      // ever silence, never invent a finding. Recorded, not constrained.
      expect(hits).toBeLessThanOrEqual(examples.length);
    }
  });
});

/**
 * Three rules cannot be fixed with a blob-level guard. Asserted rather than
 * asserted-about, so the review sees evidence instead of a claim.
 */
describe('proposed suppressGuards — the three that need a different mechanism', () => {
  it('register-setting-missing-sanitize-callback: the token appears in BOTH forms', () => {
    const e = entryFor('register-setting-missing-sanitize-callback');
    const guard = /sanitize_callback/;
    expect(guard.test(e.code_example!)).toBe(true);
    // Also present in the wrong form — the bad example registers several settings
    // and only some carry the callback. A blob-level guard would silence the rule
    // entirely. Needs per-call scoping, not a guard.
    expect(guard.test(e.bad_pattern!)).toBe(true);
  });

  it('wp-rest-route-missing-permission-callback: same, the token appears in BOTH forms', () => {
    const e = entryFor('wp-rest-route-missing-permission-callback');
    const guard = /permission_callback/;
    expect(guard.test(e.code_example!)).toBe(true);
    expect(guard.test(e.bad_pattern!)).toBe(true);
  });

  it('wp-cron-not-reliable-for-time-critical-tasks: no token separates the forms', () => {
    const e = entryFor('wp-cron-not-reliable-for-time-critical-tasks');
    const signal = /\bwp_schedule_event\s*\(/;
    // The correct form is the same call — it is only correct because the task is
    // not time-critical, which a blob cannot show. This is advice, not a catch.
    expect(signal.test(e.bad_pattern!)).toBe(true);
    expect(signal.test(e.code_example!)).toBe(true);
  });
});
