#!/usr/bin/env node
/**
 * wp-enforce.cjs — PreToolUse enforcement hook for WordPress/PHP files.
 *
 * Intercepts Write / Edit / MultiEdit on WordPress and PHP files, runs the
 * free catch engine over the proposed content, and either blocks (LOUD/CERTAIN
 * findings) or surfaces an advisory (SOFT findings) before the edit lands.
 *
 * Why a hook instead of a CLAUDE.md instruction: an instruction is model-chosen
 * and can be skipped under context pressure; a PreToolUse hook is harness-run
 * and fires deterministically on every qualifying write.
 *
 * Precision model (mirrors the no-false-LOUD guarantee in the catch engine):
 *   LOUD / CERTAIN  → exit 2 (block) with dated reason + correct pattern
 *   SOFT / CONTEXT_DEPENDENT → allow with advisory injected into context
 *   No finding       → allow silently
 *
 * Mode (configurable via .claude/.lumo.json or env):
 *   block     (default) — LOUD blocks, SOFT warns
 *   warn-only           — all findings warn; nothing blocked
 *
 * The hook is a no-op (exit 0) when:
 *   - The file is not a WordPress/PHP/plugin file
 *   - The hook is disabled via config or LUMO_ENFORCE_HOOK=off
 *   - The compiled hook-catch.mjs module is absent (dist not built yet)
 *   - Any unexpected error (fail-open)
 *
 * Pro seam: when LUMO_PRO_URL + LUMO_LICENSE_KEY are present, the Pro MCP
 * server can replace runHookCatch() — the interface is identical. That
 * integration test needs a live staging MCP and is tracked in #92 (deferred).
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/**
 * Resolve enforcement mode from:
 *   1. Env var  LUMO_ENFORCE_HOOK=off / warn-only / block
 *   2. .claude/.lumo.json  { "enforce": { "mode": "warn-only" } }
 *   3. Default: "block"
 *
 * Accepted mode values: "block" | "warn-only" | "off"
 */
function resolveMode(projectDir) {
  const envVal = (process.env.LUMO_ENFORCE_HOOK ?? '').toLowerCase();
  if (envVal === 'off' || envVal === '0' || envVal === 'false') return 'off';
  if (envVal === 'warn-only') return 'warn-only';
  if (envVal === 'block') return 'block';

  // Read project-local config
  try {
    const cfgPath = path.join(projectDir, '.claude', '.lumo.json');
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      const mode = cfg?.enforce?.mode;
      if (mode === 'off') return 'off';
      if (mode === 'warn-only') return 'warn-only';
      if (mode === 'block') return 'block';
    }
  } catch {
    // Ignore config read errors — fall through to default
  }

  return 'block';
}

// ---------------------------------------------------------------------------
// Catch overrides
// ---------------------------------------------------------------------------

/**
 * Read per-project catch overrides from .claude/.lumo.json.
 *
 * Schema (catch section):
 *   { "catch": { "disable": ["<slug>"], "downgrade": { "<slug>": "soft" } } }
 *
 * Returns { disable: Set<string>, downgrade: Record<string,string> }.
 * When the file is absent, malformed, or the catch key is missing, returns
 * empty structures — the caller gets baseline behaviour unchanged.
 */
function resolveCatchOverrides(projectDir) {
  try {
    const cfgPath = path.join(projectDir, '.claude', '.lumo.json');
    if (!fs.existsSync(cfgPath)) return { disable: new Set(), downgrade: {} };

    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const catchCfg = cfg?.catch;
    if (!catchCfg || typeof catchCfg !== 'object') return { disable: new Set(), downgrade: {} };

    const disable = new Set(Array.isArray(catchCfg.disable) ? catchCfg.disable : []);
    const downgrade =
      catchCfg.downgrade && typeof catchCfg.downgrade === 'object' && !Array.isArray(catchCfg.downgrade)
        ? catchCfg.downgrade
        : {};

    return { disable, downgrade };
  } catch {
    return { disable: new Set(), downgrade: {} };
  }
}

