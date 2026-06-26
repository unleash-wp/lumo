import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { detectFromComposer } from '../src/detection/composer.js';
import { detectFromDirectory } from '../src/detection/directory.js';
import { detectFromWpCli } from '../src/detection/wp-cli.js';
import { detectFromSource } from '../src/detection/heuristic.js';
import { detectFromGitTracked } from '../src/detection/git.js';
import { detectStack, auditProject, buildProTeaser, buildDetectionNote } from '../src/detection/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

// ---------------------------------------------------------------------------
// FA-10: composer detector
// ---------------------------------------------------------------------------

describe('detectFromComposer', () => {
  it('detects WooCommerce with version from composer-woo fixture', () => {
    const result = detectFromComposer(join(fixturesDir, 'composer-woo'));
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('woocommerce');
    expect(result?.version).toBe('8.5');
    expect(result?.source).toBe('composer');
  });

  it('returns null when composer.json has no woo dependency', () => {
    const result = detectFromComposer(join(fixturesDir, 'non-woo'));
    expect(result).toBeNull();
  });

  it('returns null when composer.json is absent — no throw', () => {
    const emptyDir = mkdtempSync(join(tmpdir(), 'lumo-test-'));
    expect(() => detectFromComposer(emptyDir)).not.toThrow();
    expect(detectFromComposer(emptyDir)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// FA-11: directory detector
// ---------------------------------------------------------------------------

describe('detectFromDirectory', () => {
  it('detects WooCommerce with version from classic-wp fixture', () => {
    const result = detectFromDirectory(join(fixturesDir, 'classic-wp'));
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('woocommerce');
    expect(result?.version).toBe('8.6.1');
    expect(result?.source).toBe('directory');
  });

  it('returns null when no composer.json present in composer-woo (no plugin dir)', () => {
    // composer-woo has no wp-content directory — directory detector returns null
    const result = detectFromDirectory(join(fixturesDir, 'composer-woo'));
    expect(result).toBeNull();
  });

  it('returns null when plugin directory is absent — no throw', () => {
    const emptyDir = mkdtempSync(join(tmpdir(), 'lumo-test-'));
    expect(() => detectFromDirectory(emptyDir)).not.toThrow();
    expect(detectFromDirectory(emptyDir)).toBeNull();
  });

  // env-in-git detection moved to the git rung — the directory rung no longer owns .env.
  // A .env that merely exists on disk (without being git-tracked) is the normal correct state
  // and must not be flagged as a false positive by the directory detector.
  it('returns null for a tmp dir that contains only a .env file (directory rung no longer owns .env)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-env-test-'));
    writeFileSync(join(dir, '.env'), 'API_KEY=placeholder\n');
    const result = detectFromDirectory(dir);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// FA-14: detectStack stop-at-first-hit
// ---------------------------------------------------------------------------

describe('detectStack', () => {
  it('uses composer result and never consults directory when both present', () => {
    // composer-and-dir has composer.json (^8.5 → "8.5") AND a plugin dir with Version: 9.0.0
    // The ladder must stop at composer — result version is "8.5", not "9.0.0"
    const result = detectStack(join(fixturesDir, 'composer-and-dir'));
    expect(result).not.toBeNull();
    expect(result?.source).toBe('composer');
    expect(result?.version).toBe('8.5');
  });

  it('falls through to directory when composer misses', () => {
    const result = detectStack(join(fixturesDir, 'classic-wp'));
    expect(result).not.toBeNull();
    expect(result?.source).toBe('directory');
    expect(result?.version).toBe('8.6.1');
  });

  it('returns null on a completely empty temp dir — no throw', () => {
    const emptyDir = mkdtempSync(join(tmpdir(), 'lumo-test-'));
    expect(() => detectStack(emptyDir)).not.toThrow();
    expect(detectStack(emptyDir)).toBeNull();
  });

  it('returns null for a tmp dir with only a .env file — directory rung no longer fires on .env alone', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-env-test-'));
    writeFileSync(join(dir, '.env'), 'API_KEY=placeholder\n');
    const result = detectStack(dir);
    // Not a git repo and no other signals → all rungs return null
    expect(result).toBeNull();
  });

  it('returns null for clean-repo (no pattern matches)', () => {
    expect(() => detectStack(join(fixturesDir, 'clean-repo'))).not.toThrow();
    expect(detectStack(join(fixturesDir, 'clean-repo'))).toBeNull();
  });

  it('still detects woocommerce from composer-woo with env-in-git in registry', () => {
    const result = detectStack(join(fixturesDir, 'composer-woo'));
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('woocommerce');
    expect(result?.source).toBe('composer');
  });
});

// ---------------------------------------------------------------------------
// FA-14: auditProject
// ---------------------------------------------------------------------------

describe('auditProject', () => {
  it('returns detected:true + entry slug on composer-woo fixture', () => {
    const result = auditProject(join(fixturesDir, 'composer-woo'));
    expect(result.detected).toBe(true);
    expect(result.entry?.slug).toBe('woocommerce-hpos-order-access');
    expect(result.detection?.source).toBe('composer');
  });

  it('returns detected:false + neutral message on empty temp dir — no throw', () => {
    const emptyDir = mkdtempSync(join(tmpdir(), 'lumo-test-'));
    expect(() => auditProject(emptyDir)).not.toThrow();
    const result = auditProject(emptyDir);
    expect(result.detected).toBe(false);
    expect(result.message).toMatch(/No known WordPress risk patterns detected/);
    expect(result.entry).toBeUndefined();
  });

  it('returns detected:false + neutral message on non-woo fixture — no throw', () => {
    expect(() => auditProject(join(fixturesDir, 'non-woo'))).not.toThrow();
    const result = auditProject(join(fixturesDir, 'non-woo'));
    expect(result.detected).toBe(false);
    expect(result.message).toMatch(/No known WordPress risk patterns detected/);
  });

  it('returns detected:false for a dir with an untracked .env — git rung requires tracking, not mere presence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-env-test-'));
    writeFileSync(join(dir, '.env'), 'API_KEY=placeholder\n');
    expect(() => auditProject(dir)).not.toThrow();
    const result = auditProject(dir);
    // Not a git repo → git rung returns null → no detection
    expect(result.detected).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// git-tracked detector
// ---------------------------------------------------------------------------

/**
 * Skip all git-rung tests when `git` is not on PATH — the detector itself is
 * fail-open in that case, so there is nothing to assert.
 */
function gitAvailable(): boolean {
  try {
    const r = spawnSync('git', ['--version'], { timeout: 3000, encoding: 'utf8' });
    return r.status === 0 && !r.error;
  } catch {
    return false;
  }
}

/** Init a bare git repo in `dir` and add (stage) `.env` so ls-files sees it. */
function initAndAddEnv(dir: string): void {
  // Staging (git add) is enough for `git ls-files` to report .env — no commit,
  // so no user identity needed (keeps the fixture green on a bare CI runner).
  spawnSync('git', ['init'], { cwd: dir, timeout: 5000, encoding: 'utf8' });
  writeFileSync(join(dir, '.env'), 'DB_PASSWORD=SuperSecret\nAPI_KEY=sk-live-123\n');
  spawnSync('git', ['add', '.env'], { cwd: dir, timeout: 5000, encoding: 'utf8' });
}

describe('detectFromGitTracked', () => {
  it('returns { pattern: env-in-git, source: git } when .env is staged in a git repo', () => {
    if (!gitAvailable()) return;
    const dir = mkdtempSync(join(tmpdir(), 'lumo-git-tracked-'));
    initAndAddEnv(dir);
    const result = detectFromGitTracked(dir);
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('env-in-git');
    expect(result?.source).toBe('git');
    expect(result?.version).toBeNull();
  });

  it('returns null when .env exists but is untracked (correct gitignored state)', () => {
    if (!gitAvailable()) return;
    const dir = mkdtempSync(join(tmpdir(), 'lumo-git-untracked-'));
    spawnSync('git', ['init'], { cwd: dir, timeout: 5000, encoding: 'utf8' });
    writeFileSync(join(dir, '.gitignore'), '.env\n');
    writeFileSync(join(dir, '.env'), 'DB_PASSWORD=secret\n');
    // .env is NOT added — ls-files --error-unmatch exits non-zero
    const result = detectFromGitTracked(dir);
    expect(result).toBeNull();
  });

  it('returns null for a non-git dir with a .env — fail-open, no throw', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-no-git-'));
    writeFileSync(join(dir, '.env'), 'DB_PASSWORD=secret\n');
    expect(() => detectFromGitTracked(dir)).not.toThrow();
    expect(detectFromGitTracked(dir)).toBeNull();
  });

  it('returns null for a completely empty non-git dir — fail-open, no throw', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-empty-'));
    expect(() => detectFromGitTracked(dir)).not.toThrow();
    expect(detectFromGitTracked(dir)).toBeNull();
  });
});

describe('detectStack — git rung fires when .env is tracked', () => {
  it('returns env-in-git with source git for a repo with a staged .env', () => {
    if (!gitAvailable()) return;
    const dir = mkdtempSync(join(tmpdir(), 'lumo-stack-git-'));
    initAndAddEnv(dir);
    const result = detectStack(dir);
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('env-in-git');
    expect(result?.source).toBe('git');
  });

  it('ladder precedence: woocommerce wins over a tracked .env (git rung is last)', () => {
    if (!gitAvailable()) return;
    const dir = mkdtempSync(join(tmpdir(), 'lumo-precedence-'));
    // Set up WooCommerce composer signal AND a tracked .env
    writeFileSync(
      join(dir, 'composer.json'),
      JSON.stringify({ require: { 'woocommerce/woocommerce': '^9.0' } }),
    );
    initAndAddEnv(dir);
    const result = detectStack(dir);
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('woocommerce');
    expect(result?.source).toBe('composer');
  });
});

describe('auditProject — tracked .env end-to-end', () => {
  it('detected:true, slug env-file-committed-to-git, source git, rendered output contains title and all supported versions', async () => {
    if (!gitAvailable()) return;
    const dir = mkdtempSync(join(tmpdir(), 'lumo-audit-git-'));
    initAndAddEnv(dir);
    const result = auditProject(dir);
    expect(result.detected).toBe(true);
    expect(result.detection?.source).toBe('git');
    expect(result.entry?.slug).toBe('env-file-committed-to-git');

    const { formatFreeMarkdown } = await import('../src/lib/render.js');
    const md = formatFreeMarkdown(result.entry!);
    expect(md).toContain('Committed .env file exposes secrets');
    expect(md).toContain('**Affected:** all supported versions');
  });
});

// ---------------------------------------------------------------------------
// 2a: heuristic detector (detectFromSource)
// ---------------------------------------------------------------------------

describe('detectFromSource', () => {
  it('detects WooCommerce in heuristic-woo fixture (signal in src/)', () => {
    const result = detectFromSource(join(fixturesDir, 'heuristic-woo'));
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('woocommerce');
    expect(result?.version).toBeNull();
    expect(result?.source).toBe('heuristic');
  });

  it('returns null on non-woo fixture (no PHP signals in non-vendor code)', () => {
    const result = detectFromSource(join(fixturesDir, 'non-woo'));
    expect(result).toBeNull();
  });

  it('returns null when the only signal is inside vendor/ (excluded)', () => {
    const result = detectFromSource(join(fixturesDir, 'vendor-only-woo'));
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2a: orchestrator falls through to heuristic
// ---------------------------------------------------------------------------

describe('detectStack — heuristic fallback', () => {
  it('returns heuristic detection for heuristic-woo (no composer/directory/wp-cli hit)', () => {
    const result = detectStack(join(fixturesDir, 'heuristic-woo'));
    expect(result).not.toBeNull();
    expect(result?.source).toBe('heuristic');
    expect(result?.pattern).toBe('woocommerce');
  });
});

describe('auditProject — heuristic path', () => {
  it('returns detected:true and routes to woocommerce-hpos-order-access entry for heuristic-woo', () => {
    const result = auditProject(join(fixturesDir, 'heuristic-woo'));
    expect(result.detected).toBe(true);
    expect(result.detection?.source).toBe('heuristic');
    expect(result.entry?.slug).toBe('woocommerce-hpos-order-access');
  });
});

// ---------------------------------------------------------------------------
// Non-WooCommerce detection: wordpress-core pattern via heuristic source signal
// ---------------------------------------------------------------------------

describe('detectFromSource — wordpress-core', () => {
  it('detects wordpress-core pattern when source contains wp_img_tag_add_decoding_attr(', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-wp-core-'));
    writeFileSync(
      join(dir, 'functions.php'),
      '<?php\n$img = wp_img_tag_add_decoding_attr( $img_html, \'the-content\' );\n',
    );
    const result = detectFromSource(dir);
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('wordpress-core');
    expect(result?.source).toBe('heuristic');
  });

  it('does not fire for a PHP file with no registered signals', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-wp-core-clean-'));
    writeFileSync(join(dir, 'functions.php'), '<?php\n// clean file\nthe_content();\n');
    const result = detectFromSource(dir);
    expect(result).toBeNull();
  });
});

describe('auditProject — non-WooCommerce end-to-end (wordpress-core)', () => {
  it('detects:true, routes to wp-img-tag entry, and renders WordPress ≥ 6.4.0 affected line', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-wp-core-audit-'));
    writeFileSync(
      join(dir, 'plugin.php'),
      '<?php\n$html = wp_img_tag_add_decoding_attr( $img, \'custom-context\' );\necho $html;\n',
    );
    const result = auditProject(dir);
    expect(result.detected).toBe(true);
    expect(result.entry?.slug).toBe('wp-img-tag-add-decoding-attr-deprecation');
    // Title confirms non-Woo catch
    expect(result.entry?.title).toContain('wp_img_tag_add_decoding_attr');
    // Affected line comes from the render path
    const { formatFreeMarkdown } = await import('../src/lib/render.js');
    const md = formatFreeMarkdown(result.entry!);
    expect(md).toContain('**Affected:** WordPress ≥ 6.4.0');
  });
});

// ---------------------------------------------------------------------------
// 2b: WP-CLI guard — env-independent short-circuit
// ---------------------------------------------------------------------------

describe('detectFromWpCli', () => {
  it('returns null on non-WP dir without spawning wp (looksLikeWordPress guard fires)', () => {
    // non-woo fixture has no wp-load.php and no wp-content → guard short-circuits
    const result = detectFromWpCli(join(fixturesDir, 'non-woo'));
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2c: composer constraint variants
// ---------------------------------------------------------------------------

describe('detectFromComposer — constraint variants', () => {
  function makeComposerDir(composerJson: object): string {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-composer-'));
    writeFileSync(join(dir, 'composer.json'), JSON.stringify(composerJson));
    return dir;
  }

  it('parses tilde constraint ~8.5 → base version 8.5', () => {
    const dir = makeComposerDir({ require: { 'woocommerce/woocommerce': '~8.5' } });
    const result = detectFromComposer(dir);
    expect(result?.version).toBe('8.5');
  });

  it('parses gte constraint >=8.0 → base version 8.0', () => {
    const dir = makeComposerDir({ require: { 'woocommerce/woocommerce': '>=8.0' } });
    const result = detectFromComposer(dir);
    expect(result?.version).toBe('8.0');
  });

  it('parses exact constraint 8.5.1 → base version 8.5.1', () => {
    const dir = makeComposerDir({ require: { 'woocommerce/woocommerce': '8.5.1' } });
    const result = detectFromComposer(dir);
    expect(result?.version).toBe('8.5.1');
  });

  it('detects woocommerce placed in require-dev', () => {
    const dir = makeComposerDir({ 'require-dev': { 'woocommerce/woocommerce': '^8.5' } });
    const result = detectFromComposer(dir);
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('woocommerce');
    expect(result?.version).toBe('8.5');
  });
});

// ---------------------------------------------------------------------------
// 2d: directory detector — Bedrock path
// ---------------------------------------------------------------------------

describe('detectFromDirectory — Bedrock layout', () => {
  it('detects WooCommerce 8.7.2 from bedrock-woo fixture (web/app/plugins path)', () => {
    const result = detectFromDirectory(join(fixturesDir, 'bedrock-woo'));
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('woocommerce');
    expect(result?.version).toBe('8.7.2');
    expect(result?.source).toBe('directory');
  });
});

// ---------------------------------------------------------------------------
// composer.lock absent (wordpress-dependencies pattern)
// ---------------------------------------------------------------------------

describe('detectFromGitTracked — composer.lock absent', () => {
  function initWithComposerJson(dir: string): void {
    spawnSync('git', ['init'], { cwd: dir, timeout: 5000, encoding: 'utf8' });
    writeFileSync(join(dir, 'composer.json'), JSON.stringify({ require: { 'vendor/pkg': '^1.0' } }));
    spawnSync('git', ['add', 'composer.json'], { cwd: dir, timeout: 5000, encoding: 'utf8' });
  }

  it('returns wordpress-dependencies when composer.json is tracked and composer.lock is absent', () => {
    if (!gitAvailable()) return;
    const dir = mkdtempSync(join(tmpdir(), 'lumo-composer-lock-'));
    initWithComposerJson(dir);
    // composer.lock intentionally NOT created or tracked
    const result = detectFromGitTracked(dir);
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('wordpress-dependencies');
    expect(result?.source).toBe('git');
  });

  it('returns null (no match) when both composer.json AND composer.lock are tracked', () => {
    if (!gitAvailable()) return;
    const dir = mkdtempSync(join(tmpdir(), 'lumo-both-tracked-'));
    initWithComposerJson(dir);
    // composer.lock present and tracked — correct state, must NOT fire
    writeFileSync(join(dir, 'composer.lock'), JSON.stringify({ packages: [] }));
    spawnSync('git', ['add', 'composer.lock'], { cwd: dir, timeout: 5000, encoding: 'utf8' });
    const result = detectFromGitTracked(dir);
    // env-in-git and wordpress-dependencies should both be null; result may be null
    expect(result?.pattern ?? null).not.toBe('wordpress-dependencies');
  });
});

describe('detectStack — composer.lock absent fires wordpress-dependencies', () => {
  it('returns { pattern: wordpress-dependencies, source: git } when composer.json tracked, composer.lock absent', () => {
    if (!gitAvailable()) return;
    const dir = mkdtempSync(join(tmpdir(), 'lumo-stack-composer-'));
    spawnSync('git', ['init'], { cwd: dir, timeout: 5000, encoding: 'utf8' });
    writeFileSync(join(dir, 'composer.json'), JSON.stringify({ require: { 'vendor/pkg': '^1.0' } }));
    spawnSync('git', ['add', 'composer.json'], { cwd: dir, timeout: 5000, encoding: 'utf8' });
    const result = detectStack(dir);
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('wordpress-dependencies');
    expect(result?.source).toBe('git');
  });
});

describe('auditProject — missing composer.lock end-to-end', () => {
  it('detected:true, slug missing-composer-lock-file, renders the entry', async () => {
    if (!gitAvailable()) return;
    const dir = mkdtempSync(join(tmpdir(), 'lumo-audit-composer-'));
    spawnSync('git', ['init'], { cwd: dir, timeout: 5000, encoding: 'utf8' });
    writeFileSync(join(dir, 'composer.json'), JSON.stringify({ require: { 'vendor/pkg': '^1.0' } }));
    spawnSync('git', ['add', 'composer.json'], { cwd: dir, timeout: 5000, encoding: 'utf8' });
    const result = auditProject(dir);
    expect(result.detected).toBe(true);
    expect(result.entry?.slug).toBe('missing-composer-lock-file');
    const { formatFreeMarkdown } = await import('../src/lib/render.js');
    const md = formatFreeMarkdown(result.entry!);
    expect(md).toContain('composer.lock');
    expect(md).toContain('**Affected:** all supported versions');
  });
});

// ---------------------------------------------------------------------------
// hardcoded-secrets (heuristic via sourceSignals)
// ---------------------------------------------------------------------------

describe('detectFromSource — hardcoded-secrets', () => {
  it('detects hardcoded-secrets when PHP source contains sk_live_ prefix', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-hc-secrets-'));
    writeFileSync(
      join(dir, 'gateway.php'),
      "<?php\n$key = 'sk_live_abcdef1234567890';\n",
    );
    const result = detectFromSource(dir);
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('hardcoded-secrets');
    expect(result?.source).toBe('heuristic');
  });

  it('returns null for a clean PHP file with no secret signals', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-hc-clean-'));
    writeFileSync(join(dir, 'functions.php'), '<?php\n$key = getenv("API_KEY");\n');
    const result = detectFromSource(dir);
    expect(result).toBeNull();
  });
});

describe('detectStack — hardcoded-secrets heuristic', () => {
  it('returns { pattern: hardcoded-secrets, source: heuristic } for PHP with sk_live_ key', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-stack-hc-'));
    writeFileSync(
      join(dir, 'plugin.php'),
      "<?php\ndefine('STRIPE_KEY', 'sk_live_realkey1234');\n",
    );
    const result = detectStack(dir);
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('hardcoded-secrets');
    expect(result?.source).toBe('heuristic');
  });
});

describe('auditProject — hardcoded-secrets end-to-end', () => {
  it('detected:true, slug hardcoded-api-keys-secrets, renders the entry', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-audit-hc-'));
    writeFileSync(
      join(dir, 'config.php'),
      "<?php\n$token = 'ghp_abc123ExampleToken';\n",
    );
    const result = auditProject(dir);
    expect(result.detected).toBe(true);
    expect(result.entry?.slug).toBe('hardcoded-api-keys-secrets');
    const { formatFreeMarkdown } = await import('../src/lib/render.js');
    const md = formatFreeMarkdown(result.entry!);
    expect(md).toContain('API keys');
    expect(md).toContain('**Affected:** all supported versions');
  });
});

// ---------------------------------------------------------------------------
// Pro-teaser: premium agency plugins
// ---------------------------------------------------------------------------

describe('buildProTeaser', () => {
  it('returns a measured, factual teaser with the plugin name', () => {
    const msg = buildProTeaser('Advanced Custom Fields Pro');
    expect(msg).toContain('Advanced Custom Fields Pro');
    expect(msg).toContain('Lumo Pro');
    expect(msg).not.toContain('undefined');
  });

  it('names the consequence — stale training data — before the upgrade pitch', () => {
    const msg = buildProTeaser('Gravity Forms');
    expect(msg).toContain('stale');
    // The stale-data consequence must appear before the "Lumo Pro extends" sentence.
    const staleIdx = msg.indexOf('stale');
    const proIdx = msg.indexOf('Lumo Pro extends');
    expect(staleIdx).toBeGreaterThan(-1);
    expect(proIdx).toBeGreaterThan(-1);
    expect(staleIdx).toBeLessThan(proIdx);
  });

  it('states Free cannot check the plugin — honest scope of the Free agent', () => {
    const msg = buildProTeaser('Elementor Pro');
    expect(msg).toContain("can't check it");
  });

  it('lists the Pro-covered commercial plugin stack', () => {
    const msg = buildProTeaser('Meta Box');
    // The closing list names the actual Pro-covered plugins
    expect(msg).toContain('ACF Pro');
    expect(msg).toContain('Gravity Forms');
    expect(msg).toContain('Elementor Pro');
    expect(msg).toContain('Carbon Fields');
  });

  it('names the "no free or official skill" fact — the structural wedge', () => {
    const msg = buildProTeaser('Carbon Fields');
    expect(msg.toLowerCase()).toContain('official');
  });
});

describe('buildDetectionNote', () => {
  it('returns an honest note with plugin name but no upgrade promise', () => {
    const msg = buildDetectionNote('WPBakery Page Builder');
    expect(msg).toContain('WPBakery Page Builder');
    expect(msg).not.toContain('Lumo Pro');
    expect(msg).toContain('does not yet have curated knowledge');
  });
});

describe('detectFromDirectory — ACF Pro fixture', () => {
  it('detects premium-acf-pro from directory with version 6.8.4', () => {
    const result = detectFromDirectory(join(fixturesDir, 'acf-pro'));
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('premium-acf-pro');
    expect(result?.version).toBe('6.8.4');
    expect(result?.source).toBe('directory');
  });
});

describe('detectFromDirectory — Gravity Forms fixture', () => {
  it('detects premium-gravity-forms from directory with version 2.10.4', () => {
    const result = detectFromDirectory(join(fixturesDir, 'gravity-forms'));
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('premium-gravity-forms');
    expect(result?.version).toBe('2.10.4');
    expect(result?.source).toBe('directory');
  });
});

describe('detectFromDirectory — Elementor Pro fixture', () => {
  it('detects premium-elementor-pro from directory with version 3.35.1', () => {
    const result = detectFromDirectory(join(fixturesDir, 'elementor-pro'));
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('premium-elementor-pro');
    expect(result?.version).toBe('3.35.1');
    expect(result?.source).toBe('directory');
  });
});

describe('auditProject — Pro teaser path (covered plugins: upgrade promise is honest)', () => {
  it('detected:true, proTeaser set, no entry for ACF Pro fixture', () => {
    const result = auditProject(join(fixturesDir, 'acf-pro'));
    expect(result.detected).toBe(true);
    expect(result.proTeaser).toBeDefined();
    expect(result.proTeaser).toContain('Advanced Custom Fields Pro');
    expect(result.proTeaser).toContain('Lumo Pro');
    expect(result.detectionNote).toBeUndefined();
    expect(result.entry).toBeUndefined();
  });

  it('detected:true, proTeaser set for Gravity Forms fixture', () => {
    const result = auditProject(join(fixturesDir, 'gravity-forms'));
    expect(result.detected).toBe(true);
    expect(result.proTeaser).toBeDefined();
    expect(result.proTeaser).toContain('Gravity Forms');
    expect(result.detectionNote).toBeUndefined();
    expect(result.entry).toBeUndefined();
  });

  it('detected:true, proTeaser set for Elementor Pro fixture', () => {
    const result = auditProject(join(fixturesDir, 'elementor-pro'));
    expect(result.detected).toBe(true);
    expect(result.proTeaser).toBeDefined();
    expect(result.proTeaser).toContain('Elementor Pro');
    expect(result.detectionNote).toBeUndefined();
    expect(result.entry).toBeUndefined();
  });
});

describe('auditProject — honest detection note (uncovered plugins: no upgrade promise)', () => {
  it('detected:true, detectionNote set, no proTeaser for WPBakery fixture', () => {
    const result = auditProject(join(fixturesDir, 'wpbakery'));
    expect(result.detected).toBe(true);
    // Must NOT carry an upgrade promise — no Pro coverage yet
    expect(result.proTeaser).toBeUndefined();
    // Must carry an honest detection note instead
    expect(result.detectionNote).toBeDefined();
    expect(result.detectionNote).toContain('WPBakery Page Builder');
    expect(result.detectionNote).not.toContain('Lumo Pro');
    expect(result.entry).toBeUndefined();
  });
});

describe('detectFromDirectory — WC Subscriptions fixture', () => {
  it('detects premium-wc-subscriptions from directory with version 6.3.0', () => {
    const result = detectFromDirectory(join(fixturesDir, 'wc-subscriptions'));
    expect(result).not.toBeNull();
    expect(result?.pattern).toBe('premium-wc-subscriptions');
    expect(result?.version).toBe('6.3.0');
    expect(result?.source).toBe('directory');
  });
});

describe('auditProject — WC Subscriptions Pro teaser (covered: upgrade promise is honest)', () => {
  it('detected:true, proTeaser set, no Free entry for wc-subscriptions fixture', () => {
    const result = auditProject(join(fixturesDir, 'wc-subscriptions'));
    expect(result.detected).toBe(true);
    expect(result.proTeaser).toBeDefined();
    expect(result.proTeaser).toContain('WooCommerce Subscriptions');
    expect(result.proTeaser).toContain('Lumo Pro');
    expect(result.detectionNote).toBeUndefined();
    expect(result.entry).toBeUndefined();
  });
});

describe('detectStack — Pro-teaser patterns do not shadow Free patterns (ladder precedence)', () => {
  it('WooCommerce composer key wins over any subsequent pro-teaser directory path', () => {
    // composer-woo has a WooCommerce composer.json — ladder stops at composer rung
    const result = detectStack(join(fixturesDir, 'composer-woo'));
    expect(result?.pattern).toBe('woocommerce');
    expect(result?.source).toBe('composer');
  });

  it('classic-wp WooCommerce directory wins before pro-teaser patterns', () => {
    // classic-wp has wp-content/plugins/woocommerce — detected at directory rung
    const result = detectStack(join(fixturesDir, 'classic-wp'));
    expect(result?.pattern).toBe('woocommerce');
    expect(result?.source).toBe('directory');
  });
});

describe('auditProject — Pro-teaser does not bleed into WooCommerce result', () => {
  it('composer-woo fixture still returns woocommerce entry, no proTeaser', () => {
    const result = auditProject(join(fixturesDir, 'composer-woo'));
    expect(result.detected).toBe(true);
    expect(result.entry?.slug).toBe('woocommerce-hpos-order-access');
    expect(result.proTeaser).toBeUndefined();
  });
});
