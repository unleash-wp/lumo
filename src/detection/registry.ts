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
  },
  {
    pattern: 'env-in-git',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: [],
    gitTrackedPaths: ['.env'],
  },
  {
    pattern: 'wordpress-core',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: ['wp_img_tag_add_decoding_attr('],
  },
  {
    // Fires when composer.json IS tracked but composer.lock is NOT — missing lock file.
    pattern: 'wordpress-dependencies',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: [],
    gitTrackedPaths: ['composer.json'],
    gitMissingPaths: ['composer.lock'],
  },
  {
    // Heuristic: tight key prefixes for real Stripe / GitHub / AWS keys. SendGrid's
    // "SG." is omitted — as a substring it would match "MSG." etc.; precision wins.
    pattern: 'hardcoded-secrets',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: ['sk_live_', 'sk_test_', 'ghp_', 'AKIA'],
  },
];
