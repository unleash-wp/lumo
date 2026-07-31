/**
 * CI mode of the scan CLI (runScan): the gate surface behind the GitLab
 * template gitlab/lumo.gitlab-ci.yml.
 *
 * Contract under test, mirroring the GitHub Action:
 *   - LOUD is the only signal that may fail the job (exit 1), and only while
 *     LUMO_FAIL_ON_LOUD is not the literal string 'false'.
 *   - SOFT findings never move the exit code.
 *   - Base resolution: --base wins, else $CI_MERGE_REQUEST_DIFF_BASE_SHA,
 *     else the working tree with a printed note. Empty values count as unset
 *     (the template passes --base "$VAR" verbatim on every pipeline).
 *   - Every fail-open path says the scan DID NOT RUN and that this is not a
 *     clean result: a skipped scan must never read like a clean one.
 *   - Without --ci nothing blocks, ever.
 *
 * Diffs are injected through the getDiff seam; no test shells out to git.
 */

import { describe, it, expect, vi } from 'vitest';
import { runScan } from '../src/scan/run-scan.js';

// ---------------------------------------------------------------------------
// Diff fixtures. The LOUD example is the always-wrong route a free user can
// hit: an unprepared $wpdb call with direct interpolation (CERTAIN signal,
// slug wpdb-query-without-prepare-sql-injection, carried by a source).
// ---------------------------------------------------------------------------

const LOUD_DIFF = `diff --git a/includes/query.php b/includes/query.php
index abc1234..def5678 100644
--- a/includes/query.php
+++ b/includes/query.php
@@ -1,2 +1,4 @@
 <?php
+global $wpdb;
+$rows = $wpdb->get_results( "SELECT * FROM wp_things WHERE user_id = $id" );
`;

/** Adds only safe wc_get_order() code, no catch expected. */
const CLEAN_DIFF = `diff --git a/includes/safe-handler.php b/includes/safe-handler.php
index aaa..bbb 100644
--- a/includes/safe-handler.php
+++ b/includes/safe-handler.php
@@ -1,3 +1,4 @@
 <?php
+$order = wc_get_order( $order_id );
+$total = $order->get_total();
`;

/** Unsanitized superglobal read, CONTEXT_DEPENDENT signal, SOFT only. */
const SOFT_DIFF = `diff --git a/includes/form-handler.php b/includes/form-handler.php
index aaa..bbb 100644
--- a/includes/form-handler.php
+++ b/includes/form-handler.php
@@ -1,2 +1,3 @@
 <?php
+$user_id = $_GET['user_id'];
`;

const CI_ARGS = ['--ci', '--base', 'main'];

// ---------------------------------------------------------------------------
// Suite 1: the exit-code gate
// ---------------------------------------------------------------------------

describe('scan --ci: exit-code gate', () => {
  it('BELL: a diff adding an unprepared $wpdb interpolation exits 1', async () => {
    const r = await runScan({ argv: CI_ARGS, env: { LUMO_LICENSE_KEY: 'test-licence',}, getDiff: () => LOUD_DIFF });
    expect(r.exitCode).toBe(1);
    const joined = r.lines.join('\n');
    expect(joined).toContain('LOUD');
    expect(joined).toContain('BREAKING:');
  });

  it('SILENCE: a clean diff exits 0 and states scope, not a verdict', async () => {
    const r = await runScan({ argv: CI_ARGS, env: { LUMO_LICENSE_KEY: 'test-licence',}, getDiff: () => CLEAN_DIFF });
    expect(r.exitCode).toBe(0);
    expect(r.lines.join('\n')).toContain('not an all-clear');
  });

  it('SILENCE: a SOFT-only diff exits 0, advisory never blocks', async () => {
    const r = await runScan({ argv: CI_ARGS, env: { LUMO_LICENSE_KEY: 'test-licence',}, getDiff: () => SOFT_DIFF });
    expect(r.exitCode).toBe(0);
    expect(r.lines.join('\n')).toContain('advisory');
  });

  it('LUMO_FAIL_ON_LOUD=false keeps the job green but still prints the finding', async () => {
    const r = await runScan({
      argv: CI_ARGS,
      env: { LUMO_LICENSE_KEY: 'test-licence', LUMO_FAIL_ON_LOUD: 'false' },
      getDiff: () => LOUD_DIFF,
    });
    expect(r.exitCode).toBe(0);
    const joined = r.lines.join('\n');
    expect(joined).toContain('BREAKING:');
    expect(joined).toContain('LOUD');
  });

  it('an empty MR diff exits 0 without claiming uncommitted changes', async () => {
    const r = await runScan({ argv: CI_ARGS, env: { LUMO_LICENSE_KEY: 'test-licence',}, getDiff: () => '' });
    expect(r.exitCode).toBe(0);
    expect(r.lines.join('\n')).toContain('no changes to scan');
    expect(r.lines.join('\n')).not.toContain('uncommitted');
  });
});

