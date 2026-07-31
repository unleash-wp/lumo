import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PATTERNS } from './registry.js';
import type { PluginDetection } from './types.js';

/**
 * Parse the WordPress plugin header `Version:` line from the plugin file content.
 * Returns null when the header is absent or unparseable (e.g. a plain .env file).
 */
function parseVersionHeader(content: string): string | null {
  // WordPress plugin headers appear inside a `/** ... */` docblock where each
  // line starts with optional whitespace + `*` + whitespace, e.g. ` * Version: 8.6.1`
  const match = /^[ \t*]*Version:[ \t]*(.+)$/m.exec(content);
  const raw = match?.[1]?.trim();
  return raw ?? null;
}

/**
 * Detect a registered pattern from the filesystem in the given project root.
 * For each pattern, checks each directoryPath in order; first readable file wins.
 * Returns null when no pattern's paths exist.
 * NEVER throws.
 */
export function detectFromDirectory(projectRoot: string): PluginDetection | null {
  for (const def of PATTERNS) {
    for (const relPath of def.directoryPaths) {
      try {
        const fullPath = join(projectRoot, relPath);
        const content = readFileSync(fullPath, 'utf8');
        const version = parseVersionHeader(content);
        return {
          pattern: def.pattern,
          version,
          source: 'directory',
        };
      } catch {
        // File not found or unreadable, try next path
      }
    }
  }
  return null;
}
