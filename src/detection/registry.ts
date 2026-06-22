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
}

export const PATTERNS: readonly PatternDefinition[] = [
  {
    pattern: 'woocommerce',
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
      {
        match: /\bget_post_meta\s*\(\s*\$\w*order\w*/,
        class: 'CONTEXT_DEPENDENT',
        entrySlug: 'woocommerce-hpos-order-access',
        condition: '$order_id is a WooCommerce order',
        language: 'php',
      },
      {
        match: /\bupdate_post_meta\s*\(\s*\$\w*order\w*/,
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
];
