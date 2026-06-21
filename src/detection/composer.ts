import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PATTERNS } from './registry.js';
import type { PluginDetection } from './types.js';

/**
 * Extract a base version from a composer version constraint.
 * Strips leading operators and whitespace, returns the first x.y[.z] match.
 * Returns null when the constraint is a wildcard, alias, or unparseable.
 */
function parseConstraintVersion(constraint: string): string | null {
  // Remove leading operators: ^, ~, >=, <=, >, <, =, and whitespace
  const stripped = constraint.replace(/^[\^~><=\s]+/, '').trim();
  const match = /^(\d+\.\d+(?:\.\d+)?)/.exec(stripped);
  return match?.[1] ?? null;
}

/**
 * Detect a registered pattern from composer.json in the given project root.
 * Checks both `require` and `require-dev` for each pattern's composer keys.
 * Returns null when the file is absent, malformed, or no pattern is listed.
 * NEVER throws.
 */
export function detectFromComposer(projectRoot: string): PluginDetection | null {
  try {
    const composerPath = join(projectRoot, 'composer.json');
    const raw = JSON.parse(readFileSync(composerPath, 'utf8')) as unknown;

    if (typeof raw !== 'object' || raw === null) {
      return null;
    }

    const obj = raw as Record<string, unknown>;
    const require = typeof obj['require'] === 'object' && obj['require'] !== null
      ? obj['require'] as Record<string, unknown>
      : {};
    const requireDev = typeof obj['require-dev'] === 'object' && obj['require-dev'] !== null
      ? obj['require-dev'] as Record<string, unknown>
      : {};

    for (const def of PATTERNS) {
      for (const key of def.composerKeys) {
        const constraint = require[key] ?? requireDev[key];
        if (typeof constraint === 'string') {
          return {
            pattern: def.pattern,
            version: parseConstraintVersion(constraint),
            source: 'composer',
          };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
