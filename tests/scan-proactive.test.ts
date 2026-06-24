/**
 * Tests for the proactive scan pipeline — the logic surface used by lumo-scan.
 *
 * The scan CLI entry point (src/scan/main.ts) is thin process glue: it runs
 * `git diff HEAD`, feeds the output through runCatch(), and prints a result.
 * We test the pipeline behaviour directly rather than spawning a child process:
 *
 *   1. A diff with a LOUD pattern surfaces a LOUD finding.
 *   2. A clean diff prints the dated-clean message (knowledge date from snapshot).
 *   3. No-diff / empty-diff → clean exit (fail-open path).
 *   4. parseDiff returns the correct file count for the clean-N-files message.
 *
 * These cover the three output paths described in the task brief.
 */

import { describe, it, expect } from 'vitest';
import { runCatch } from '../src/action/catch-runner.js';
import { parseDiff } from '../src/action/diff-parser.js';
import { loadSnapshot } from '../src/lib/snapshot.js';

// ---------------------------------------------------------------------------
// Diff fixtures — same HPOS patterns used in action-catch-runner tests.
// ---------------------------------------------------------------------------

/** Adds `'post_type' => 'shop_order'` — CERTAIN signal, fires LOUD. */
const loudDiff = `diff --git a/includes/order-handler.php b/includes/order-handler.php
index abc1234..def5678 100644
--- a/includes/order-handler.php
+++ b/includes/order-handler.php
@@ -10,3 +10,7 @@
 function get_legacy_orders() {
+    $orders = get_posts( array(
+        'post_type'   => 'shop_order',
+        'post_status' => 'wc-processing',
+    ) );
     return $orders;
 }
`;

/** Adds only safe wc_get_order() code — no catch expected. */
const cleanDiff = `diff --git a/includes/safe-handler.php b/includes/safe-handler.php
index aaa..bbb 100644
--- a/includes/safe-handler.php
+++ b/includes/safe-handler.php
@@ -1,3 +1,4 @@
 <?php
+$order = wc_get_order( $order_id );
+$total = $order->get_total();
`;

// ---------------------------------------------------------------------------
// Suite 1 — LOUD pattern in diff surfaces a LOUD finding
// ---------------------------------------------------------------------------

describe('proactive scan: LOUD pattern', () => {
  it('surfaces a LOUD finding when diff contains shop_order post_type', async () => {
    const result = await runCatch({ diff: loudDiff });

    expect(result.loudCount).toBeGreaterThan(0);
    expect(result.findings.length).toBeGreaterThan(0);

    const loud = result.findings.find((f) => f.tier === 'LOUD');
    expect(loud).toBeDefined();

    // LOUD lead must contain the ⚠️ alarm — verifies formatCatch path is used.
    expect(loud?.body).toContain('⚠️');
    // Must reference WooCommerce or WordPress in the output.
    expect(loud?.body).toMatch(/WooCommerce|WordPress/);
  });

  it('LOUD findings come first in the findings array (runCatch ordering)', async () => {
    const result = await runCatch({ diff: loudDiff });
    if (result.findings.length > 1) {
      expect(result.findings[0]!.tier).toBe('LOUD');
    }
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — Clean diff produces the dated-clean output
// ---------------------------------------------------------------------------

describe('proactive scan: clean diff', () => {
  it('returns zero findings for a diff containing only safe code', async () => {
    const result = await runCatch({ diff: cleanDiff });
    expect(result.findings).toHaveLength(0);
    expect(result.loudCount).toBe(0);
    expect(result.softCount).toBe(0);
  });

  it('knowledge date is available from the snapshot (used in the clean message)', () => {
    // The scan CLI prints "clean as of {date}" using snapshot.generatedAt.
    // Verify loadSnapshot() returns a parseable generatedAt for that message.
    const snap = loadSnapshot();
    expect(snap.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);

    const dateSlice = snap.generatedAt.slice(0, 10);
    expect(dateSlice).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('parseDiff returns the correct file count for the clean-N-files message', () => {
    const files = parseDiff(cleanDiff);
    // cleanDiff touches one PHP file with added lines.
    expect(files).toHaveLength(1);
    expect(files[0]!.filename).toBe('includes/safe-handler.php');
    expect(files[0]!.language).toBe('php');
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — Fail-open: no diff / empty diff exits gracefully
// ---------------------------------------------------------------------------

describe('proactive scan: fail-open paths', () => {
  it('runCatch with empty string returns zero findings (empty diff → clean)', async () => {
    const result = await runCatch({ diff: '' });
    expect(result.findings).toHaveLength(0);
    expect(result.loudCount).toBe(0);
  });

  it('runCatch with whitespace-only diff returns zero findings', async () => {
    const result = await runCatch({ diff: '   \n   ' });
    expect(result.findings).toHaveLength(0);
  });

  it('parseDiff on empty string returns empty array', () => {
    const files = parseDiff('');
    expect(files).toHaveLength(0);
  });

  it('parseDiff on non-code diff (YAML only) returns empty array', () => {
    const yamlDiff = `diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
index ccc..ddd 100644
--- a/.github/workflows/ci.yml
+++ b/.github/workflows/ci.yml
@@ -1,2 +1,3 @@
 name: CI
+  run: echo hello
`;
    const files = parseDiff(yamlDiff);
    expect(files).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — loudCount + softCount accounting
// ---------------------------------------------------------------------------

describe('proactive scan: finding counts', () => {
  it('loudCount + softCount equals total findings length', async () => {
    const result = await runCatch({ diff: loudDiff });
    expect(result.loudCount + result.softCount).toBe(result.findings.length);
  });

  it('every finding body is non-empty rendered Markdown', async () => {
    const result = await runCatch({ diff: loudDiff });
    for (const f of result.findings) {
      expect(f.body.trim().length).toBeGreaterThan(0);
      // formatCatch always produces at least one Markdown heading.
      expect(f.body).toMatch(/^#{1,3} /m);
    }
  });
});
