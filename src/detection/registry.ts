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
    directoryPaths: ['.env'],
    sourceSignals: [],
  },
  {
    pattern: 'wordpress-core',
    composerKeys: [],
    directoryPaths: [],
    sourceSignals: ['wp_img_tag_add_decoding_attr('],
  },
];