// ---------------------------------------------------------------------------
// Suite 2, diff source resolution
// ---------------------------------------------------------------------------

describe('scan --ci: diff source', () => {
  it('--base reaches the diff provider and no working-tree note prints', async () => {
    const bases: Array<string | null> = [];
    const r = await runScan({
      argv: ['--ci', '--base', 'abc123'],
      env: { LUMO_LICENSE_KEY: 'test-licence', CI_MERGE_REQUEST_DIFF_BASE_SHA: 'ignored-when-base-given' },
      getDiff: (_cwd, base) => {
        bases.push(base);
        return CLEAN_DIFF;
      },
    });
    expect(bases).toEqual(['abc123']);
    expect(r.lines.join('\n')).not.toContain('working tree');
  });

  it('falls back to CI_MERGE_REQUEST_DIFF_BASE_SHA when --base is absent', async () => {
    const bases: Array<string | null> = [];
    await runScan({
      argv: ['--ci'],
      env: { LUMO_LICENSE_KEY: 'test-licence', CI_MERGE_REQUEST_DIFF_BASE_SHA: 'deadbee' },
      getDiff: (_cwd, base) => {
        bases.push(base);
        return CLEAN_DIFF;
      },
    });
    expect(bases).toEqual(['deadbee']);
  });

  it('with no base at all, scans the working tree and says so first', async () => {
    const bases: Array<string | null> = [];
    const r = await runScan({
      argv: ['--ci'],
      env: { LUMO_LICENSE_KEY: 'test-licence',},
      getDiff: (_cwd, base) => {
        bases.push(base);
        return CLEAN_DIFF;
      },
    });
    expect(bases).toEqual([null]);
    expect(r.lines[0]).toContain('working tree');
    expect(r.lines[0]).toContain('no base ref given');
    expect(r.exitCode).toBe(0);
  });

  it('an empty --base value (variable unset in the template) counts as no base', async () => {
    const bases: Array<string | null> = [];
    const r = await runScan({
      argv: ['--ci', '--base', ''],
      env: { LUMO_LICENSE_KEY: 'test-licence',},
      getDiff: (_cwd, base) => {
        bases.push(base);
        return CLEAN_DIFF;
      },
    });
    expect(bases).toEqual([null]);
    expect(r.lines[0]).toContain('working tree');
  });
});

// ---------------------------------------------------------------------------
// Suite 3, fail-open honesty: DID NOT RUN, never a clean-looking skip
// ---------------------------------------------------------------------------

describe('scan --ci: fail-open honesty', () => {
  it('no diff obtainable: says DID NOT RUN and not clean, exits 0', async () => {
    const r = await runScan({ argv: ['--ci', '--base', 'deadbee'], env: { LUMO_LICENSE_KEY: 'test-licence',}, getDiff: () => null });
    expect(r.exitCode).toBe(0);
    const joined = r.lines.join('\n');
    expect(joined).toContain('DID NOT RUN');
    expect(joined).toContain('not a clean result');
    // The likely CI cause gets its remedy named.
    expect(joined).toContain('GIT_DEPTH');
  });

  it('a throwing diff provider tells the same honest story', async () => {
    const r = await runScan({
      argv: ['--ci'],
      env: { LUMO_LICENSE_KEY: 'test-licence',},
      getDiff: () => {
        throw new Error('git exploded');
      },
    });
    expect(r.exitCode).toBe(0);
    const joined = r.lines.join('\n');
    expect(joined).toContain('DID NOT RUN');
    expect(joined).toContain('not a clean result');
  });

  it('unloadable snapshot: DID NOT RUN instead of a no-match line', async () => {
    vi.resetModules();
    vi.doMock('../src/lib/snapshot.js', async (importOriginal) => ({
      ...(await importOriginal<typeof import('../src/lib/snapshot.js')>()),
      loadSnapshot: () => {
        throw new Error('snapshot unreadable');
      },
    }));
    try {
      const { runScan: mockedRunScan } = await import('../src/scan/run-scan.js');
      const r = await mockedRunScan({ argv: CI_ARGS, env: { LUMO_LICENSE_KEY: 'test-licence',}, getDiff: () => LOUD_DIFF });
      expect(r.exitCode).toBe(0);
      const joined = r.lines.join('\n');
      expect(joined).toContain('DID NOT RUN');
      expect(joined).toContain('not a clean result');
      expect(joined).not.toContain('no covered pattern matched');
    } finally {
      vi.doUnmock('../src/lib/snapshot.js');
      vi.resetModules();
    }
  });
});

