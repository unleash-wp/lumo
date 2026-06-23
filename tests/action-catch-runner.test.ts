import { describe, it, expect } from 'vitest';
import { runCatch } from '../src/action/catch-runner.js';

// ---------------------------------------------------------------------------
// Unified diff fixtures — real patterns that fire on the live catch engine.
//
// Precision model (from src/detection/registry.ts):
//   CERTAIN  → 'post_type' => 'shop_order'  (self-evident, LOUD when breaking_change=true)
//   CONTEXT_DEPENDENT → get_post_meta($order_id, ...) (variable could be any post, → SOFT)
// ---------------------------------------------------------------------------

/**
 * A diff that adds 'post_type' => 'shop_order' — a CERTAIN HPOS signal.
 * classify() checks CERTAIN + version stamp + breaking_change=true → LOUD.
 */
const hposLoudDiff = `diff --git a/includes/class-order-handler.php b/includes/class-order-handler.php
index abc1234..def5678 100644
--- a/includes/class-order-handler.php
+++ b/includes/class-order-handler.php
@@ -10,3 +10,7 @@
 function get_legacy_orders() {
+    $orders = get_posts( array(
+        'post_type'   => 'shop_order',
+        'post_status' => 'wc-processing',
+        'numberposts' => 10,
+    ) );
     return $orders;
 }
`;

/**
 * A diff with get_post_meta($order_id) — CONTEXT_DEPENDENT, always SOFT.
 * Used to verify the advisory (non-blocking) path.
 */
const hposSoftDiff = `diff --git a/includes/class-order-handler.php b/includes/class-order-handler.php
index abc1234..def5678 100644
--- a/includes/class-order-handler.php
+++ b/includes/class-order-handler.php
@@ -10,3 +10,4 @@
 function get_my_order_total( $order_id ) {
+    $total = get_post_meta( $order_id, '_order_total', true );
     return $total;
 }
`;

/** A diff where all changes are deletions — nothing added, catch must stay silent. */
const deleteOnlyDiff = `diff --git a/functions.php b/functions.php
index 111..222 100644
--- a/functions.php
+++ b/functions.php
@@ -5,3 +5,2 @@
 function setup() {
-    get_post_meta( $order_id, '_order_total', true );
 }
`;

/** A diff with only safe code (wc_get_order) — no catch expected. */
const safePhpDiff = `diff --git a/includes/safe-handler.php b/includes/safe-handler.php
index aaa..bbb 100644
--- a/includes/safe-handler.php
+++ b/includes/safe-handler.php
@@ -1,3 +1,4 @@
 <?php
+$order = wc_get_order( $order_id );
+$total = $order->get_total();
`;

/** A diff with only non-PHP/non-JS files (YAML, CSS) — catch must return nothing. */
const nonCodeDiff = `diff --git a/.github/workflows/deploy.yml b/.github/workflows/deploy.yml
index ccc..ddd 100644
--- a/.github/workflows/deploy.yml
+++ b/.github/workflows/deploy.yml
@@ -1,2 +1,3 @@
 name: Deploy
+  run: echo hello
`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runCatch', () => {
  it('returns LOUD finding for shop_order post_type — CERTAIN signal', async () => {
    const result = await runCatch({ diff: hposLoudDiff });

    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.loudCount).toBeGreaterThan(0);

    const loudFinding = result.findings.find((f) => f.tier === 'LOUD');
    expect(loudFinding).toBeDefined();
    expect(loudFinding?.filename).toBe('includes/class-order-handler.php');

    // LOUD lead must include the ⚠️ alarm and a WooCommerce version reference.
    expect(loudFinding?.body).toContain('⚠️');
    expect(loudFinding?.body).toMatch(/WooCommerce|WordPress/);
    // Rendered body includes the correct pattern from the snapshot entry.
    expect(loudFinding?.body).toMatch(/wc_get_order|HPOS/i);
  });

  it('returns SOFT finding for get_post_meta($order_id) — CONTEXT_DEPENDENT signal', async () => {
    const result = await runCatch({ diff: hposSoftDiff });

    expect(result.findings.length).toBeGreaterThan(0);
    // CONTEXT_DEPENDENT → always SOFT, never LOUD
    expect(result.loudCount).toBe(0);
    expect(result.softCount).toBeGreaterThan(0);

    const softFinding = result.findings.find((f) => f.tier === 'SOFT');
    expect(softFinding).toBeDefined();
    // SOFT lead uses 🔍 advisory prefix.
    expect(softFinding?.body).toContain('🔍');
  });

  it('returns zero findings for delete-only diff (removed lines must not fire)', async () => {
    const result = await runCatch({ diff: deleteOnlyDiff });
    expect(result.findings).toHaveLength(0);
    expect(result.loudCount).toBe(0);
    expect(result.softCount).toBe(0);
  });

  it('returns zero findings for safe wc_get_order code', async () => {
    const result = await runCatch({ diff: safePhpDiff });
    expect(result.findings).toHaveLength(0);
  });

  it('returns zero findings for non-PHP/JS diffs', async () => {
    const result = await runCatch({ diff: nonCodeDiff });
    expect(result.findings).toHaveLength(0);
  });

  it('loudCount + softCount equals total findings length', async () => {
    const result = await runCatch({ diff: hposLoudDiff });
    expect(result.loudCount + result.softCount).toBe(result.findings.length);
  });

  it('every finding body is non-empty rendered Markdown with a heading', async () => {
    const result = await runCatch({ diff: hposLoudDiff });
    for (const f of result.findings) {
      expect(f.body.trim().length).toBeGreaterThan(0);
      expect(f.body).toMatch(/^#{1,3} /m);
    }
  });
});

describe('runCatch — Pro fallback on unreachable server', () => {
  it('falls back to free catch when Pro URL is set but server is unreachable', async () => {
    // Port 1 refuses connections immediately.
    const result = await runCatch({
      diff: hposLoudDiff,
      proUrl: 'http://127.0.0.1:1',
      licenseKey: 'test-key',
    });

    // Free catch fires the shop_order LOUD signal — fallback must not swallow it.
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.loudCount).toBeGreaterThan(0);
  });
});
