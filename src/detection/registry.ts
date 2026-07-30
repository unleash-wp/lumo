// ---------------------------------------------------------------------------
// CatchSignal — additive blob-in detection (does NOT affect sourceSignals or
// the project-scan path; those are read independently by detectFromSource).
// ---------------------------------------------------------------------------

/**
 * Signal class per the precision model.
 *
 * CERTAIN        — self-evident from the blob alone; eligible for LOUD (gated by
 *                  version stamp + breaking_change).
 * CONTEXT_DEPENDENT — truth depends on a fact the blob cannot prove; caps at SOFT.
 * REPO_STATE     — a repository-level fact (tracked file, missing lock); caps at
 *                  SILENT on a bare blob (domain of lumo_audit, not lumo_check_code).
 */
export type SignalClass = 'CERTAIN' | 'CONTEXT_DEPENDENT' | 'REPO_STATE';

export interface CatchSignal {
  /** Lexical matcher. A string is tested as a substring; a RegExp is exec'd on the blob. */
  match: string | RegExp;
  class: SignalClass;
  /** Slug of the snapshot entry whose body/version data backs this catch. */
  entrySlug: string;
  /**
   * For CONTEXT_DEPENDENT: the unprovable fact, expressed as the SOFT condition.
   * e.g. "$order_id is a WooCommerce order"
   */
  condition?: string;
  /**
   * Optional shim-guard: if this RegExp matches anywhere in the blob alongside a
   * CERTAIN signal, the catch downgrades from LOUD to SOFT (shim/polyfill context).
   */
  shimGuard?: RegExp;
  /**
   * Optional suppress-guard: if this RegExp matches anywhere in the blob, the signal
   * is suppressed entirely (SILENT). Used for absence-in-presence signals where a
   * correct form of the same pattern is already present — e.g. the flag we expect
   * to be missing is actually there.
   */
  suppressGuard?: RegExp;
  language: 'php' | 'js';
  /**
   * When true, test this signal against a blob with BOTH comments AND quoted string
   * bodies stripped. Use for call-pattern signals whose match target is a function
   * name with an open paren — a function name inside a string literal is not a call.
   *
   * When false/absent, only comments are stripped (default). Use for signals whose
   * match target IS a string literal (e.g. 'shop_order', 'sk_live_') — stripping
   * the string body would erase the very signal being detected.
   */
  stripStrings?: boolean;
}

export interface PatternDefinition {
  /** Pattern + routing key. Equals the snapshot category_slug to route to. */
  pattern: string;
  /** composer require/require-dev keys that imply this pattern. */
  composerKeys: readonly string[];
  /** plugin-file paths (relative to projectRoot) whose presence implies it. */
  directoryPaths: readonly string[];
  /** wp-cli: `wp plugin get <wpCliSlug>` — omit to skip wp-cli for this pattern. */
  wpCliSlug?: string;
  /** substrings in project .php source that imply it (heuristic last resort). */
  sourceSignals: readonly string[];
  /**
   * Paths that must ALL be git-tracked for a match.
   * Combined with gitMissingPaths for a unified rule: match only when every
   * gitTrackedPaths entry IS tracked AND every gitMissingPaths entry is NOT tracked.
   */
  gitTrackedPaths?: readonly string[];
  /**
   * Paths that must ALL be absent from git tracking for a match.
   * Used together with gitTrackedPaths: the pattern fires when the tracked set
   * is present and the missing set is absent.
   */
  gitMissingPaths?: readonly string[];
  /**
   * Blob-in catch signals for lumo_check_code. Additive — sourceSignals and the
   * project-scan path are NEVER read from this field and remain byte-identical.
   */
  catchSignals?: readonly CatchSignal[];
  /**
   * When true, Lumo Free has no knowledge entry for this pattern. Detection
   * surfaces an honest Pro teaser instead of a Free answer. The teaser is
   * additive: Free patterns (WooCommerce, wordpress-core, etc.) still win when
   * detected first in the ladder.
   */
  proTeaser?: true;
  /**
   * Human-readable plugin name shown in the Pro teaser message.
   * Required when proTeaser is true.
   */
  proTeaserName?: string;
  /**
   * When true, Pro has curated knowledge for this plugin and the upgrade
   * promise is honest. When false or absent on a proTeaser entry, the upgrade
   * CTA is suppressed — detection is kept as a demand signal but no promise
   * is made to the user that Pro has answers.
   */
  hasProCoverage?: true;
}

