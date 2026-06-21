import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectFromComposer } from '../src/detection/composer.js';
import { detectFromDirectory } from '../src/detection/directory.js';
import { detectFromWpCli } from '../src/detection/wp-cli.js';
import { detectFromSource } from '../src/detection/heuristic.js';
import { detectStack, auditProject } from '../src/detection/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

// ---------------------------------------------------------------------------
// FA-10: composer detector
// ---------------------------------------------------------------------------

describe('detectFromComposer', () => {
  it('detects WooCommerce with version from composer-woo fixture', () => {
    const result = detectFromComposer(join(fixturesDir, 'composer-woo'));
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('woocommerce');
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
    expect(result?.slug).toBe('woocommerce');
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
    expect(result.message).toMatch(/No WooCommerce detected/);
    expect(result.entry).toBeUndefined();
  });

  it('returns detected:false + neutral message on non-woo fixture — no throw', () => {
    expect(() => auditProject(join(fixturesDir, 'non-woo'))).not.toThrow();
    const result = auditProject(join(fixturesDir, 'non-woo'));
    expect(result.detected).toBe(false);
    expect(result.message).toMatch(/No WooCommerce detected/);
  });
});

// ---------------------------------------------------------------------------
// 2a: heuristic detector (detectFromSource)
// ---------------------------------------------------------------------------

describe('detectFromSource', () => {
  it('detects WooCommerce in heuristic-woo fixture (signal in src/)', () => {
    const result = detectFromSource(join(fixturesDir, 'heuristic-woo'));
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('woocommerce');
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
    expect(result?.slug).toBe('woocommerce');
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
    expect(result?.slug).toBe('woocommerce');
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
    expect(result?.slug).toBe('woocommerce');
    expect(result?.version).toBe('8.7.2');
    expect(result?.source).toBe('directory');
  });
});
