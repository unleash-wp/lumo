#!/usr/bin/env node
/**
 * Tests for wp-enforce.cjs — PreToolUse WordPress enforcement hook.
 *
 * Covers:
 *   - isWordPressFile(): path signals, content signals, extension gating
 *   - extractContent(): Write / Edit / MultiEdit content extraction
 *   - resolveMode(): env var, .lumo.json config, default
 *   - End-to-end hook invocation via spawnSync (block / warn / allow paths)
 *
 * Run: node --test .claude/hooks/__tests__/wp-enforce.test.cjs
 */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// ---------------------------------------------------------------------------
// Import unit-testable exports (requires the hook to export them)
// ---------------------------------------------------------------------------

const hook = require('../wp-enforce.cjs');
const { isWordPressFile, extractContent, resolveMode, resolveCatchOverrides, applyCatchOverride } = hook;

const REPO_ROOT = path.join(__dirname, '..', '..', '..'); // <repo>/
const HOOK_PATH = path.join(__dirname, '..', 'wp-enforce.cjs');
const CATCH_RUNNER = path.join(REPO_ROOT, 'dist', 'hook-catch.mjs');

// ---------------------------------------------------------------------------
// isWordPressFile
// ---------------------------------------------------------------------------

describe('isWordPressFile — path signals', () => {
  it('matches wp-content/ path', () => {
    assert.equal(isWordPressFile('/var/www/html/wp-content/plugins/my-plugin/main.php', ''), true);
  });

  it('matches plugins/ path', () => {
    assert.equal(isWordPressFile('/project/plugins/woo-extension/class-order.php', ''), true);
  });

  it('matches woocommerce in path', () => {
    assert.equal(isWordPressFile('/src/woocommerce/includes/class-wc-order.php', ''), true);
  });

  it('matches themes/ path', () => {
    assert.equal(isWordPressFile('/themes/storefront/functions.php', ''), true);
  });

  it('matches blocks/ path for JS', () => {
    assert.equal(isWordPressFile('/plugins/my-block/blocks/edit.js', ''), true);
  });

  it('rejects non-WP path without content signals', () => {
    assert.equal(isWordPressFile('/src/api/routes/user.ts', ''), false);
  });

  it('rejects a non-WP monorepo dir ending in "-plugin/"', () => {
    // "analytics-plugin/" must not match the anchored plugins?/ signal.
    assert.equal(isWordPressFile('/src/analytics-plugin/tracker.ts', ''), false);
  });

  it('rejects non-WP extension (.py)', () => {
    assert.equal(isWordPressFile('/wp-content/plugins/script.py', 'add_filter'), false);
  });
});

describe('isWordPressFile — content signals (non-WP paths)', () => {
  it('detects <?php content signal', () => {
    assert.equal(isWordPressFile('/src/handler.php', '<?php\n$x = 1;'), true);
  });

  it('detects add_action signal', () => {
    assert.equal(isWordPressFile('/src/handler.php', 'add_action("init", function() {});'), true);
  });

  it('detects @wordpress/ import in .js', () => {
    assert.equal(isWordPressFile('/src/editor.js', "import { registerBlockType } from '@wordpress/blocks';"), true);
  });

  it('rejects .ts file with no WP signals', () => {
    assert.equal(isWordPressFile('/src/api.ts', 'export function fetchUser() {}'), false);
  });

  it('rejects empty content on non-WP path', () => {
    assert.equal(isWordPressFile('/src/util.php', ''), false);
  });
});

// ---------------------------------------------------------------------------
// extractContent
// ---------------------------------------------------------------------------

describe('extractContent — Write', () => {
  it('returns filepath and content', () => {
    const result = extractContent('Write', {
      file_path: '/wp-content/plugins/my-plugin.php',
      content: '<?php add_action("init", fn() => null);',
    });
    assert.ok(result);
    assert.equal(result.filePath, '/wp-content/plugins/my-plugin.php');
    assert.ok(result.content.includes('add_action'));
  });

  it('returns null when content is empty', () => {
    const result = extractContent('Write', { file_path: '/foo.php', content: '' });
    assert.equal(result, null);
  });
});

