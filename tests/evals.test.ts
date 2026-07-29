import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleLookup, handleCheckCode } from '../src/mcp/handlers.js';

/**
 * The eval set, executed rather than admired.
 *
 * `evals/free-mcp.xml` is the agent-facing evaluation: ten realistic questions
 * whose answers were captured from the running server. A file like that rots
 * quietly — the snapshot regenerates, an answer silently stops being true, and
 * nobody notices until an eval run blames the model. So the same expectations
 * run here against the handlers on every CI build.
 *
 * This is not a replacement for running the eval harness with a real model
 * (that measures whether an agent can FIND the answer); it guarantees the
 * answers themselves are still correct.
 */

const evalsPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'evals', 'free-mcp.xml');

const DEPRECATED_CALL = "<?php $h = wp_img_tag_add_decoding_attr( $x, 'the_content' );";

describe('evals/free-mcp.xml stays true', () => {
  const xml = readFileSync(evalsPath, 'utf8');

  it('declares exactly ten question/answer pairs', () => {
    expect(xml.match(/<qa_pair>/g)?.length).toBe(10);
  });

  it('every documented answer still appears in the file it claims to describe', () => {
    for (const answer of [
      'wp_img_tag_add_loading_optimization_attrs',
      'validateBlock',
      '@wordpress/interactivity',
    ]) {
      expect(xml).toContain(answer);
    }
  });

  it('names the replacement function for the deprecated image call', async () => {
    const out = await handleCheckCode({ code: DEPRECATED_CALL, language: 'php' });
    expect(out).toContain('wp_img_tag_add_loading_optimization_attrs');
  });

  it('reports the breaking version as 6.4.0', async () => {
    const out = await handleCheckCode({ code: DEPRECATED_CALL, language: 'php' });
    expect(out).toMatch(/broke in WordPress 6\.4\.0/);
  });

  it('names validateBlock for the removed block API', async () => {
    const out = await handleCheckCode({
      code: 'const ok = wp.blocks.isValidBlockContent( a, b, c );',
      language: 'js',
    });
    expect(out).toContain('validateBlock');
  });

  it('stays quiet on the corrected call', async () => {
    const out = await handleCheckCode({
      code: "<?php $h = wp_img_tag_add_loading_optimization_attrs( $x, 'the_content' );",
      language: 'php',
    });
    expect(out).toContain('No WordPress/WooCommerce issues detected');
  });

  it('softens to an advisory behind a function_exists shim', async () => {
    const out = await handleCheckCode({
      code: `<?php if ( function_exists( 'wp_img_tag_add_decoding_attr' ) ) { $h = wp_img_tag_add_decoding_attr( $x, 'c' ); }`,
      language: 'php',
    });
    expect(out).not.toContain('⚠️');
  });

  it('names WooCommerce and ACF as Pro, and a genuine miss as a miss', async () => {
    expect(await handleLookup({ category: 'woocommerce' })).toContain('part of Lumo Pro');
    expect(await handleLookup({ category: 'acf' })).toContain('part of Lumo Pro');
    expect(await handleLookup({ slug: 'definitely-not-a-real-entry' })).toContain(
      'No curated entry found',
    );
  });

  it('serves the WP 7.0 facts the eval asks for', async () => {
    expect(await handleLookup({ slug: 'wp-7-0-php-minimum-7-4' })).toContain('7.4');
    expect(await handleLookup({ slug: 'wp-7-0-interactivity-watch' })).toContain(
      '@wordpress/interactivity',
    );
  });
});