/**
 * Apply catch overrides to a single hook catch result.
 *
 * - disabled slug → return null (caller skips processing)
 * - downgrade "soft" + current LOUD → return mutated copy with tier SOFT
 * - anything else → return unchanged
 */
function applyCatchOverride(catchResult, overrides) {
  const { disable, downgrade } = overrides;
  const slug = catchResult?.entry?.slug ?? catchResult?.slug ?? null;

  if (slug && disable.has(slug)) return null;
  if (slug && downgrade[slug] === 'soft' && catchResult.tier === 'LOUD') {
    return { ...catchResult, tier: 'SOFT' };
  }
  return catchResult;
}

// ---------------------------------------------------------------------------
// WordPress file detection
// ---------------------------------------------------------------------------

/** Extensions that can carry WordPress/WooCommerce code. */
const WP_EXTENSIONS = new Set(['.php', '.js', '.jsx', '.ts', '.tsx']);

/**
 * Path segments that strongly indicate a WordPress/WooCommerce/plugin context.
 * Intentionally conservative — must not intercept non-WP projects using PHP.
 */
const WP_PATH_SIGNALS = [
  /wp-content\//i,
  /wp-includes\//i,
  /wp-admin\//i,
  /(?:^|\/)plugins?\//i,
  /(?:^|\/)themes?\//i,
  /woocommerce/i,
  /\bwp-/i,
  /\/blocks?\//i,
  /(?:^|\/)mu-plugins?\//i,
];

/** Content patterns that confirm WordPress context inside the blob itself. */
const WP_CONTENT_SIGNALS = [
  '<?php',
  'wp_',
  'WC_',
  'wc_',
  'WP_',
  'add_action',
  'add_filter',
  'register_post_type',
  'woocommerce',
  'registerBlockType',
  '@wordpress/',
  'get_post_meta',
];

/**
 * Return true when the write target looks like a WordPress/WooCommerce file.
 *
 * Two-gate check: at least one of (path signal, content signal) must match.
 * Path signal alone is sufficient (a blank .php in plugins/ is still WP context).
 * Content signal alone suffices for non-standard paths that use WP APIs.
 */
function isWordPressFile(filePath, content) {
  if (!filePath) return false;

  const ext = path.extname(filePath).toLowerCase();
  if (!WP_EXTENSIONS.has(ext)) return false;

  const pathMatch = WP_PATH_SIGNALS.some((re) => re.test(filePath));
  if (pathMatch) return true;

  // For non-path-signalled files, require content evidence
  if (content && typeof content === 'string') {
    return WP_CONTENT_SIGNALS.some((sig) => content.includes(sig));
  }

  return false;
}

// ---------------------------------------------------------------------------
// Content extraction per tool type
// ---------------------------------------------------------------------------

/**
 * Extract (filepath, code) from a PreToolUse tool_input.
 *
 * Write:     { file_path, content }
 * Edit:      { file_path, old_string, new_string }  → scan new_string only
 * MultiEdit: { file_path, edits: [{ old_string, new_string }] }  → concat new_strings
 *
 * Returns null when the tool type is unknown or content is missing.
 */
function extractContent(toolName, toolInput) {
  if (!toolInput) return null;

  const filePath = toolInput.file_path ?? '';

  switch (toolName) {
    case 'Write': {
      const content = toolInput.content ?? '';
      return content ? { filePath, content } : null;
    }
    case 'Edit': {
      const content = toolInput.new_string ?? '';
      return content ? { filePath, content } : null;
    }
    case 'MultiEdit': {
      const edits = toolInput.edits ?? [];
      const content = edits
        .map((e) => e.new_string ?? '')
        .filter(Boolean)
        .join('\n');
      return content ? { filePath, content } : null;
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

/** Emit a hard block — exits 2 after calling this. */
function emitBlock(reason) {
  process.stdout.write(JSON.stringify({ continue: false, decision: 'block', reason }) + '\n');
}

/** Inject an advisory into the model's context without blocking. */
function emitAdvisory(message) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: message,
      },
    }) + '\n',
  );
}

