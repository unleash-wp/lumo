/**
 * The built entry points must actually start.
 *
 * `lumo action` died with 'Dynamic require of "net" is not supported' — the
 * ESM bundle stubs require(), and @actions/github reaches for node built-ins
 * through it. Nothing caught that: the unit tests import TypeScript sources,
 * where the problem does not exist. It would have shipped, and every customer
 * running the Action would have hit it on the first line.
 *
 * These tests run the real artifacts, so a bundling regression fails the build
 * instead of the customer's pipeline.
 */

import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const built = existsSync(join(distDir, 'lumo.mjs'));

describe.skipIf(!built)('built entry points start', () => {
  it('lumo action runs and reports the licensed gate instead of crashing', async () => {
    const { stdout } = await run('node', [join(distDir, 'lumo.mjs'), 'action'], {
      env: { ...process.env, INPUT_LUMO_LICENSE_KEY: '' },
    });
    expect(stdout).toContain('DID NOT RUN');
    expect(stdout).not.toContain('Dynamic require');
  });

  it('lumo-scan answers --help from the built bundle', async () => {
    const { stdout } = await run('node', [join(distDir, 'scan.mjs'), '--help']);
    expect(stdout).toContain('lumo-scan');
  });
});
