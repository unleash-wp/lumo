import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { PluginDetection } from './types.js';

/**
 * Resolve whether a `wp` binary is on PATH without throwing.
 */
function wpBinaryAvailable(): boolean {
  try {
    const result = spawnSync('wp', ['--version'], { timeout: 3000, encoding: 'utf8' });
    return result.status === 0 && !result.error;
  } catch {
    return false;
  }
}

/**
 * Return true when `projectRoot` looks like a WordPress installation —
 * presence of wp-load.php or wp-content is sufficient.
 */
function looksLikeWordPress(projectRoot: string): boolean {
  return (
    existsSync(join(projectRoot, 'wp-load.php')) ||
    existsSync(join(projectRoot, 'wp-content'))
  );
}

/**
 * Detect WooCommerce version via WP-CLI.
 *
 * Only attempted when:
 *   - a `wp` binary resolves on PATH, AND
 *   - projectRoot contains wp-load.php or wp-content
 *
 * Uses spawnSync with a 5 s timeout. Any failure (non-zero exit, error,
 * timeout, missing binary, non-version stdout) returns null.
 * NEVER throws.
 */
export function detectFromWpCli(projectRoot: string): PluginDetection | null {
  try {
    if (!wpBinaryAvailable() || !looksLikeWordPress(projectRoot)) {
      return null;
    }

    const result = spawnSync(
      'wp',
      ['plugin', 'get', 'woocommerce', '--field=version', `--path=${projectRoot}`],
      { timeout: 5000, encoding: 'utf8' },
    );

    if (result.error || result.status !== 0) {
      return null;
    }

    const version = result.stdout.trim();
    // Accept only version-looking strings: digits and dots
    if (!/^\d+\.\d+/.test(version)) {
      return null;
    }

    return {
      slug: 'woocommerce',
      version,
      source: 'wp-cli',
    };
  } catch {
    return null;
  }
}
