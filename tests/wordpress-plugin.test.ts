/**
 * The WordPress plugin ships a copy of the free snapshot so it can answer
 * offline with no account. A copy is a staleness risk, and a knowledge product
 * serving last month's knowledge from a plugin would be exactly the failure it
 * sells against — so the copy is checked here, not trusted.
 *
 * The rest pins the honesty contract in the PHP: an unlicensed check must
 * report that it did not run, a lookup miss must not read as approval, and the
 * plugin must not quietly grow a second detection engine (which would drift
 * from the TypeScript one precisely in the loud-versus-quiet rules).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pluginDir = join(root, 'wordpress-plugin');
const read = (...parts: string[]) => readFileSync(join(pluginDir, ...parts), 'utf8');

describe('the bundled snapshot stays the shipped snapshot', () => {
  it('is byte-identical to data/snapshot.json', () => {
    const source = readFileSync(join(root, 'data', 'snapshot.json'), 'utf8');
    expect(read('data', 'snapshot.json')).toBe(source);
  });

  it('carries the same entry count the rest of the product reports', () => {
    const bundled = JSON.parse(read('data', 'snapshot.json')) as { entries: unknown[] };
    expect(bundled.entries).toHaveLength(42);
  });
});

describe('the abilities keep their promises', () => {
  const abilities = read('includes', 'abilities.php');

  it('registers both abilities on the documented init hook', () => {
    expect(abilities).toContain("add_action(\n\t'wp_abilities_api_init'");
    expect(abilities).toContain("'lumo/verified-pattern'");
    expect(abilities).toContain("'lumo/check-code'");
  });

  it('every ability declares a permission callback — core throws without one', () => {
    const registrations = abilities.match(/wp_register_ability\(/g) ?? [];
    const permissions = abilities.match(/'permission_callback'\s*=>/g) ?? [];
    expect(registrations.length).toBeGreaterThan(0);
    expect(permissions).toHaveLength(registrations.length);
  });

  it('both are marked read-only and non-destructive — this plugin never writes', () => {
    const readonly = abilities.match(/'readonly'\s*=>\s*true/g) ?? [];
    expect(readonly).toHaveLength(2);
    expect(abilities).not.toMatch(/'destructive'\s*=>\s*true/);
  });

  it('BELL: an unlicensed check reports that it did not run, and never a pass', () => {
    expect(abilities).toContain("'checked'  => false");
    expect(abilities).toContain('was NOT checked');
    expect(abilities).toContain('This is not a pass');
  });

  it('every remote failure path says it did not check, not that it found nothing', () => {
    // Transport error, non-2xx, unparseable body — three ways to fail, one
    // thing they must all say.
    const notChecked = abilities.match(/This is not a pass/g) ?? [];
    expect(notChecked.length).toBeGreaterThanOrEqual(4);
  });

  it('SILENCE: a lookup miss states that nothing is claimed either way', () => {
    expect(abilities).toContain('do not treat silence as approval');
  });

  it('BELL: a hit carries its age and its limit, not just a miss', () => {
    // Product gate: the hit is where over-confidence starts. An agent that gets
    // an answer for its topic reads the topic as covered, and a file on disk
    // keeps saying "current" long after it is not.
    const knowledge = read('includes', 'knowledge.php');
    expect(knowledge).toContain('Verified as of %s and shipped with this plugin');
    expect(knowledge).toContain('changes only when the plugin updates');
    expect(knowledge).toContain('says nothing about the rest of your code');
  });
});

describe('the plugin does not grow a second engine', () => {
  it('ships no detection patterns of its own', () => {
    // The TypeScript engine owns loud-versus-quiet. A regex table appearing in
    // PHP would be a second copy of that judgement, free to drift.
    const php = readdirSync(join(pluginDir, 'includes')).map((f) => read('includes', f));
    for (const file of php) {
      expect(file).not.toMatch(/preg_match\s*\(\s*['"]\/.*wpdb/i);
      expect(file).not.toContain('CONTEXT_DEPENDENT');
    }
  });

  it('the settings screen the copy points at actually exists', () => {
    expect(existsSync(join(pluginDir, 'includes', 'settings.php'))).toBe(true);
    expect(read('includes', 'settings.php')).toContain("add_options_page(");
  });

  it('register_setting carries a sanitize callback — the rule Lumo itself ships', () => {
    // The doc comment names register_setting() too; count calls, not prose.
    const settings = read('includes', 'settings.php').replace(/\/\*[\s\S]*?\*\//g, '');
    const registrations = settings.match(/register_setting\(/g) ?? [];
    const sanitizers = settings.match(/'sanitize_callback'\s*=>/g) ?? [];
    expect(registrations.length).toBe(2);
    expect(sanitizers).toHaveLength(registrations.length);
  });
});
