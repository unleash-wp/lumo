/**
 * File-level ABSPATH check — the rule the blob catch measurably cannot carry.
 *
 * The curated rule asks "does this PHP file open with an ABSPATH guard?".
 * Handed snippets, it fired on 16 of the 42 documented correct examples,
 * because a snippet is never a whole file — so it was excluded from the catch
 * and parked for a file-aware surface. lumo-scan is that surface, with one
 * honesty constraint: only for NEW files is the diff the whole file. For an
 * edit hunk the file's opening is invisible, and a rule that cannot see the
 * opening must not judge it.
 *
 * Exemption mirrors the curated condition: class-only files (whose first
 * construct after <?php / declare / namespace / use is a type declaration) are
 * loaded by autoloaders, not requested directly — no guard expected.
 */

import { findEntry } from '../lib/snapshot.js';
import type { Snapshot } from '../types.js';
import type { CatchResult } from '../detection/catch.js';

const ENTRY_SLUG = 'php-file-missing-abspath-guard';

interface NewPhpFile {
  filename: string;
  content: string;
}

/** Extract NEW .php files from a unified diff — the only file-complete case. */
export function newPhpFilesFromDiff(diff: string): NewPhpFile[] {
  const out: NewPhpFile[] = [];
  const sections = diff.split(/^diff --git /m).slice(1);
  for (const section of sections) {
    if (!/^new file mode /m.test(section)) continue;
    const nameMatch = section.match(/^\+\+\+ b\/(.+)$/m);
    const filename = nameMatch?.[1]?.trim();
    if (!filename || !filename.endsWith('.php')) continue;
    const content = section
      .split('\n')
      .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
      .map((l) => l.slice(1))
      .join('\n');
    out.push({ filename, content });
  }
  return out;
}

const GUARD = /defined\s*\(\s*['"]ABSPATH['"]/;
// First construct after the opening decides the file's nature. declare/
// namespace/use are prologue; a type keyword means autoloaded class file.
const CLASS_ONLY =
  /^<\?php\s*(?:declare\s*\([^)]*\)\s*;\s*)?(?:namespace\s+[^;]+;\s*)?(?:use\s+[^;]+;\s*)*(?:final\s+|abstract\s+)?(?:class|interface|trait|enum)\s/;

/**
 * The judgement window must not be eaten by prose. A licence docblock longer
 * than the window produced BOTH failure modes (review-measured): a guarded
 * file flagged (guard beyond the window) and an unguarded one that would pass
 * once the window is enlarged naively. So: strip BOM and shebang, then strip
 * leading comments after <?php, and judge the code that remains.
 */
export function normalizedOpening(raw: string): string | null {
  let c = raw.replace(/^﻿/, '').trimStart();
  if (c.startsWith('#!')) c = c.slice(c.indexOf('\n') + 1).trimStart();
  if (!c.startsWith('<?php')) return null;
  let rest = c.slice('<?php'.length);
  // Peel leading whitespace, docblocks/block comments and line comments.
  for (;;) {
    const before = rest;
    rest = rest.replace(/^\s+/, '');
    if (rest.startsWith('/*')) {
      const end = rest.indexOf('*/');
      if (end === -1) return '<?php ';
      rest = rest.slice(end + 2);
    } else if (rest.startsWith('//') || rest.startsWith('#')) {
      const nl = rest.indexOf('\n');
      if (nl === -1) return '<?php ';
      rest = rest.slice(nl + 1);
    }
    if (rest === before) break;
  }
  return `<?php ${rest}`;
}

/**
 * SOFT advisory per new PHP file that opens procedurally without the guard.
 * Never LOUD: whether the file is reachable by direct request depends on the
 * server layout, which a diff cannot prove.
 */
export function abspathFindings(diff: string, snap: Snapshot): CatchResult[] {
  const entry = findEntry(snap, ENTRY_SLUG);
  if (!entry) return [];

  const results: CatchResult[] = [];
  for (const file of newPhpFilesFromDiff(diff)) {
    const c = normalizedOpening(file.content);
    if (c === null) continue;
    if (GUARD.test(c.slice(0, 400))) continue;
    if (CLASS_ONLY.test(c)) continue;
    results.push({
      tier: 'SOFT',
      entry,
      signal: { match: 'abspath-file-check', class: 'CONTEXT_DEPENDENT', entrySlug: ENTRY_SLUG, language: 'php' },
      condition: `the new file ${file.filename} is reachable by direct request on your server layout`,
    });
  }
  return results;
}
