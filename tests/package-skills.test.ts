import { describe, it, expect } from 'vitest';
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'dist-skills');

const hasBinary = (name: string): boolean =>
  spawnSync(name, ['-v'], { stdio: 'ignore' }).status === 0;

// The script shells out to zip, the assertions to unzip. Without either the
// test cannot run — skip visibly rather than fake a pass.
const toolingPresent = hasBinary('zip') && hasBinary('unzip');

describe('package-skills script', () => {
  it.skipIf(!toolingPresent)(
    'writes one non-empty zip per skill with the skill folder at the zip root',
    async () => {
      const { stdout } = await execFileAsync(
        'node',
        [join(repoRoot, 'scripts', 'package-skills.mjs')],
        { cwd: repoRoot },
      );

      for (const name of ['wp-binding', 'wp-knowledge', 'wp-pro']) {
        const zipPath = join(distDir, `${name}.zip`);
        expect(existsSync(zipPath), `${name}.zip missing`).toBe(true);
        expect(statSync(zipPath).size).toBeGreaterThan(0);
        expect(stdout).toContain(zipPath);
      }

      // claude.ai rejects zips whose root is loose files — the folder itself
      // must be the root entry.
      const listing = spawnSync('unzip', ['-l', join(distDir, 'wp-pro.zip')], {
        encoding: 'utf8',
      });
      expect(listing.status).toBe(0);
      expect(listing.stdout).toContain('wp-pro/SKILL.md');
    },
  );
});
