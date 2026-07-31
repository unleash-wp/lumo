#!/usr/bin/env node
/**
 * Fails the build on any surviving use of the retired tool vocabulary.
 *
 * The `wp_*` to `lumo_*` rename touched four repositories, and a rename that is
 * only half done is worse than no rename: a tool allowlist that names a tool
 * which no longer exists does not warn, it simply leaves the agent without the
 * tool. The last leftovers found this way were in the paid agent toolkit, where
 * nothing would have failed until a customer ran it.
 *
 * History is exempt on purpose. `plans/` and `CHANGELOG.md` record what the
 * names used to be, and rewriting the record to satisfy a linter would destroy
 * the only place the old names still belong.
 */

import { execFileSync } from 'node:child_process';

const TOOL_SUFFIXES = [
  'core_update_briefing',
  'check_deprecation',
  'migration_pattern',
  'propose_config',
  'plugin_advice',
  'compat_check',
  'check_code',
  'lookup',
];

// Retired argument names from the same surface. These never warned either: the
// SDK rejects an unknown argument, and the caller reports a malformed answer.
const RETIRED_IDENTIFIERS = ['plugin_slug', 'WpLookupInput', 'WpPluginAdviceInput', 'forge_wp_'];

// No \b: git grep -E is POSIX ERE, which has no word-boundary escape. It does
// not error on one, it just never matches: the first version of this check was
// green on a tree with fifteen leftovers in it. The names are specific enough
// that a substring match is not a real risk.
const PATTERN = [`wp_(${TOOL_SUFFIXES.join('|')})`, ...RETIRED_IDENTIFIERS].join('|');

// The wildcard matters: a bare filename pathspec only matches at the repo root,
// so :(exclude)check-vocabulary.mjs would not exclude scripts/check-vocabulary.mjs.
const EXCLUDES = [':(exclude)plans', ':(exclude)CHANGELOG.md', ':(exclude)*check-vocabulary.mjs'];

let hits = '';
try {
  hits = execFileSync(
    'git',
    // --untracked: git grep defaults to tracked files only, so a brand new file
    // carrying the old names passed this check right up until it was committed.
    // .gitignore still applies, which keeps node_modules and dist out.
    ['grep', '--untracked', '-nIE', PATTERN, '--', '.', ...EXCLUDES],
    { encoding: 'utf8' },
  ).trim();
} catch (err) {
  // git grep exits 1 with no output when nothing matched. Any other failure is
  // a broken check, and a broken check must not read as a pass.
  if (err.status === 1 && !err.stdout?.trim()) {
    console.log('[vocabulary] clean: no retired tool or argument names outside plans/ and CHANGELOG.md');
    process.exit(0);
  }
  console.error(`[vocabulary] check could not run: ${err.message}`);
  process.exit(2);
}

if (!hits) {
  console.log('[vocabulary] clean: no retired tool or argument names outside plans/ and CHANGELOG.md');
  process.exit(0);
}

const lines = hits.split('\n');
console.error(`[vocabulary] ${lines.length} retired name(s) still in the tree:\n`);
for (const line of lines) console.error(`  ${line}`);
console.error('\nRename to the lumo_* form, or move the reference into plans/ if it is a historical record.');
process.exit(1);