// ---------------------------------------------------------------------------
// Suite 4, without --ci nothing blocks and nothing new appears
// ---------------------------------------------------------------------------

describe('scan without --ci stays advisory', () => {
  it('a LOUD diff still exits 0, findings inform, they do not block', async () => {
    const r = await runScan({ argv: [], env: { LUMO_LICENSE_KEY: 'test-licence',}, getDiff: () => LOUD_DIFF });
    expect(r.exitCode).toBe(0);
    expect(r.lines.join('\n')).toContain('BREAKING:');
  });

  it('LUMO_FAIL_ON_LOUD has no effect outside CI mode', async () => {
    const r = await runScan({
      argv: [],
      env: { LUMO_LICENSE_KEY: 'test-licence', LUMO_FAIL_ON_LOUD: 'true' },
      getDiff: () => LOUD_DIFF,
    });
    expect(r.exitCode).toBe(0);
  });

  it('non-CI output for a clean diff is the untouched scope line', async () => {
    const r = await runScan({ argv: [], env: { LUMO_LICENSE_KEY: 'test-licence',}, getDiff: () => CLEAN_DIFF });
    expect(r.exitCode).toBe(0);
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0]).toMatch(/^lumo scan: 1 changed file checked against Lumo Free/);
    expect(r.lines[0]).toContain('not an all-clear');
    expect(r.lines[0]).not.toContain('DID NOT RUN');
  });
});

/**
 * CI enforcement is a Lumo Pro feature (founder decision, 31.07.2026). The
 * gate must refuse to run without a licence, and refusing must never look
 * like a passed review, and never block someone's merge either.
 */
describe('scan --ci: the gate is licensed', () => {
  const LOUD_DIFF = [
    'diff --git a/inc/q.php b/inc/q.php',
    '--- a/inc/q.php',
    '+++ b/inc/q.php',
    '@@ -1,1 +1,2 @@',
    '+<?php',
    '+$r = $wpdb->get_results( "SELECT * FROM t WHERE id = $id" );',
  ].join('\n');

  it('SILENCE: without a licence key nothing is checked, and the job stays green', async () => {
    const r = await runScan({
      argv: ['--ci', '--base', 'abc123'],
      env: {},
      getDiff: () => LOUD_DIFF,
    });
    expect(r.exitCode).toBe(0);
    expect(r.lines.join('\n')).toContain('part of Lumo Pro');
    expect(r.lines.join('\n')).toContain('DID NOT RUN');
    expect(r.lines.join('\n')).toContain('not a clean result');
    // The LOUD finding must NOT appear: nothing ran, so nothing may be claimed.
    expect(r.lines.join('\n')).not.toContain('wpdb');
  });

  it('the refusal names what stays free, so it reads as a boundary, not a nag', async () => {
    const r = await runScan({ argv: ['--ci'], env: {}, getDiff: () => LOUD_DIFF });
    expect(r.lines.join('\n')).toContain('lumo scan');
    expect(r.lines.join('\n')).toContain('MCP server and skills stay free');
  });

  it('BELL: with a licence key the gate runs and LOUD still fails the job', async () => {
    const r = await runScan({
      argv: ['--ci', '--base', 'abc123'],
      env: { LUMO_LICENSE_KEY: 'test-licence' },
      getDiff: () => LOUD_DIFF,
    });
    expect(r.exitCode).toBe(1);
  });

  it('a licensed run without a server URL says it used free knowledge only', async () => {
    const r = await runScan({
      argv: ['--ci', '--base', 'abc123'],
      env: { LUMO_LICENSE_KEY: 'test-licence' },
      getDiff: () => LOUD_DIFF,
    });
    expect(r.lines.join('\n')).toContain('LUMO_PRO_URL is not set');
  });

  it('SILENCE: the local scan without --ci needs no licence at all', async () => {
    const r = await runScan({ argv: [], env: {}, getDiff: () => LOUD_DIFF });
    expect(r.exitCode).toBe(0);
    expect(r.lines.join('\n')).not.toContain('part of Lumo Pro');
    expect(r.lines.join('\n')).toContain('wpdb');
  });
});
