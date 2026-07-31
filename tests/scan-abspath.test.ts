/**
 * P5: the ABSPATH rule on its honest surface. In the blob catch it fired on
 * 16 of 42 documented correct examples (a snippet is never a whole file); the
 * scan judges only NEW files, where the diff IS the whole file, and stays
 * silent everywhere it cannot see the file's opening.
 */

import { describe, it, expect } from 'vitest';
import { abspathFindings, newPhpFilesFromDiff } from '../src/scan/abspath.js';
import { loadSnapshot } from '../src/lib/snapshot.js';

const snap = loadSnapshot();

function newFileDiff(filename: string, lines: string[]): string {
  return [
    `diff --git a/${filename} b/${filename}`,
    'new file mode 100644',
    '--- /dev/null',
    `+++ b/${filename}`,
    `@@ -0,0 +1,${lines.length} @@`,
    ...lines.map((l) => `+${l}`),
  ].join('\n');
}

function editDiff(filename: string, lines: string[]): string {
  return [
    `diff --git a/${filename} b/${filename}`,
    `--- a/${filename}`,
    `+++ b/${filename}`,
    '@@ -10,2 +10,3 @@',
    ...lines.map((l) => `+${l}`),
  ].join('\n');
}

describe('abspath on the scan surface', () => {
  it('BELL: a new procedural plugin file without the guard draws the advisory', () => {
    const diff = newFileDiff('my-plugin/init.php', [
      '<?php',
      "add_action( 'init', 'my_plugin_boot' );",
      'function my_plugin_boot() {}',
    ]);
    const r = abspathFindings(diff, snap);
    expect(r).toHaveLength(1);
    expect(r[0]!.tier).toBe('SOFT');
    expect(r[0]!.condition).toContain('my-plugin/init.php');
  });

  it('SILENCE: the guard is present', () => {
    const diff = newFileDiff('my-plugin/init.php', [
      '<?php',
      "if ( ! defined( 'ABSPATH' ) ) { exit; }",
      "add_action( 'init', 'my_plugin_boot' );",
    ]);
    expect(abspathFindings(diff, snap)).toEqual([]);
  });

  it('SILENCE: a class-only file is autoloaded, no guard expected', () => {
    const diff = newFileDiff('my-plugin/src/Service.php', [
      '<?php',
      'declare(strict_types=1);',
      'namespace MyPlugin;',
      'use MyPlugin\\Deps\\Thing;',
      'final class Service {',
      '  public function run(): void {}',
      '}',
    ]);
    expect(abspathFindings(diff, snap)).toEqual([]);
  });

  it('SILENCE: an edit hunk cannot show the file opening, no judgement', () => {
    const diff = editDiff('my-plugin/init.php', ["add_action( 'wp_footer', 'my_thing' );"]);
    expect(abspathFindings(diff, snap)).toEqual([]);
  });

  it('SILENCE: a new non-PHP file is not in scope', () => {
    const diff = newFileDiff('assets/app.js', ['console.log(1);']);
    expect(newPhpFilesFromDiff(diff)).toEqual([]);
  });
});

describe('prologue prose must not eat the judgement window (Gemini A+B)', () => {
  const longDocblock = ['/**', ...Array.from({ length: 20 }, (_, i) => ` * licence line ${i} padding padding padding`), ' */'];

  it('SILENCE: a long licence docblock before the guard is fine', () => {
    const diff = newFileDiff('my-plugin/init.php', [
      '<?php',
      ...longDocblock,
      "if ( ! defined( 'ABSPATH' ) ) { exit; }",
      "add_action( 'init', 'x' );",
    ]);
    expect(abspathFindings(diff, snap)).toEqual([]);
  });

  it('BELL: a long docblock must not hide a missing guard', () => {
    const diff = newFileDiff('my-plugin/init.php', [
      '<?php',
      ...longDocblock,
      "add_action( 'init', 'x' );",
    ]);
    expect(abspathFindings(diff, snap)).toHaveLength(1);
  });

  it('SILENCE: docblock before a class declaration stays a class file', () => {
    const diff = newFileDiff('my-plugin/src/S.php', [
      '<?php',
      ...longDocblock,
      'namespace MyPlugin;',
      'class S {}',
    ]);
    expect(abspathFindings(diff, snap)).toEqual([]);
  });
});