describe('extractContent — Edit', () => {
  it('extracts new_string only', () => {
    const result = extractContent('Edit', {
      file_path: '/plugins/foo/class.php',
      old_string: '$orders = get_posts(["post_type" => "shop_order"]);',
      new_string: '$order = wc_get_order($id);',
    });
    assert.ok(result);
    assert.ok(result.content.includes('wc_get_order'));
    assert.ok(!result.content.includes('get_posts'));
  });

  it('returns null when new_string is absent', () => {
    const result = extractContent('Edit', { file_path: '/foo.php', old_string: 'x', new_string: '' });
    assert.equal(result, null);
  });
});

describe('extractContent — MultiEdit', () => {
  it('concatenates new_strings from all edits', () => {
    const result = extractContent('MultiEdit', {
      file_path: '/plugins/foo/order.php',
      edits: [
        { old_string: 'a', new_string: '$order = wc_get_order($id);' },
        { old_string: 'b', new_string: 'add_filter("woocommerce_order", fn() => null);' },
      ],
    });
    assert.ok(result);
    assert.ok(result.content.includes('wc_get_order'));
    assert.ok(result.content.includes('add_filter'));
  });

  it('returns null when all new_strings are empty', () => {
    const result = extractContent('MultiEdit', {
      file_path: '/foo.php',
      edits: [{ old_string: 'a', new_string: '' }],
    });
    assert.equal(result, null);
  });
});

describe('extractContent — unknown tool', () => {
  it('returns null for Bash', () => {
    assert.equal(extractContent('Bash', { command: 'echo hi' }), null);
  });
});

// ---------------------------------------------------------------------------
// resolveMode
// ---------------------------------------------------------------------------

