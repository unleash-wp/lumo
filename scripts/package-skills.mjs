#!/usr/bin/env node
/**
 * Packages each skill under skills/ as dist-skills/<name>.zip for upload to
 * Claude on web and desktop (claude.ai: Settings > Capabilities > Skills).
 * claude.ai expects the skill folder itself at the zip root (wp-pro/SKILL.md),
 * so zip runs from inside skills/ instead of archiving flat file lists.
 */

import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = join(repoRoot, 'skills');
const outDir = join(repoRoot, 'dist-skills');

const probe = spawnSync('zip', ['-v'], { stdio: 'ignore' });
if (probe.status !== 0) {
  console.error(
    'The zip binary is not available on PATH. Install it first ' +
      '(macOS ships it; Debian/Ubuntu: apt-get install zip), then re-run.',
  );
  process.exit(1);
}

const skillNames = readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (skillNames.length === 0) {
  console.error(`No skill directories found under ${skillsDir}.`);
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const name of skillNames) {
  const zipPath = join(outDir, `${name}.zip`);
  // cwd skills/ makes the folder the zip's root entry; Finder's .DS_Store
  // droppings must not ship in a user-facing upload.
  const result = spawnSync('zip', ['-r', zipPath, name, '-x', '*.DS_Store'], {
    cwd: skillsDir,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  if (result.status !== 0) {
    console.error(`zip failed for ${name} (exit ${result.status ?? 'signal'}).`);
    process.exit(1);
  }
  console.log(`${zipPath} (${statSync(zipPath).size} bytes)`);
}
