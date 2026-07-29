/**
 * Topics whose knowledge lives behind the licence.
 *
 * Pure strings and patterns — no filesystem, no git — so the MCP handlers can
 * import this statically. (`src/detection/index.ts` is loaded dynamically to
 * keep server startup fast; this must not ride along with it.)
 *
 * The rule this encodes: a lookup miss on a Pro-covered topic is not a miss,
 * it is the paywall. Answering "nothing found" to someone who just typed
 * "HPOS" is both untrue — Lumo does know this — and a waste of the
 * highest-intent moment the free tier ever sees.
 */

const PRO_TOPICS: { match: RegExp; name: string }[] = [
  { match: /woo|hpos|shop_order|wc_get/, name: 'WooCommerce' },
  { match: /\bacf\b|advanced.custom.fields/, name: 'ACF' },
  { match: /elementor/, name: 'Elementor' },
  { match: /gravity/, name: 'Gravity Forms' },
  { match: /meta.?box/, name: 'Meta Box' },
  { match: /carbon.?fields/, name: 'Carbon Fields' },
  { match: /contact.?form.?7|\bcf7\b/, name: 'Contact Form 7' },
];

/** Name the Pro topic a query refers to, or null when it is not one. */
export function proTopicFor(query: string): string | null {
  const q = query.toLowerCase();
  return PRO_TOPICS.find((t) => t.match.test(q))?.name ?? null;
}

/**
 * The answer for a direct question about a Pro-covered topic: name what is
 * covered instead of pretending the knowledge does not exist. Mirrors the
 * teaser `lumo_audit` gives when it detects such a plugin in a project, so the
 * two surfaces tell the same story.
 */
export function buildProTopicTeaser(pluginName: string): string {
  return (
    `${pluginName} knowledge is part of Lumo Pro. ` +
    `Lumo Free covers WordPress Core, block and theme APIs, and security fundamentals; ` +
    `${pluginName} is not covered by any free or official WordPress skill set. ` +
    `Lumo Pro adds the premium-plugin catch: ACF Pro, Gravity Forms, Elementor Pro, ` +
    `Meta Box, Carbon Fields, WooCommerce and WooCommerce Subscriptions.`
  );
}
