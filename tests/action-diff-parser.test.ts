import { describe, it, expect } from 'vitest';
import { parseDiff } from '../src/action/diff-parser.js';

// ---------------------------------------------------------------------------
// Fixtures, minimal unified diffs
// ---------------------------------------------------------------------------

const phpHposDiff = `diff --git a/includes/class-order.php b/includes/class-order.php
index abc1234..def5678 100644
--- a/includes/class-order.php
+++ b/includes/class-order.php
@@ -10,6 +10,8 @@
 function get_order_data( $order_id ) {
-    $meta = get_post_meta( $order_id, '_order_total', true );
+    $order = wc_get_order( $order_id );
+    $meta  = get_post_meta( $order_id, '_order_total', true );
     return $meta;
 }
`;

const jsBlockDiff = `diff --git a/src/block.js b/src/block.js
index aaa1111..bbb2222 100644
--- a/src/block.js
+++ b/src/block.js
@@ -1,3 +1,4 @@
 import { registerBlockType } from '@wordpress/blocks';
+const block = wp.blocks.registerBlockType('my/block', {});
 export default block;
`;

const cssOnlyDiff = `diff --git a/style.css b/style.css
index 111aaaa..222bbbb 100644
--- a/style.css
+++ b/style.css
@@ -1,2 +1,3 @@
 body { margin: 0; }
+.header { color: red; }
`;

const removedLinesDiff = `diff --git a/functions.php b/functions.php
index abc..def 100644
--- a/functions.php
+++ b/functions.php
@@ -5,4 +5,3 @@
-$meta = get_post_meta( $order_id, '_billing_first_name', true );
 function safe_code() {
     return wc_get_order( $order_id );
 }
`;

const multiFileDiff = `diff --git a/plugin.php b/plugin.php
index 111..222 100644
--- a/plugin.php
+++ b/plugin.php
@@ -1,2 +1,3 @@
 <?php
+$order = get_post_meta( $order_id, '_order_key', true );
diff --git a/README.md b/README.md
index 333..444 100644
--- a/README.md
+++ b/README.md
@@ -1,2 +1,3 @@
 # Plugin
+Updated docs
`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseDiff', () => {
  it('extracts PHP added lines and strips the leading +', () => {
    const files = parseDiff(phpHposDiff);
    expect(files).toHaveLength(1);
    expect(files[0]?.filename).toBe('includes/class-order.php');
    expect(files[0]?.language).toBe('php');
    // The added line with wc_get_order should be present
    expect(files[0]?.blob).toContain('wc_get_order');
    // The removed line (get_post_meta) should NOT appear as added
    expect(files[0]?.blob).not.toMatch(/^\-/m);
  });

  it('extracts JS added lines', () => {
    const files = parseDiff(jsBlockDiff);
    expect(files).toHaveLength(1);
    expect(files[0]?.filename).toBe('src/block.js');
    expect(files[0]?.language).toBe('js');
    expect(files[0]?.blob).toContain('wp.blocks.registerBlockType');
  });

  it('skips non-PHP/JS files (CSS)', () => {
    const files = parseDiff(cssOnlyDiff);
    expect(files).toHaveLength(0);
  });

  it('skips non-PHP/JS files (Markdown) in a multi-file diff', () => {
    const files = parseDiff(multiFileDiff);
    // Only plugin.php should be included; README.md must be skipped
    expect(files).toHaveLength(1);
    expect(files[0]?.filename).toBe('plugin.php');
  });

  it('does not include removed lines (-) in the blob', () => {
    const files = parseDiff(removedLinesDiff);
    // The removed get_post_meta line must never appear in the blob
    expect(files[0]?.blob ?? '').not.toContain('get_post_meta');
  });

  it('returns empty array for an empty diff', () => {
    expect(parseDiff('')).toHaveLength(0);
  });

  it('returns empty array when no added lines exist in a PHP file', () => {
    const deleteOnlyDiff = `diff --git a/foo.php b/foo.php
index aaa..bbb 100644
--- a/foo.php
+++ b/foo.php
@@ -1,2 +1,1 @@
 <?php
-$old = get_post_meta( $id, '_key', true );
`;
    const files = parseDiff(deleteOnlyDiff);
    expect(files).toHaveLength(0);
  });
});