export const PATTERNS: readonly PatternDefinition[] = [
  {
    // WordPress Abilities API — fires when wp_register_ability() is called AND
    // the mcp.public flag is absent. Absence-in-presence: the call exists but the
    // MCP opt-in flag does not. CONTEXT_DEPENDENT because the developer may not
    // intend this ability to be MCP-visible — always SOFT, never LOUD.
    //
    // suppressGuard: if 'public' => true already appears in the mcp array of this
    // blob, the ability is correctly configured — suppress the signal entirely.
    // The guard pattern is intentionally broad ('public'\s*=>\s*true) so it catches
    // both single and double quotes; false positives here are safe (suppression =
    // conservative, the user already did the right thing or something similar).
    pattern: 'wp-abilities-api',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: [],
    catchSignals: [
      {
        match: /\bwp_register_ability\s*\(/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'wp-ability-missing-mcp-public',
        condition: 'you intend this ability to be reachable by MCP clients (Claude Code, Cursor)',
        suppressGuard: /['"]public['"]\s*=>\s*true/,
        language: 'php',
      },
    ],
  },
  {
    pattern: 'woocommerce',
    // WooCommerce knowledge is Pro-only. Detection must still fire, or a Free
    // user auditing a WooCommerce project would be told "nothing to check here"
    // — silence read as a clean bill of health on code Lumo simply cannot see.
    // The teaser names what was detected and what covers it.
    proTeaser: true,
    proTeaserName: 'WooCommerce',
    hasProCoverage: true,
    composerKeys: ['woocommerce/woocommerce', 'wpackagist-plugin/woocommerce'],
    directoryPaths: [
      'wp-content/plugins/woocommerce/woocommerce.php',
      'web/app/plugins/woocommerce/woocommerce.php',
    ],
    wpCliSlug: 'woocommerce',
    sourceSignals: ['wc_get_order(', 'WC_Order', 'Automattic\\WooCommerce'],
    catchSignals: [
      // LOUD: the post-type literal 'shop_order' is self-evident in the blob.
      {
        match: /get_posts\s*\(\s*(?:array\s*\(|\[)[^)]*['"]shop_order['"]/,
        class: 'CERTAIN',
        entrySlug: 'woocommerce-hpos-order-access',
        language: 'php',
      },
      {
        match: /['"]post_type['"]\s*=>\s*['"]shop_order['"]/,
        class: 'CERTAIN',
        entrySlug: 'woocommerce-hpos-order-access',
        language: 'php',
      },
      // SOFT: $order_id-shaped variable passed to get_post_meta / update_post_meta /
      // get_post — CONTEXT_DEPENDENT because the variable could be any post id.
      //
      // The name must be order-shaped AND id-shaped. A bare \w*order\w* also matched
      // $recorder_id, $border_id, $orderby_post_id and $reorder_id — none of them
      // WooCommerce. Allowing any _suffix then still matched $order_status and
      // $order_number, which are not post ids either. Since a dropped Pro entry now
      // surfaces a named teaser instead of silence, that imprecision would put a
      // WooCommerce upsell on an audio plugin.
      {
        match: /\bget_post_meta\s*\(\s*\$(?:\w+_)?order(?:_id|_ID)?\b/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'woocommerce-hpos-order-access',
        condition: '$order_id is a WooCommerce order',
        language: 'php',
      },
      {
        match: /\bupdate_post_meta\s*\(\s*\$(?:\w+_)?order(?:_id|_ID)?\b/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'woocommerce-hpos-order-access',
        condition: '$order_id is a WooCommerce order',
        language: 'php',
      },
    ],
  },
  {
    pattern: 'env-in-git',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: [],
    gitTrackedPaths: ['.env'],
    // No catchSignals: .env presence is a repo-state fact, not a blob fact.
  },
  {
    pattern: 'wordpress-core',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: ['wp_img_tag_add_decoding_attr('],
    catchSignals: [
      // LOUD: the deprecated function name is self-evident.
      // shimGuard: if the same blob contains a function_exists guard for this
      // symbol, the dev is writing a polyfill — downgrade to SOFT.
      // stripStrings: the match target is a call pattern; a mention inside a
      // string literal is not a call and must not fire.
      {
        match: /\bwp_img_tag_add_decoding_attr\s*\(/,
        class: 'CERTAIN',
        entrySlug: 'wp-img-tag-add-decoding-attr-deprecation',
        shimGuard: /function_exists\s*\(\s*['"]wp_img_tag_add_decoding_attr['"]/,
        language: 'php',
        stripStrings: true,
      },
    ],
  },
  {
    // Fires when composer.json IS tracked but composer.lock is NOT — missing lock file.
    pattern: 'wordpress-dependencies',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: [],
    gitTrackedPaths: ['composer.json'],
    gitMissingPaths: ['composer.lock'],
    // No catchSignals: composer.lock absence is a repo-state fact.
  },
  {
    // Heuristic: tight key prefixes for real Stripe / GitHub / AWS keys. SendGrid's
    // "SG." is omitted — as a substring it would match "MSG." etc.; precision wins.
    pattern: 'hardcoded-secrets',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: ['sk_live_', 'sk_test_', 'ghp_', 'AKIA'],
    catchSignals: [
      // SOFT (REPO_STATE edge): a literal key prefix in a blob is suspicious
      // but we can't make a dated version claim — always SOFT, never LOUD.
      {
        match: /['"]sk_live_/,
        class: 'REPO_STATE',
        entrySlug: 'hardcoded-api-keys-secrets',
        language: 'php',
      },
      {
        match: /['"]ghp_/,
        class: 'REPO_STATE',
        entrySlug: 'hardcoded-api-keys-secrets',
        language: 'php',
      },
    ],
  },
  {
    pattern: 'gutenberg',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: [],
    catchSignals: [
      // LOUD: isValidBlockContent was removed — self-evident JS symbol.
      // stripStrings: a call in a string literal is not an actual call.
      {
        match: /\bisValidBlockContent\s*\(/,
        class: 'CERTAIN',
        entrySlug: 'gutenberg-isvalidblockcontent-removed',
        language: 'js',
        stripStrings: true,
      },
      // LOUD: apiVersion: 2 (v2 specifically) inside a registerBlockType call.
      // Narrowed from [12] to 2: the entry documents v2 deprecation; a v1 match
      // would cite v2 evidence against v1 code — a factual misalignment.
      // stripStrings: a mention inside a string comment is not a registration.
      {
        match: /apiVersion\s*:\s*2\b/,
        class: 'CERTAIN',
        entrySlug: 'gutenberg-apiversion-2-deprecated-wp6-9',
        language: 'js',
        stripStrings: true,
      },
      // SOFT: useSetting — deprecated but not breaking (breaking_change: false).
      // The precision model caps this at SOFT regardless of import presence.
      // stripStrings: a mention in a string is not an actual call.
      {
        match: /\buseSetting\s*\(/,
        class: 'CERTAIN',
        entrySlug: 'gutenberg-usesetting-deprecated-wp6-5',
        language: 'js',
        stripStrings: true,
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // Premium agency plugins — Pro-teaser only.
  // Detection fires when the plugin is found; Free has no knowledge entry for
  // these. auditProject surfaces a measured teaser instead of a blank no-match.
  // ---------------------------------------------------------------------------

  {
    pattern: 'premium-acf-pro',
    proTeaser: true,
    proTeaserName: 'Advanced Custom Fields Pro',
    hasProCoverage: true,
    composerKeys: [],
    directoryPaths: [
      'wp-content/plugins/advanced-custom-fields-pro/acf.php',
      'web/app/plugins/advanced-custom-fields-pro/acf.php',
    ],
    wpCliSlug: 'advanced-custom-fields-pro',
    sourceSignals: ['acf_add_local_field_group(', 'acf_register_block_type('],
  },
  {
    pattern: 'premium-acf-extended',
    proTeaser: true,
    proTeaserName: 'ACF Extended',
    composerKeys: [],
    directoryPaths: [
      'wp-content/plugins/acf-extended/acf-extended.php',
      'web/app/plugins/acf-extended/acf-extended.php',
    ],
    wpCliSlug: 'acf-extended',
    sourceSignals: ['acfe_add_options_page(', 'acfe_get_post_field_groups('],
  },
  {
    pattern: 'premium-gravity-forms',
    proTeaser: true,
    proTeaserName: 'Gravity Forms',
    hasProCoverage: true,
    composerKeys: [],
    directoryPaths: [
      'wp-content/plugins/gravityforms/gravityforms.php',
      'web/app/plugins/gravityforms/gravityforms.php',
    ],
    wpCliSlug: 'gravityforms',
    sourceSignals: ['GFForms::', 'gform_after_submission'],
  },
  {
    pattern: 'premium-meta-box',
    proTeaser: true,
    proTeaserName: 'Meta Box',
    hasProCoverage: true,
    composerKeys: ['meta-box/meta-box'],
    directoryPaths: [
      'wp-content/plugins/meta-box/meta-box.php',
      'web/app/plugins/meta-box/meta-box.php',
    ],
    wpCliSlug: 'meta-box',
    sourceSignals: ['rwmb_meta(', 'rwmb_the_field('],
  },
  {
    pattern: 'premium-pods',
    proTeaser: true,
    proTeaserName: 'Pods',
    composerKeys: [],
    directoryPaths: [
      'wp-content/plugins/pods/init.php',
      'web/app/plugins/pods/init.php',
    ],
    wpCliSlug: 'pods',
    sourceSignals: ['pods_field(', 'pods_field_display('],
  },
  {
    pattern: 'premium-carbon-fields',
    proTeaser: true,
    proTeaserName: 'Carbon Fields',
    hasProCoverage: true,
    composerKeys: ['htmlburger/carbon-fields'],
    directoryPaths: [
      'wp-content/plugins/carbon-fields/carbon-fields-plugin.php',
      'web/app/plugins/carbon-fields/carbon-fields-plugin.php',
    ],
    sourceSignals: ['carbon_get_post_meta(', 'Carbon_Fields\\Container\\Container'],
  },
  {
    pattern: 'premium-toolset-types',
    proTeaser: true,
    proTeaserName: 'Toolset Types',
    composerKeys: [],
    directoryPaths: [
      'wp-content/plugins/types/plugin.php',
      'web/app/plugins/types/plugin.php',
    ],
    wpCliSlug: 'types',
    sourceSignals: ['types_render_field(', 'types_field('],
  },
  {
    pattern: 'premium-elementor-pro',
    proTeaser: true,
    proTeaserName: 'Elementor Pro',
    hasProCoverage: true,
    composerKeys: [],
    directoryPaths: [
      'wp-content/plugins/elementor-pro/elementor-pro.php',
      'web/app/plugins/elementor-pro/elementor-pro.php',
    ],
    wpCliSlug: 'elementor-pro',
    sourceSignals: ['\\Elementor\\Widget_Base'],
  },
  {
    pattern: 'premium-wpbakery',
    proTeaser: true,
    proTeaserName: 'WPBakery Page Builder',
    composerKeys: [],
    directoryPaths: [
      'wp-content/plugins/js_composer/js_composer.php',
      'web/app/plugins/js_composer/js_composer.php',
    ],
    wpCliSlug: 'js-composer',
    sourceSignals: ['vc_map(', 'vc_add_param('],
  },
  {
    pattern: 'premium-polylang',
    proTeaser: true,
    proTeaserName: 'Polylang',
    composerKeys: [],
    directoryPaths: [
      'wp-content/plugins/polylang-pro/polylang.php',
      'web/app/plugins/polylang-pro/polylang.php',
      'wp-content/plugins/polylang/polylang.php',
      'web/app/plugins/polylang/polylang.php',
    ],
    wpCliSlug: 'polylang',
    sourceSignals: ['pll_e(', 'pll_current_language('],
  },
  {
    pattern: 'premium-rank-math',
    proTeaser: true,
    proTeaserName: 'Rank Math SEO',
    composerKeys: [],
    directoryPaths: [
      'wp-content/plugins/seo-by-rank-math-pro/rank-math.php',
      'web/app/plugins/seo-by-rank-math-pro/rank-math.php',
      'wp-content/plugins/seo-by-rank-math/rank-math.php',
      'web/app/plugins/seo-by-rank-math/rank-math.php',
    ],
    wpCliSlug: 'seo-by-rank-math',
    sourceSignals: ['RankMath\\JSON_LD\\', 'rank_math_get_head('],
  },
  {
    pattern: 'premium-wp-rocket',
    proTeaser: true,
    proTeaserName: 'WP Rocket',
    composerKeys: [],
    directoryPaths: [
      'wp-content/plugins/wp-rocket/wp-rocket.php',
      'web/app/plugins/wp-rocket/wp-rocket.php',
    ],
    wpCliSlug: 'wp-rocket',
    sourceSignals: ['rocket_clean_domain(', 'rocket_clean_post('],
  },
  {
    pattern: 'premium-wordfence',
    proTeaser: true,
    proTeaserName: 'Wordfence Security',
    composerKeys: [],
    directoryPaths: [
      'wp-content/plugins/wordfence/wordfence.php',
      'web/app/plugins/wordfence/wordfence.php',
    ],
    wpCliSlug: 'wordfence',
    sourceSignals: ['wfBlock::', 'wordfence::liveTraf('],
  },
  {
    pattern: 'premium-wc-subscriptions',
    proTeaser: true,
    proTeaserName: 'WooCommerce Subscriptions',
    hasProCoverage: true,
    composerKeys: [],
    directoryPaths: [
      'wp-content/plugins/woocommerce-subscriptions/woocommerce-subscriptions.php',
      'web/app/plugins/woocommerce-subscriptions/woocommerce-subscriptions.php',
    ],
    wpCliSlug: 'woocommerce-subscriptions',
    sourceSignals: ['WC_Subscriptions::', 'wcs_get_subscription('],
    // Detection + teaser only, like the other Pro-covered premium plugins
    // (acf-pro, elementor-pro): the WooCommerce Subscriptions knowledge lives in
    // Lumo Pro, so there is no Free-snapshot entry to render a catch against here.
    // The subscription get_post_meta footgun is caught Pro-side via wcs-content.ts.
  },

  {
    // WordPress 7.0 Interactivity API changes (released May 20, 2026 — after model training cutoff).
    //
    // Signal 1: state.navigation.hasStarted / state.navigation.hasFinished read from
    // the core/router store. CERTAIN because the property chain is self-evident; caps
    // at SOFT because breakingChange is false (deprecated in 7.0, will break in 7.1).
    // stripStrings: a mention inside a string is not a property access.
    //
    // Signal 2: import { effect } from '@preact/signals' alongside @wordpress/interactivity
    // usage. CONTEXT_DEPENDENT because @preact/signals is a general-purpose library —
    // the signal only fires when the two co-occur, but we cannot prove the caller
    // intended this as an @wordpress/interactivity-specific pattern from the blob alone.
    pattern: 'wordpress-7-0',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: [],
    catchSignals: [
      // SOFT: deprecated state.navigation properties — breaking_change: false in entry
      // (they deprecated in 7.0; will stop working in 7.1).
      // stripStrings: property access inside a string is not a real access.
      {
        match: /\bstate\.navigation\.has(?:Started|Finished)\b/,
        class: 'CERTAIN',
        entrySlug: 'wp-7-0-router-navigation-deprecated',
        language: 'js',
        stripStrings: true,
      },
      // SOFT: effect imported directly from @preact/signals alongside @wordpress/interactivity.
      // Cannot be LOUD — CONTEXT_DEPENDENT because @preact/signals is a general library.
      // suppressGuard: if the blob already imports watch from @wordpress/interactivity,
      // the developer is doing the right thing — suppress entirely.
      {
        match: /from\s+['"]@preact\/signals['"]/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'wp-7-0-interactivity-watch',
        condition: 'this code is used alongside @wordpress/interactivity',
        suppressGuard: /from\s+['"]@wordpress\/interactivity['"]/,
        language: 'js',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // Curated code rules connected from the knowledge base. No plugin detection:
  // empty composer/directory/sourceSignals keeps them out of the project-scan
  // ladder, so they only ever fire on a blob.
  //
  // Held back deliberately: 14 further curated rules match on the mere presence
  // of a call (add_action('wp_ajax_…'), register_rest_route(…)) rather than on the
  // absence of the guard, so they also fire on the fix the entry itself
  // recommends. Connecting them needs a suppressGuard each — judgement work, not
  // translation. See PROGRESS.md.
  // ---------------------------------------------------------------------------
  {
    // Security fundamentals — wrong in every WordPress version, so no version fact
    // anchors them and classify() caps them at SOFT. Raising that is the open
    // severity decision; this translation does not pre-empt it.
    //
    // Signals translated 1:1 from the knowledge base. Only rules whose documented
    // wrong form is caught AND whose documented fix stays quiet are connected here.
    pattern: 'wordpress-security-fundamentals',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: [],
    catchSignals: [
      {
        match: /\$\w+\s*=\s*\$_(?:POST|GET|REQUEST)\s*\[/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'superglobal-without-sanitize',
        condition: 'the assigned variable is used without a sanitize_*() / absint() / intval() / (int) cast wrapping the superglobal read',
        language: 'php',
      },
      {
        match: /\$wpdb\s*->\s*(?:query|get_results|get_var|get_row|get_col)\s*\(\s*"[^"]*\$\w/,
        class: 'CERTAIN',
        entrySlug: 'wpdb-query-without-prepare-sql-injection',
        language: 'php',
      },
      {
        match: /\$wpdb\s*->\s*(?:query|get_results|get_var|get_row|get_col)\s*\(\s*\$[a-zA-Z_]\w*\s*\./,
        class: 'CERTAIN',
        entrySlug: 'wpdb-query-without-prepare-sql-injection',
        language: 'php',
      },
      // The presence-matchers below were held back until each carried a
      // suppressGuard on the correct form its own entry recommends — without
      // the guard they fired on the documented fix (measured, 13 of 13).
      // Guards were validated against both documented forms per rule before
      // connecting: signal catches bad_pattern, guard recognises code_example,
      // guard does not suppress the real hit.
      {
        match: /add_action\s*\(\s*['"]admin_post_/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'admin-action-without-capability-check',
        condition: 'the handler does not call current_user_can() before performing the operation',
        suppressGuard: /current_user_can\s*\(/,
        language: 'php',
      },
      {
        match: /add_action\s*\(\s*['"]admin_action_/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'admin-action-without-capability-check',
        condition: 'the handler does not call current_user_can() before performing the operation',
        suppressGuard: /current_user_can\s*\(/,
        language: 'php',
      },
      {
        // CERTAIN on the literal: '__return_true' as permission_callback is
        // self-evident. The guard encodes the one documented-correct case — a
        // read-only public route, where __return_true is intentional.
        match: /'permission_callback'\s*=>\s*'__return_true'/,
        class: 'CERTAIN',
        entrySlug: 'rest-route-missing-permission-callback',
        condition: 'the route performs a mutating operation (POST/PUT/PATCH/DELETE)',
        suppressGuard: /['"]methods['"]\s*=>\s*(?:WP_REST_Server::READABLE|['"]GET['"])/,
        language: 'php',
      },
      {
        match: /add_filter\s*\(\s*['"]the_content['"]/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'the-content-filter-without-loop-guard',
        condition: 'the callback does not guard on is_main_query()/in_the_loop()',
        suppressGuard: /is_main_query\s*\(|in_the_loop\s*\(|is_singular\s*\(/,
        language: 'php',
      },
      {
        match: /add_action\s*\(\s*['"]wp_ajax_/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'wp-ajax-handler-without-nonce',
        condition: 'the handler does not verify a nonce before acting',
        suppressGuard: /check_ajax_referer\s*\(|wp_verify_nonce\s*\(|check_admin_referer\s*\(/,
        language: 'php',
      },
    ],
  },
  {
    // Plugin-standard rules — structure and hygiene the WordPress handbook requires.
    //
    // Signals translated 1:1 from the knowledge base. Only rules whose documented
    // wrong form is caught AND whose documented fix stays quiet are connected here.
    pattern: 'wordpress-plugin-standards',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: [],
    catchSignals: [
      {
        match: /\b__\s*\(\s*['"][^'"]+['"]\s*\)/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'i18n-function-missing-text-domain',
        condition: 'the call is missing the second argument (text-domain) — e.g. __( \'Hello\' ) instead of __( \'Hello\', \'myplugin\' )',
        language: 'php',
      },
      {
        match: /\b_e\s*\(\s*['"][^'"]+['"]\s*\)/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'i18n-function-missing-text-domain',
        condition: 'the call is missing the second argument (text-domain) — e.g. _e( \'Hello\' ) instead of _e( \'Hello\', \'myplugin\' )',
        language: 'php',
      },
      {
        match: /\besc_(?:html|attr)__\s*\(\s*['"][^'"]+['"]\s*\)/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'i18n-function-missing-text-domain',
        condition: 'the escaping i18n function is missing the text-domain second argument',
        language: 'php',
      },
      // php-file-missing-abspath-guard is NOT connected, on purpose. Its signal
      // asks a file-level question ("does this file open with an ABSPATH guard?")
      // of a blob checker that is handed snippets. Measured against the 42
      // documented correct examples in the snapshot it fired on 16 of them — by
      // far the loudest rule in the set, and always wrong, because a snippet is
      // never a whole file. It belongs to a file-aware scan, not to the catch.
      {
        // Two conditions in one expression: request data appears in the blob, and
        // the redirect target is a bare variable rather than a built URL.
        //
        // A bare \bwp_redirect\s*\( fired on every use of an ordinary WordPress
        // function, including `wp_redirect( home_url( '/thanks/' ) )`. Requiring the
        // superglobal INSIDE the call was too narrow the other way: the entry's own
        // wrong form assigns `$_GET['redirect_to']` to a variable first and redirects
        // with that. Neither error was visible in the documented pair, because the
        // correct example uses wp_safe_redirect() and so never met the signal.
        //
        // `wp_redirect( site_url( 'home' ) )` next to a whitelist check on $_GET is
        // therefore quiet — the target is a call, not a variable.
        // Two shapes, because request data reaches the call either way: assigned to
        // a variable first, or passed inline.
        match:
          /\$_(?:GET|POST|REQUEST)\b[\s\S]{0,400}?\bwp_redirect\s*\(\s*\$\w+|\bwp_redirect\s*\(\s*[^;)]{0,80}\$_(?:GET|POST|REQUEST)\b/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'wp-redirect-with-user-input-use-wp-safe-redirect',
        condition: 'the URL argument may be derived from user-controlled input ($_GET, $_POST, $_REQUEST, or any unsanitized variable) — wp_safe_redirect() restricts the destination to the same host + allowed hosts list, eliminating open redirect risk',
        stripStrings: true,
        language: 'php',
      },
      // Presence-matcher, connected with its validated suppressGuard (see the
      // note in wordpress-security-fundamentals).
      {
        match: /\bwp_enqueue_(?:script|style)\s*\(\s*['"][^'"]+['"]/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'enqueue-scripts-styles-global-scope',
        condition: 'the enqueue is not gated to the pages that actually use the asset',
        suppressGuard: /is_singular\s*\(|is_page\s*\(|is_front_page\s*\(|get_current_screen\s*\(|is_product\s*\(|is_admin\s*\(/,
        language: 'php',
      },
    ],
  },
  {
    // Core API breadth — the everyday Core surface: HTTP, roles and capabilities.
    //
    // Signals translated 1:1 from the knowledge base. Only rules whose documented
    // wrong form is caught AND whose documented fix stays quiet are connected here.
    pattern: 'wordpress-core-breadth',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: [],
    catchSignals: [
      {
        match: /current_user_can\s*\(\s*['"](?:administrator|editor|author|contributor|subscriber)['"]\s*\)/,
        class: 'CERTAIN',
        entrySlug: 'wp-current-user-can-role-name-not-capability',
        language: 'php',
      },
      {
        match: /in_array\s*\(\s*['"][a-z_]+['"]\s*,\s*\$[a-zA-Z_]+->roles/,
        class: 'CERTAIN',
        entrySlug: 'wp-direct-role-check-instead-of-capability',
        language: 'php',
      },
      {
        match: /\bcurl_init\s*\(/,
        class: 'CERTAIN',
        entrySlug: 'wp-raw-curl-instead-of-http-api',
        stripStrings: true,
        language: 'php',
      },
      {
        match: /\bcurl_exec\s*\(/,
        class: 'CERTAIN',
        entrySlug: 'wp-raw-curl-instead-of-http-api',
        stripStrings: true,
        language: 'php',
      },
      // Presence-matchers, connected with their validated suppressGuards (see
      // the note in wordpress-security-fundamentals).
      {
        match: /\badd_option\s*\([^;]*(?:json_encode|get_posts|serialize)\s*\(/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'wp-add-option-large-data-missing-autoload-false',
        condition: 'the option stores large data and autoload is not set to false',
        suppressGuard: /,\s*(?:''|"")\s*,\s*false\b/,
        language: 'php',
      },
      {
        match: /\bregister_activation_hook\s*\(/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'wp-cron-missing-deactivation-unschedule',
        condition: 'the plugin schedules cron events and does not unschedule them on deactivation',
        suppressGuard: /wp_clear_scheduled_hook\s*\(|wp_unschedule_event\s*\(/,
        language: 'php',
      },
      {
        match: /\bis_admin\s*\(\s*\)/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'wp-is-admin-not-authorization-check',
        condition: 'is_admin() is used as an authorization check — it only tests whether an admin PAGE is rendering, not whether the user may act',
        suppressGuard: /current_user_can\s*\(/,
        language: 'php',
      },
      {
        match: /\bwp_remote_(?:get|post|put|delete|patch|request)\s*\(/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'wp-remote-missing-is-wp-error-check',
        condition: 'the response is used without an is_wp_error() check first',
        suppressGuard: /is_wp_error\s*\(/,
        language: 'php',
      },
      {
        match: /\bget_transient\s*\(/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'wp-transient-missing-false-check-fallback',
        condition: 'the transient value is used without a strict false check and regeneration fallback',
        suppressGuard: /false\s*===|===\s*false/,
        language: 'php',
      },
    ],
  },
];
