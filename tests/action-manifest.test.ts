/**
 * action.yml is loaded and template-validated by GitHub before a single step
 * runs, and the `secrets` context does not exist at that point — not even
 * inside an input description. A `${{ secrets.* }}` anywhere in this file
 * makes the action fail to load with "Unrecognized named-value: 'secrets'",
 * for us and for every repository that uses it.
 *
 * That is exactly what happened: the license input documented itself with a
 * live expression, so the action could not be loaded at all. Nothing caught it
 * until the workflow pointed at the local action and the failure became ours.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const manifest = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'action.yml'),
  'utf8',
);

describe('action.yml stays loadable', () => {
  it('references no secrets context — that context does not exist here', () => {
    expect(manifest).not.toMatch(/\$\{\{\s*secrets\./);
  });

  it('still documents where the licence key comes from, without an expression', () => {
    expect(manifest).toContain('LUMO_LICENSE_KEY');
  });

  it('keeps the expressions it legitimately needs (inputs in the run step)', () => {
    expect(manifest).toMatch(/\$\{\{\s*inputs\.version\s*\}\}/);
    expect(manifest).toMatch(/\$\{\{\s*inputs\.fail_on_loud\s*\}\}/);
  });
});