// ---------------------------------------------------------------------------
// Hook catch runner path
// ---------------------------------------------------------------------------

/**
 * Resolve the path to dist/hook-catch.mjs relative to this hook file.
 * The hook lives at <repo>/.claude/hooks/wp-enforce.cjs.
 * The bundle lives at <repo>/dist/hook-catch.mjs.
 */
function resolveCatchRunnerPath(hookDir) {
  return path.join(hookDir, '..', '..', 'dist', 'hook-catch.mjs');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Read hook payload from stdin
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8').trim();
  } catch {
    process.exit(0);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolName = payload.tool_name ?? '';
  const toolInput = payload.tool_input ?? {};

  // Only intercept write tools
  if (!['Write', 'Edit', 'MultiEdit'].includes(toolName)) {
    process.exit(0);
  }

  // Resolve project dir from cwd in payload or process cwd
  const projectDir = payload.cwd ?? process.cwd();

  // Check mode — off means no-op
  const mode = resolveMode(projectDir);
  if (mode === 'off') {
    process.exit(0);
  }

  // Extract file path and content
  const extracted = extractContent(toolName, toolInput);
  if (!extracted) {
    process.exit(0);
  }

  const { filePath, content } = extracted;

  // Scope guard: only intercept WordPress/PHP files
  if (!isWordPressFile(filePath, content)) {
    process.exit(0);
  }

  // Locate the compiled catch runner — if absent, fail-open (build not run yet)
  const hookDir = __dirname;
  const catchRunnerPath = resolveCatchRunnerPath(hookDir);
  if (!fs.existsSync(catchRunnerPath)) {
    // Emit a one-time notice so the team knows the build is missing
    process.stderr.write(
      '[lumo] wp-enforce: dist/hook-catch.mjs not found — run `npm run build` to activate enforcement.\n',
    );
    process.exit(0);
  }

  // Read per-project catch overrides before invoking the catch engine.
  // Overrides are threaded into runHookCatch() so disabled/downgraded rules
  // are applied inside checkCode() — the tier returned already reflects them.
  const catchOverrides = resolveCatchOverrides(projectDir);
  const overridesArg =
    catchOverrides.disable.size > 0 || Object.keys(catchOverrides.downgrade).length > 0
      ? {
          disable: [...catchOverrides.disable],
          downgrade: catchOverrides.downgrade,
        }
      : undefined;

  // Run the catch engine (ESM module via dynamic import)
  let catchResult;
  try {
    const { runHookCatch } = await import(catchRunnerPath);
    catchResult = runHookCatch(content, 'auto', overridesArg);
  } catch {
    // Fail-open: catch engine error must never block the developer
    process.exit(0);
  }

  // No finding (or all findings suppressed by overrides) — allow silently
  if (!catchResult.tier) {
    process.exit(0);
  }

  // --- LOUD / CERTAIN: block (unless warn-only mode) ---
  if (catchResult.tier === 'LOUD' && mode === 'block') {
    const reason = [
      'Lumo blocked this edit: the proposed code uses a pattern that broke in a specific WordPress/WooCommerce version.\n',
      catchResult.message,
      '\nFix by applying the correct pattern shown above. Re-run after the fix to confirm no issues remain.',
      'Set LUMO_ENFORCE_HOOK=warn-only to downgrade to advisory-only mode.',
    ].join('\n');

    emitBlock(reason);
    process.exit(2);
  }

  // --- SOFT or warn-only mode: surface advisory, allow ---
  const advisory = [
    'Lumo advisory on this WordPress/PHP edit:\n',
    catchResult.message,
    '\nThis is a conditional risk — review before committing.',
  ].join('\n');

  emitAdvisory(advisory);
  process.exit(0);
}

// Run main only when executed directly as a hook — not when require()'d for testing
if (require.main === module) {
  main().catch(() => process.exit(0));
}

// Export pure functions for unit testing
module.exports = { isWordPressFile, extractContent, resolveMode, resolveCatchRunnerPath, resolveCatchOverrides, applyCatchOverride };