describe('resolveMode — env var takes priority', () => {
  let tmpDir;
  before(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumo-mode-test-')); });
  after(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('returns "off" for LUMO_ENFORCE_HOOK=off', () => {
    const orig = process.env.LUMO_ENFORCE_HOOK;
    process.env.LUMO_ENFORCE_HOOK = 'off';
    try {
      assert.equal(resolveMode(tmpDir), 'off');
    } finally {
      if (orig === undefined) delete process.env.LUMO_ENFORCE_HOOK;
      else process.env.LUMO_ENFORCE_HOOK = orig;
    }
  });

  it('returns "warn-only" for LUMO_ENFORCE_HOOK=warn-only', () => {
    const orig = process.env.LUMO_ENFORCE_HOOK;
    process.env.LUMO_ENFORCE_HOOK = 'warn-only';
    try {
      assert.equal(resolveMode(tmpDir), 'warn-only');
    } finally {
      if (orig === undefined) delete process.env.LUMO_ENFORCE_HOOK;
      else process.env.LUMO_ENFORCE_HOOK = orig;
    }
  });

  it('returns "block" for LUMO_ENFORCE_HOOK=block', () => {
    const orig = process.env.LUMO_ENFORCE_HOOK;
    process.env.LUMO_ENFORCE_HOOK = 'block';
    try {
      assert.equal(resolveMode(tmpDir), 'block');
    } finally {
      if (orig === undefined) delete process.env.LUMO_ENFORCE_HOOK;
      else process.env.LUMO_ENFORCE_HOOK = orig;
    }
  });
});

describe('resolveMode — .lumo.json config', () => {
  let tmpDir;
  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumo-cfg-test-'));
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
  });
  after(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  function writeConfig(mode) {
    fs.writeFileSync(
      path.join(tmpDir, '.claude', '.lumo.json'),
      JSON.stringify({ enforce: { mode } }),
    );
  }

  it('reads "warn-only" from .lumo.json', () => {
    writeConfig('warn-only');
    const orig = process.env.LUMO_ENFORCE_HOOK;
    delete process.env.LUMO_ENFORCE_HOOK;
    try {
      assert.equal(resolveMode(tmpDir), 'warn-only');
    } finally {
      if (orig !== undefined) process.env.LUMO_ENFORCE_HOOK = orig;
    }
  });

  it('reads "off" from .lumo.json', () => {
    writeConfig('off');
    const orig = process.env.LUMO_ENFORCE_HOOK;
    delete process.env.LUMO_ENFORCE_HOOK;
    try {
      assert.equal(resolveMode(tmpDir), 'off');
    } finally {
      if (orig !== undefined) process.env.LUMO_ENFORCE_HOOK = orig;
    }
  });
});

describe('resolveMode — default', () => {
  let tmpDir;
  before(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumo-def-test-')); });
  after(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('defaults to "block" with no env and no config', () => {
    const orig = process.env.LUMO_ENFORCE_HOOK;
    delete process.env.LUMO_ENFORCE_HOOK;
    try {
      assert.equal(resolveMode(tmpDir), 'block');
    } finally {
      if (orig !== undefined) process.env.LUMO_ENFORCE_HOOK = orig;
    }
  });
});

// ---------------------------------------------------------------------------
// resolveCatchOverrides
// ---------------------------------------------------------------------------

describe('resolveCatchOverrides — no config', () => {
  let tmpDir;
  before(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumo-ov-noconfig-')); });
  after(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('returns empty disable set and empty downgrade map when no .lumo.json', () => {
    const ov = resolveCatchOverrides(tmpDir);
    assert.equal(ov.disable.size, 0);
    assert.deepEqual(ov.downgrade, {});
  });
});

describe('resolveCatchOverrides — with config', () => {
  let tmpDir;
  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumo-ov-cfg-'));
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
  });
  after(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  function writeConfig(catchSection) {
    fs.writeFileSync(
      path.join(tmpDir, '.claude', '.lumo.json'),
      JSON.stringify({ enforce: { mode: 'block' }, catch: catchSection }),
    );
  }

  it('reads disable array into a Set', () => {
    writeConfig({ disable: ['woocommerce-hpos-order-access', 'wp-img-tag-add-decoding-attr-deprecation'] });
    const ov = resolveCatchOverrides(tmpDir);
    assert.equal(ov.disable.has('woocommerce-hpos-order-access'), true);
    assert.equal(ov.disable.has('wp-img-tag-add-decoding-attr-deprecation'), true);
    assert.equal(ov.disable.size, 2);
  });

  it('reads downgrade map', () => {
    writeConfig({ downgrade: { 'woocommerce-hpos-order-access': 'soft' } });
    const ov = resolveCatchOverrides(tmpDir);
    assert.equal(ov.downgrade['woocommerce-hpos-order-access'], 'soft');
  });

  it('empty catch section returns empty structures', () => {
    writeConfig({});
    const ov = resolveCatchOverrides(tmpDir);
    assert.equal(ov.disable.size, 0);
    assert.deepEqual(ov.downgrade, {});
  });

  it('missing catch key returns empty structures', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.claude', '.lumo.json'),
      JSON.stringify({ enforce: { mode: 'block' } }),
    );
    const ov = resolveCatchOverrides(tmpDir);
    assert.equal(ov.disable.size, 0);
    assert.deepEqual(ov.downgrade, {});
  });

  it('malformed .lumo.json returns empty structures (fail-open)', () => {
    fs.writeFileSync(path.join(tmpDir, '.claude', '.lumo.json'), '{ not valid json }');
    const ov = resolveCatchOverrides(tmpDir);
    assert.equal(ov.disable.size, 0);
    assert.deepEqual(ov.downgrade, {});
  });
});

// ---------------------------------------------------------------------------
// applyCatchOverride (hook-level single-result function)
// ---------------------------------------------------------------------------

describe('applyCatchOverride — disable', () => {
  const slug = 'woocommerce-hpos-order-access';

  it('returns null when slug is in disable set', () => {
    const result = { tier: 'LOUD', entry: { slug }, message: 'bad' };
    const ov = { disable: new Set([slug]), downgrade: {} };
    assert.equal(applyCatchOverride(result, ov), null);
  });

  it('returns result unchanged when slug not in disable set', () => {
    const result = { tier: 'LOUD', entry: { slug }, message: 'bad' };
    const ov = { disable: new Set(['some-other-slug']), downgrade: {} };
    const out = applyCatchOverride(result, ov);
    assert.ok(out !== null);
    assert.equal(out.tier, 'LOUD');
  });

  it('returns result unchanged when disable is empty', () => {
    const result = { tier: 'LOUD', entry: { slug }, message: 'bad' };
    const ov = { disable: new Set(), downgrade: {} };
    const out = applyCatchOverride(result, ov);
    assert.ok(out !== null);
    assert.equal(out.tier, 'LOUD');
  });
});

describe('applyCatchOverride — downgrade', () => {
  const slug = 'woocommerce-hpos-order-access';

  it('LOUD → SOFT when downgrade "soft" targets slug', () => {
    const result = { tier: 'LOUD', entry: { slug }, message: 'bad' };
    const ov = { disable: new Set(), downgrade: { [slug]: 'soft' } };
    const out = applyCatchOverride(result, ov);
    assert.ok(out !== null);
    assert.equal(out.tier, 'SOFT');
  });

  it('SOFT stays SOFT (downgrade soft on a SOFT result)', () => {
    const result = { tier: 'SOFT', entry: { slug }, message: 'advisory' };
    const ov = { disable: new Set(), downgrade: { [slug]: 'soft' } };
    const out = applyCatchOverride(result, ov);
    assert.ok(out !== null);
    assert.equal(out.tier, 'SOFT');
  });

  it('unknown cap value is no-op — LOUD remains LOUD', () => {
    const result = { tier: 'LOUD', entry: { slug }, message: 'bad' };
    const ov = { disable: new Set(), downgrade: { [slug]: 'future-unknown' } };
    const out = applyCatchOverride(result, ov);
    assert.ok(out !== null);
    assert.equal(out.tier, 'LOUD');
  });

  it('returns unchanged when slug not in downgrade map', () => {
    const result = { tier: 'LOUD', entry: { slug }, message: 'bad' };
    const ov = { disable: new Set(), downgrade: { 'other-slug': 'soft' } };
    const out = applyCatchOverride(result, ov);
    assert.ok(out !== null);
    assert.equal(out.tier, 'LOUD');
  });
});

// ---------------------------------------------------------------------------
// End-to-end hook invocation (spawnSync) — only when dist/hook-catch.mjs exists
// ---------------------------------------------------------------------------

const CATCH_RUNNER_EXISTS = fs.existsSync(CATCH_RUNNER);

describe('wp-enforce — e2e hook invocation', { skip: !CATCH_RUNNER_EXISTS && 'dist/hook-catch.mjs not built' }, () => {
  /**
   * Invoke the hook with a synthetic PreToolUse payload.
   * Returns { status, stdout, stderr }.
   */
  function invokeHook(payload, env = {}) {
    const result = spawnSync(process.execPath, [HOOK_PATH], {
      input: JSON.stringify(payload),
      encoding: 'utf8',
      env: { ...process.env, LUMO_ENFORCE_HOOK: 'block', ...env },
      cwd: REPO_ROOT,
    });
    let parsed = null;
    try {
      // Hook may emit multiple JSON lines; take the first non-empty one
      const firstLine = (result.stdout || '').split('\n').find((l) => l.trim());
      if (firstLine) parsed = JSON.parse(firstLine);
    } catch {
      // Stdout wasn't JSON
    }
    return { status: result.status, stdout: result.stdout, stderr: result.stderr, parsed };
  }

  // --- Allow path: non-WP file ---
  it('allows Write on a non-WordPress file (React component)', () => {
    const result = invokeHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '/src/components/Header.tsx',
        content: 'export function Header() { return <h1>Hello</h1>; }',
      },
    });
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    // No blocking output
    assert.ok(!result.parsed || result.parsed.continue !== false);
  });

  // --- Allow path: clean WordPress code ---
  it('allows Write on WordPress file with clean code', () => {
    const result = invokeHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '/wp-content/plugins/my-plugin/includes/class-orders.php',
        content: [
          '<?php',
          '$order = wc_get_order( $order_id );',
          'if ( ! $order ) { return; }',
          '$email = $order->get_billing_email();',
        ].join('\n'),
      },
    });
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    assert.ok(!result.parsed || result.parsed.continue !== false);
  });

  // --- Block path: LOUD catch on Write ---
  it('blocks Write on WordPress file with HPOS LOUD catch', () => {
    const result = invokeHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '/wp-content/plugins/my-plugin/includes/class-orders.php',
        content: [
          '<?php',
          "$orders = get_posts( array( 'post_type' => 'shop_order', 'numberposts' => 10 ) );",
          'foreach ( $orders as $order ) {',
          '  echo $order->ID;',
          '}',
        ].join('\n'),
      },
    });
    assert.equal(result.status, 2, `expected exit 2 (block), got ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
    assert.ok(result.parsed, 'expected JSON output from hook');
    assert.equal(result.parsed.continue, false);
    assert.equal(result.parsed.decision, 'block');
    // Reason must contain the dated version fact and correct pattern
    assert.ok(result.parsed.reason.includes('⚠️'), 'reason should contain warning emoji');
    assert.ok(result.parsed.reason.includes('8.2'), 'reason should contain breaking version');
  });

  // --- Block path: LOUD catch on Edit ---
  it('blocks Edit that introduces HPOS bad pattern', () => {
    const result = invokeHook({
      tool_name: 'Edit',
      tool_input: {
        file_path: '/wp-content/plugins/my-plugin/orders.php',
        old_string: '$order = wc_get_order( $id );',
        new_string: "$orders = get_posts( [ 'post_type' => 'shop_order' ] );",
      },
    });
    assert.equal(result.status, 2, `expected block, got ${result.status}`);
    assert.equal(result.parsed?.continue, false);
  });

  // --- Warn-only mode: LOUD catch becomes advisory ---
  it('warns (not blocks) on LOUD catch when mode is warn-only', () => {
    const result = invokeHook(
      {
        tool_name: 'Write',
        tool_input: {
          file_path: '/wp-content/plugins/my-plugin/orders.php',
          content: [
            '<?php',
            "$orders = get_posts( array( 'post_type' => 'shop_order' ) );",
          ].join('\n'),
        },
      },
      { LUMO_ENFORCE_HOOK: 'warn-only' },
    );
    // Must allow (exit 0) but output advisory context
    assert.equal(result.status, 0, `expected exit 0, got ${result.status}`);
    assert.ok(result.parsed, 'expected JSON advisory output');
    assert.ok(result.parsed.hookSpecificOutput, 'expected hookSpecificOutput key');
    assert.ok(
      result.parsed.hookSpecificOutput.additionalContext.includes('⚠️') ||
      result.parsed.hookSpecificOutput.additionalContext.includes('🔍'),
    );
  });

  // --- Off mode: no-op ---
  it('is a no-op when mode is off', () => {
    const result = invokeHook(
      {
        tool_name: 'Write',
        tool_input: {
          file_path: '/wp-content/plugins/bad.php',
          content: "$orders = get_posts( [ 'post_type' => 'shop_order' ] );",
        },
      },
      { LUMO_ENFORCE_HOOK: 'off' },
    );
    assert.equal(result.status, 0);
    // Nothing written to stdout (no block, no advisory)
    const hasMeaningfulOutput = (result.stdout || '').trim().length > 0;
    assert.ok(!hasMeaningfulOutput, 'off mode must produce no stdout');
  });

  // --- SOFT catch: advisory emitted, not a block ---
  it('emits advisory (not block) for SOFT context-dependent catch', () => {
    const result = invokeHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '/wp-content/plugins/my-plugin/meta.php',
        content: [
          '<?php',
          '// Accessing order meta via post meta API',
          '$email = get_post_meta( $order_id, \'_billing_email\', true );',
        ].join('\n'),
      },
    });
    // SOFT → allow, but advisory injected
    assert.equal(result.status, 0);
    if (result.parsed && result.parsed.hookSpecificOutput) {
      assert.ok(
        result.parsed.hookSpecificOutput.additionalContext.includes('🔍') ||
        result.parsed.hookSpecificOutput.additionalContext.includes('Worth reviewing'),
      );
    }
  });

  // --- Scoping: non-WP tool (Bash) → no-op ---
  it('ignores Bash tool calls entirely', () => {
    const result = invokeHook({
      tool_name: 'Bash',
      tool_input: { command: 'echo hello' },
    });
    assert.equal(result.status, 0);
    assert.equal((result.stdout || '').trim(), '');
  });

  // --- Catch override: disable prevents block ---
  it('disabled rule does not block — exit 0 with no output', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumo-ov-e2e-'));
    try {
      fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
      fs.writeFileSync(
        path.join(tmpDir, '.claude', '.lumo.json'),
        JSON.stringify({
          enforce: { mode: 'block' },
          catch: { disable: ['woocommerce-hpos-order-access'] },
        }),
      );

      const result = spawnSync(process.execPath, [HOOK_PATH], {
        input: JSON.stringify({
          tool_name: 'Write',
          cwd: tmpDir,
          tool_input: {
            file_path: path.join(tmpDir, 'wp-content/plugins/bad.php'),
            content: "<?php\n$orders = get_posts( array( 'post_type' => 'shop_order' ) );",
          },
        }),
        encoding: 'utf8',
        env: { ...process.env, LUMO_ENFORCE_HOOK: 'block' },
        cwd: REPO_ROOT,
      });

      // Disabled rule must not block
      assert.equal(result.status, 0, `expected exit 0 (disabled), got ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
      // And must produce no blocking output
      const parsed = result.stdout.trim() ? JSON.parse(result.stdout.split('\n').find((l) => l.trim())) : null;
      assert.ok(!parsed || parsed.continue !== false, 'disabled rule must not set continue:false');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // --- Catch override: downgrade LOUD → no block, advisory emitted ---
  it('downgraded rule fires as advisory (SOFT) not as a block', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumo-ov-dg-'));
    try {
      fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
      fs.writeFileSync(
        path.join(tmpDir, '.claude', '.lumo.json'),
        JSON.stringify({
          enforce: { mode: 'block' },
          catch: { downgrade: { 'woocommerce-hpos-order-access': 'soft' } },
        }),
      );

      const result = spawnSync(process.execPath, [HOOK_PATH], {
        input: JSON.stringify({
          tool_name: 'Write',
          cwd: tmpDir,
          tool_input: {
            file_path: path.join(tmpDir, 'wp-content/plugins/bad.php'),
            content: "<?php\n$orders = get_posts( array( 'post_type' => 'shop_order' ) );",
          },
        }),
        encoding: 'utf8',
        env: { ...process.env, LUMO_ENFORCE_HOOK: 'block' },
        cwd: REPO_ROOT,
      });

      // Downgraded LOUD must not block (exit 0)
      assert.equal(result.status, 0, `expected exit 0 (downgraded), got ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
      // Should surface an advisory
      if (result.stdout.trim()) {
        const line = result.stdout.split('\n').find((l) => l.trim());
        const parsed = line ? JSON.parse(line) : null;
        assert.ok(parsed && parsed.hookSpecificOutput, 'expected advisory hookSpecificOutput for downgraded rule');
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // --- Shim guard: function_exists wrapper downgrades LOUD to SOFT ---
  it('allows (with advisory) when shim guard fires — function_exists wrapper', () => {
    const content = [
      '<?php',
      "if ( ! function_exists( 'wp_img_tag_add_decoding_attr' ) ) {",
      "  function wp_img_tag_add_decoding_attr( $image, $context ) { return $image; }",
      '}',
    ].join('\n');
    const result = invokeHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '/wp-content/plugins/compat/shims.php',
        content,
      },
    });
    // Shim guard fires → SOFT → no block (exit 0)
    assert.equal(result.status, 0);
  });
});

// ---------------------------------------------------------------------------
// Dist-absent path: no block, stderr notice
// ---------------------------------------------------------------------------

describe('wp-enforce — missing dist (fail-open)', () => {
  it('exits 0 and writes a stderr notice when hook-catch.mjs is absent', () => {
    const result = spawnSync(process.execPath, [HOOK_PATH], {
      input: JSON.stringify({
        tool_name: 'Write',
        tool_input: {
          file_path: '/wp-content/plugins/bad.php',
          content: "<?php\n$orders = get_posts( [ 'post_type' => 'shop_order' ] );",
        },
      }),
      encoding: 'utf8',
      env: {
        ...process.env,
        LUMO_ENFORCE_HOOK: 'block',
        // Override the runner path by pointing CLAUDE_PROJECT_DIR at a temp dir
        // (the hook computes its path relative to __dirname, so we can't redirect
        //  it purely through env — instead we rely on the real hook failing open
        //  when it doesn't exist; test only runs when dist is absent)
      },
      cwd: REPO_ROOT,
    });

    // If the dist exists, skip assertion (the hook would behave differently)
    if (CATCH_RUNNER_EXISTS) return;

    assert.equal(result.status, 0, 'should fail-open when dist missing');
    assert.ok(result.stderr.includes('dist/hook-catch.mjs not found'), result.stderr);
  });
});
