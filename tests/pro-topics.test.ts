import { describe, it, expect } from 'vitest';
import { proTopicFor, buildProTopicTeaser } from '../src/lib/pro-topics.js';
import { handleLookup } from '../src/mcp/handlers.js';

/**
 * A lookup miss on a Pro-covered topic is the paywall, not a miss.
 *
 * Before this, `lumo_lookup` answered "No curated entry found" to someone who
 * typed "HPOS": untrue (Lumo does know it) and a dead end at the highest-intent
 * moment the free tier gets, while `lumo_audit` on the same project correctly
 * showed the Pro teaser. The two surfaces must tell the same story.
 */

describe('proTopicFor', () => {
  it('recognises the Pro-covered topics by their common names and jargon', () => {
    expect(proTopicFor('woocommerce')).toBe('WooCommerce');
    expect(proTopicFor('HPOS')).toBe('WooCommerce');
    expect(proTopicFor('woocommerce-hpos-order-access')).toBe('WooCommerce');
    expect(proTopicFor('acf')).toBe('ACF');
    expect(proTopicFor('Advanced Custom Fields')).toBe('ACF');
    expect(proTopicFor('elementor')).toBe('Elementor');
    expect(proTopicFor('gravity forms')).toBe('Gravity Forms');
    expect(proTopicFor('meta-box')).toBe('Meta Box');
    expect(proTopicFor('cf7')).toBe('Contact Form 7');
  });

  it('leaves genuinely unknown queries alone: a real miss stays a miss', () => {
    expect(proTopicFor('gibt-es-nicht')).toBeNull();
    expect(proTopicFor('block-theme-currency')).toBeNull();
    expect(proTopicFor('')).toBeNull();
  });

  it('names the topic and what Free still covers, without promising Free has it', () => {
    const text = buildProTopicTeaser('WooCommerce');
    expect(text).toContain('WooCommerce knowledge is part of Lumo Pro');
    expect(text).toContain('Lumo Free covers');
    expect(text).not.toContain('No curated entry found');
  });
});

describe('handleLookup on Pro-covered topics', () => {
  it('answers a WooCommerce category lookup with the Pro teaser, not a dead end', async () => {
    const result = await handleLookup({ category: 'woocommerce' });
    expect(result).toContain('part of Lumo Pro');
    expect(result).not.toContain('No curated entry found');
  });

  it('answers the HPOS slug the same way: the entry exists, it is just licensed', async () => {
    const result = await handleLookup({ slug: 'woocommerce-hpos-order-access' });
    expect(result).toContain('WooCommerce knowledge is part of Lumo Pro');
  });

  it('still reports an honest miss for a query that is genuinely unknown', async () => {
    const result = await handleLookup({ slug: 'no-such-entry-anywhere' });
    expect(result).toContain('No curated entry found');
  });
});
