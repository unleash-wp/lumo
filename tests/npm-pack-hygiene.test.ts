/**
 * The npm tarball is what customers install. Dogfood and founder scratch docs
 * must never ride along, even if someone widens the "files" allowlist by mistake.
 */

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function packListing(): string[] {
  const out = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: root,
    encoding: 'utf8',
  });
  const parsed = JSON.parse(out) as Array<{ files: Array<{ path: string }> }>;
  return parsed[0]?.files.map((f) => f.path) ?? [];
}

const FORBIDDEN_IN_PACK = [
  /^docs\//,
  /dogfood/i,
  /founder-/i,
  /^plans\//,
  /^\.claude\//,
  /^\.tmp-/,
  /\.env$/,
];

describe('npm pack hygiene', () => {
  it('does not ship docs/, dogfood, founder scratch, or env files', () => {
    const paths = packListing();
    expect(paths.length).toBeGreaterThan(0);

    for (const rel of paths) {
      for (const rule of FORBIDDEN_IN_PACK) {
        expect(rel).not.toMatch(rule);
      }
    }
  });

  it('ships only the advertised runtime surfaces', () => {
    const paths = packListing();
    const allowedRoots = new Set([
      'dist/',
      'data/',
      'agents/',
      'commands/',
      'skills/',
      'server.json',
      '.cursor/',
      'package.json',
      'README.md',
      'LICENSE',
    ]);

    for (const rel of paths) {
      const rootPrefix = rel.includes('/') ? `${rel.split('/')[0]}/` : rel;
      expect([...allowedRoots].some((a) => rel === a || rel.startsWith(a))).toBe(true);
    }
  });
});
