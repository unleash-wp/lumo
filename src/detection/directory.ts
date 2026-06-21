import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PluginDetection } from './types.js';

const WOO_PLUGIN_PATHS = [
  'wp-content/plugins/woocommerce/woocommerce.php',
  'web/app/plugins/woocommerce/woocommerce.php', // Bedrock layout
] as const;

/**
 * Parse the WordPress plugin header `Version:` line from the plugin file content.
 * Returns null when the header is absent or unparseable.
 */
function parseVersionHeader(content: string): string | null {
  // WordPress plugin headers appear inside a `/** ... */` docblock where each
  // line starts with optional whitespace + `*` + whitespace, e.g. ` * Version: 8.6.1`
  const match = /^[ \t*]*Version:[ \t]*(.+)$/m.exec(content);
  const raw = match?.[1]?.trim();
  return raw ?? null;
}

/**
 * Detect WooCommerce from the plugin directory in the given project root.
 * Tries the standard path first, then the Bedrock layout.
 * Returns null when neither path exists or the Version header is missing.
 * NEVER throws.
 */
export function detectFromDirectory(projectRoot: string): PluginDetection | null {
  for (const relPath of WOO_PLUGIN_PATHS) {
    try {
      const fullPath = join(projectRoot, relPath);
      const content = readFileSync(fullPath, 'utf8');
      const version = parseVersionHeader(content);
      return {
        slug: 'woocommerce',
        version,
        source: 'directory',
      };
    } catch {
      // File not found or unreadable — try next path
    }
  }
  return null;
}
