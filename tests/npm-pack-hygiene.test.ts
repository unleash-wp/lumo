/**
 * The npm tarball is what customers install. Dogfood and founder scratch docs
 * must never ride along, even if someone widens the "files" allowlist by mistake.
 */

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Windows needs both halves of this, and each one fails differently:
//   - npm is a .cmd shim and execFileSync does not apply PATHEXT, so a bare
//     'npm' is ENOENT
//   - since Node's CVE-2024-27980 mitigation, spawning a .cmd without a shell
//     is EINVAL
// Neither applies elsewhere. The arguments are fixed and contain no spaces or
// shell metacharacters, so enabling the shell here introduces nothing to quote.
const IS_WINDOWS = process.platform === 'win32';
const NPM = IS_WINDOWS ? 'npm.cmd' : 'npm';

function packListing(): string[] {
  const out = execFileSync(NPM, ['pack', '--dry-run', '--json'], {
    cwd: root,
    encoding: 'utf8',
    shell: IS_WINDOWS,
  });
  const parsed = JSON.parse(out) as Array<{ files: Array<{ path: string }> }>;
  // Every rule below is written against forward slashes. npm normalizes tarball
  // paths, but this file has never actually executed on Windows, so do not rely
  // on that for the one platform we cannot check locally.
  return parsed[0]?.files.map((f) => f.path.replaceAll('\\', '/')) ?? [];
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
