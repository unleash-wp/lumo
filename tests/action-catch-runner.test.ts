import { describe, it, expect } from 'vitest';
import { runCatch } from '../src/action/catch-runner.js';

// ---------------------------------------------------------------------------
// Unified diff fixtures — real patterns that fire on the live catch engine.
//
// runCatch always reads the shipped Free snapshot (no injection seam), so the
// fixtures use Free-tier signals: WooCommerce knowledge is Pro-only and no
// longer produces findings for a free user.
//
// Precision model (from src/detection/registry.ts):
//   CERTAIN  → isValidBlockContent( (self-evident, LOUD when breaking_change=true)
//   CONTEXT_DEPENDENT → wp_register_ability( without the mcp.public flag (→ SOFT)
// ---------------------------------------------------------------------------

/**
 * A diff that adds an isValidBlockContent() call — a CERTAIN core signal on an
 * API removed in WP 5.9. classify() checks CERTAIN + version stamp +
 * breaking_change=true → LOUD.
 *
 * It used to be wp_img_tag_add_decoding_attr(), which is deprecated rather than
 * removed and only reached LOUD through a wrong stamp on its entry.
 */
const coreLoudDiff = `diff --git a/src/blocks/validate.js b/src/blocks/validate.js
index abc1234..def5678 100644
--- a/src/blocks/validate.js
+++ b/src/blocks/validate.js
@@ -10,3 +10,7 @@
 function check( blockType, attrs, inner, html ) {
+    const ok = isValidBlockContent( blockType, attrs, inner, html );
     return ok;
 }
`;

/**
 * A diff registering an ability without the mcp.public flag — CONTEXT_DEPENDENT,
 * always SOFT. Used to verify the advisory (non-blocking) path.
 */
const abilitySoftDiff = `diff --git a/includes/class-ability-registrar.php b/includes/class-ability-registrar.php
index abc1234..def5678 100644
--- a/includes/class-ability-registrar.php
+++ b/includes/class-ability-registrar.php
@@ -10,3 +10,4 @@
 function register_my_ability() {
+    wp_register_ability( 'my-plugin/get-data', [ 'meta' => [ 'show_in_rest' => true ] ] );
 }
`;

/** A diff where all changes are deletions — nothing added, catch must stay silent. */
const deleteOnlyDiff = `diff --git a/functions.php b/functions.php
index 111..222 100644
--- a/functions.php
+++ b/functions.php
@@ -5,3 +5,2 @@
 function setup() {
-    wp_img_tag_add_decoding_attr( $img, 'the_content' );
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
  it('returns LOUD finding for isValidBlockContent — CERTAIN signal', async () => {
    const result = await runCatch({ diff: coreLoudDiff });

    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.loudCount).toBeGreaterThan(0);

    const loudFinding = result.findings.find((f) => f.tier === 'LOUD');
    expect(loudFinding).toBeDefined();
    expect(loudFinding?.filename).toBe('src/blocks/validate.js');

    // LOUD lead must include the BREAKING: alarm and a WordPress version reference.
    expect(loudFinding?.body).toContain('BREAKING:');
    expect(loudFinding?.body).toMatch(/WooCommerce|WordPress/);
    // Rendered body includes the correct pattern from the snapshot entry.
    expect(loudFinding?.body).toMatch(/wp_img_tag_add_loading_optimization_attrs|deprecated/i);
  });

  it('returns SOFT finding for wp_register_ability() — CONTEXT_DEPENDENT signal', async () => {
    const result = await runCatch({ diff: abilitySoftDiff });

    expect(result.findings.length).toBeGreaterThan(0);
    // CONTEXT_DEPENDENT → always SOFT, never LOUD
    expect(result.loudCount).toBe(0);
    expect(result.softCount).toBeGreaterThan(0);

    const softFinding = result.findings.find((f) => f.tier === 'SOFT');
    expect(softFinding).toBeDefined();
    // SOFT lead uses ADVISORY: advisory prefix.
    expect(softFinding?.body).toContain('ADVISORY:');
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
    const result = await runCatch({ diff: coreLoudDiff });
    expect(result.loudCount + result.softCount).toBe(result.findings.length);
  });

  it('every finding body is non-empty rendered Markdown with a heading', async () => {
    const result = await runCatch({ diff: coreLoudDiff });
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
      diff: coreLoudDiff,
      proUrl: 'http://127.0.0.1:1',
      licenseKey: 'test-key',
    });

    // Free catch fires the wp_img_tag LOUD signal — fallback must not swallow it.
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.loudCount).toBeGreaterThan(0);
  });
});
