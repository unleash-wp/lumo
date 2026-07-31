/**
 * Tool handler logic — pure functions, no transport dependency.
 * Factored out so vitest can test them without a live MCP server.
 */

import { loadSnapshot, findEntry, findByCategory } from '../lib/snapshot.js';
import {
  renderFree,
  formatFreeMarkdown,
  formatCatch,
  CATCH_NEUTRAL_LINE,
  buildCodeProTeaser,
  buildCodeProGapLine,
  buildCodeDetectionNote,
  joinPluginNames,
  UPGRADE_PROMPT_BLOCK,
  FRESHNESS_REVEAL_LINE,
  PRO_MCP_ADD_LINE,
  catchInputTruncatedLine,
  catchHitsOmittedLine,
} from '../lib/render.js';
import { isUpgradePromptEnabled, getCheckoutUrl, buildCheckoutUrl } from '../lib/config.js';
import type { Snapshot, SnapshotEntry } from '../types.js';
import type { CatchResult } from '../detection/catch.js';
import { INPUT_LINE_CAP } from '../detection/catch.js';
import { proTopicFor, buildProTopicTeaser } from '../lib/pro-topics.js';

const NOT_FOUND_AUDIT =
  'No known WordPress risk patterns detected in this project. Nothing to check here.';

const NOT_FOUND_LOOKUP = (query: string) => {
  // A miss on a Pro-covered topic is not a miss — it is the paywall. Saying
  // "nothing found" to someone who just typed "HPOS" both misleads (Lumo does
  // know this) and wastes the highest-intent moment the free tier ever gets.
  const proTopic = proTopicFor(query);
  if (proTopic) return buildProTopicTeaser(proTopic);
  return `No curated entry found for "${query}" in the snapshot.`;
};

// ---------------------------------------------------------------------------
// lumo_audit handler
// ---------------------------------------------------------------------------

export interface AuditHandlerInput {
  project_root?: string;
}

/**
 * Run the pattern-detection audit against `project_root` (defaults to process.cwd()).
 * Returns Free-tier Markdown on detection; neutral message otherwise.
 * Never throws.
 */
export async function handleAudit(input: AuditHandlerInput): Promise<string> {
  const root = input.project_root?.trim() || process.cwd();
  try {
    // Dynamic import keeps the MCP server startup fast and avoids pulling
    // detection deps into the type boundary at the top of this module.
    const { auditProject } = await import('../detection/index.js');
    const result = auditProject(root);
    if (result.detected && result.entry) {
      return formatFreeMarkdown(result.entry);
    }
    if (result.detected && result.proTeaser) {
      return result.proTeaser;
    }
    if (result.detected && result.detectionNote) {
      return result.detectionNote;
    }
    return result.message ?? NOT_FOUND_AUDIT;
  } catch {
    return NOT_FOUND_AUDIT;
  }
}

// ---------------------------------------------------------------------------
// lumo_lookup handler
// ---------------------------------------------------------------------------

export interface LookupHandlerInput {
  slug?: string;
  category?: string;
  /** Free-text search over the snapshot. Returns a ranked shortlist, not a full entry. */
  query?: string;
}

// Deterministic scoring, ported 1:1 from the ai-forge adapter (server.mjs
// scoreEntry) so both lookup surfaces rank identically: slug 4, title 3,
// category 2, summary 1 per matched term.
function scoreEntry(entry: SnapshotEntry, terms: string[]): number {
  const slug = entry.slug.toLowerCase();
  const title = entry.title.toLowerCase();
  const summary = (entry.summary || '').toLowerCase();
  const category = (entry.category_slug || '').toLowerCase();
  let score = 0;
  for (const t of terms) {
    if (slug.includes(t)) score += 4;
    if (title.includes(t)) score += 3;
    if (category.includes(t)) score += 2;
    if (summary.includes(t)) score += 1;
  }
  return score;
}

/**
 * Ranked shortlist for a free-text query. Top 5, each as slug + title + first
 * summary sentence — enough to pick, small enough to stay cheap. The second
 * call then fetches the full entry by slug. Searches ONLY the Free snapshot;
 * a miss on a Pro topic goes through the same honest teaser as a slug miss.
 */
function searchEntries(snap: Snapshot, query: string): string {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  if (terms.length === 0) return NOT_FOUND_LOOKUP(query);

  const ranked = snap.entries
    .map((e) => ({ e, score: scoreEntry(e, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.e.slug.localeCompare(b.e.slug))
    .slice(0, 5);

  if (ranked.length === 0) return NOT_FOUND_LOOKUP(query);

  const lines = ranked.map(({ e }) => {
    const firstSentence = (e.summary || '').split(/(?<=\.)\s/)[0] ?? '';
    return `- \`${e.slug}\`: ${e.title}\n  ${firstSentence}`;
  });
  return [
    `Top matches for "${query}" (call lumo_lookup with the slug for the full entry):`,
    '',
    ...lines,
  ].join('\n');
}

/**
 * Look up a Free-tier snapshot entry by slug or category slug.
 * Returns Free-tier Markdown on match; neutral message otherwise.
 * Never throws.
 */
export async function handleLookup(
  input: LookupHandlerInput,
  snapshot?: Snapshot,
): Promise<string> {

  try {
    const snap = snapshot ?? loadSnapshot();

    if (input.slug) {
      const entry = findEntry(snap, input.slug.trim());
      if (entry) {
        return formatFreeMarkdown(renderFree(entry));
      }
      return NOT_FOUND_LOOKUP(input.slug);
    }

    if (input.category) {
      const entries = findByCategory(snap, input.category.trim());
      if (entries.length > 0 && entries[0] != null) {
        return formatFreeMarkdown(renderFree(entries[0]));
      }
      return NOT_FOUND_LOOKUP(input.category);
    }

    if (input.query) {
      return searchEntries(snap, input.query.trim());
    }

    return 'Provide a "slug", a "category", or a free-text "query" to look up an entry.';
  } catch {
    return 'Snapshot unavailable. Cannot look up entries right now.';
  }
}

// ---------------------------------------------------------------------------
// lumo_check_code handler
// ---------------------------------------------------------------------------

export interface CheckCodeHandlerInput {
  code: string;
  language?: 'php' | 'js' | 'auto';
  /** The project's target WordPress version, e.g. '6.9'. Takes priority over project_root detection. */
  wp_version?: string;
  /** The project's target WooCommerce version, e.g. '8.5'. Takes priority over project_root detection. */
  woo_version?: string;
  /** Absolute path to the project root. Used to auto-detect wp/woo version when explicit versions are absent. */
  project_root?: string;
}

/**
 * Scan a raw code blob (or unified diff) for WordPress/WooCommerce patterns that
 * broke in a specific version. Returns ranked catch results (LOUD before SOFT) or
 * a neutral line when nothing fires.
 *
 * When wp_version/woo_version are provided (or derivable from project_root),
 * each LOUD result gains a relative-version line showing whether the project
 * is already past the breaking version or heading toward it.
 *
 * Never throws.
 */
/**
 * Machine-readable verdict alongside the prose — same law as the Pro server
 * (P2): a verdict is data, prose is presentation.
 *
 * `computed` is the layer's own honesty marker (product-gate condition): the
 * counts come from the SAME engine pass that produced the text, and when the
 * pipeline fell into its fail-open path, computed is false — a client must
 * treat that as "not computed", never as "checked, nothing found". Without the
 * marker, a degraded empty verdict is indistinguishable from a clean one,
 * which is the false all-clear moved into the data channel.
 */
export interface CheckCodeVerdict {
  text: string;
  /** False = the structured layer did not run; decide nothing from the fields below. */
  computed: boolean;
  /**
   * False = the scan hit one of its own limits: the input was read only to the
   * line cap, or more matches were found than the report holds. Separate from
   * `computed` on purpose. The findings that did come back are real, so folding
   * this into `computed` would tell a caller to discard a genuine LOUD finding
   * because the tail of the file went unread. The text names which limit bit.
   */
  complete: boolean;
  found: boolean;
  loudCount: number;
  softCount: number;
  gaps: Array<{ plugin: string; proCovers: boolean }>;
}

export async function handleCheckCode(
  input: CheckCodeHandlerInput,
  snapshot?: Snapshot,
): Promise<string> {
  return (await handleCheckCodeFull(input, snapshot)).text;
}

export async function handleCheckCodeFull(
  input: CheckCodeHandlerInput,
  snapshot?: Snapshot,
): Promise<CheckCodeVerdict> {
  try {
    const { checkCodeWithGaps } = await import('../detection/catch.js');
    const snap = snapshot ?? loadSnapshot();
    const { results, proGaps, inputTruncated, hitsOmitted } = checkCodeWithGaps(
      input.code ?? '',
      input.language ?? 'auto',
      snap,
    );
    // Appended to every answer that reports a result. A truncated blob that
    // matched nothing is not a clean blob, and a capped report is not the whole
    // report; without these lines both read as complete.
    const limits: string[] = [];
    if (inputTruncated) limits.push(catchInputTruncatedLine(INPUT_LINE_CAP));
    if (hitsOmitted > 0) limits.push(catchHitsOmittedLine(hitsOmitted));
    const withLimits = (text: string): string => [text, ...limits].join('\n\n');
    const covered = proGaps.filter((g) => g.hasProCoverage).map((g) => g.pluginName);
    const uncovered = proGaps.filter((g) => !g.hasProCoverage).map((g) => g.pluginName);
    // Same pass, same truth: text and data can never diverge.
    const verdict = (text: string): CheckCodeVerdict => ({
      text: withLimits(text),
      computed: true,
      complete: limits.length === 0,
      found: results.length > 0 || proGaps.length > 0,
      loudCount: results.filter((r) => r.tier === 'LOUD').length,
      softCount: results.filter((r) => r.tier === 'SOFT').length,
      gaps: proGaps.map((g) => ({ plugin: g.pluginName, proCovers: g.hasProCoverage })),
    });

    if (results.length === 0) {
      // Signals fired into Pro-only knowledge: name EVERY touched plugin
      // instead of the neutral line — silence on the second plugin is the same
      // false all-clear as silence on the first.
      if (proGaps.length > 0) {
        const parts: string[] = [];
        if (covered.length > 0) parts.push(buildCodeProTeaser(joinPluginNames(covered)));
        if (uncovered.length > 0) parts.push(buildCodeDetectionNote(joinPluginNames(uncovered)));
        return verdict(parts.join('\n\n'));
      }
      return verdict(CATCH_NEUTRAL_LINE);
    }

    // Resolve project versions: explicit params > auto-detect from project_root > none.
    // Fail-open: any error leaves the versions undefined (no version line emitted).
    let resolvedWp: string | undefined = input.wp_version?.trim() || undefined;
    let resolvedWoo: string | undefined = input.woo_version?.trim() || undefined;

    if ((!resolvedWp || !resolvedWoo) && input.project_root) {
      try {
        const { detectStack } = await import('../detection/index.js');
        const detection = detectStack(input.project_root);
        if (detection?.version) {
          const isWoo = detection.pattern === 'woocommerce';
          if (isWoo && !resolvedWoo) resolvedWoo = detection.version;
          if (!isWoo && !resolvedWp) resolvedWp = detection.version;
        }
      } catch {
        // fail-open — no version line for this result
      }
    }

    const body = results
      .map((r) => {
        // Select the version that matches this result's versionFact field.
        const projectVersion =
          r.versionFact?.field === 'woo' ? resolvedWoo : resolvedWp;
        return formatCatch(r, projectVersion);
      })
      .join('\n\n---\n\n');

    // A Pro-only signal fired alongside the findings. Without this line the
    // answer looks complete while a whole plugin went unchecked — the same false
    // all-clear as silence, only harder to notice.
    const withGap =
      proGaps.length > 0
        ? `${body}\n\n${buildCodeProGapLine(joinPluginNames(proGaps.map((g) => g.pluginName)))}`
        : body;

    // Upgrade prompt fires first (LOUD + URL configured); freshness reveal fires
    // when the upgrade prompt does NOT (avoids double-printing on the same response).
    const withPrompt = appendUpgradePrompt(withGap, results);
    const upgradePromptFired = withPrompt !== withGap;
    if (upgradePromptFired) {
      return verdict(withPrompt);
    }
    return verdict(appendFreshnessReveal(withPrompt, results, snap?.generatedAt));
  } catch {
    // Fail-open path: the prose still answers, and the marker says the layer
    // did NOT run — never dress this as a clean verdict.
    return {
      text: CATCH_NEUTRAL_LINE,
      computed: false,
      complete: false,
      found: false,
      loudCount: 0,
      softCount: 0,
      gaps: [],
    };
  }
}

// ---------------------------------------------------------------------------
// Upgrade prompt — appended to a catch response at the highest-intent moment:
// at least one LOUD result fired. Gated three ways so it never surfaces a dead
// buy-link or an unwanted nag:
//   1. at least one LOUD result (any domain — WooCommerce, Block Editor, Core),
//   2. the upgrade prompt is enabled (kill-switch, default on),
//   3. a real checkout URL is configured — the built-in default does not
//      resolve, so an unset LUMO_CHECKOUT_URL must never print a "Get it: <url>"
//      line. Output is byte-identical to baseline when the URL is unset.
// ---------------------------------------------------------------------------

/**
 * Map a snapshot category_slug to the human-readable label used in the upgrade
 * prompt copy. Falls back to a generic "WordPress" label for unmapped slugs so
 * new catch categories never break the prompt.
 */
function domainLabel(categorySlug: string): string {
  const labels: Record<string, string> = {
    woocommerce: 'WooCommerce',
    gutenberg: 'Block Editor',
    'wordpress-core': 'WordPress Core',
    'wordpress-7-0': 'WordPress Core',
    'wp-abilities-api': 'WordPress Core',
    'hardcoded-secrets': 'WordPress',
    'env-in-git': 'WordPress',
    'wordpress-dependencies': 'WordPress',
  };
  return labels[categorySlug] ?? 'WordPress';
}

function appendUpgradePrompt(body: string, results: CatchResult[]): string {
  const loudResults = results.filter((r) => r.tier === 'LOUD');
  const checkoutConfigured = (process.env['LUMO_CHECKOUT_URL'] ?? '').trim().length > 0;

  if (loudResults.length === 0 || !isUpgradePromptEnabled() || !checkoutConfigured) {
    return body;
  }

  // Derive a domain label from the first LOUD result. When multiple domains are
  // present we use the first (LOUD results are already sorted highest-tier first).
  const primarySlug = loudResults[0]!.entry.category_slug;
  const domain = domainLabel(primarySlug);
  const risks = loudResults.length === 1 ? 'risk' : 'risks';

  const checkoutUrl = buildCheckoutUrl(getCheckoutUrl(), {
    source: 'catch',
    gatedCount: loudResults.length,
    promptVariant: 'block',
  });
  const prompt = UPGRADE_PROMPT_BLOCK
    .replace('{N}', String(loudResults.length))
    .replace('{risks}', risks)
    .replace('{domain}', domain)
    .replace('{checkout_url}', checkoutUrl);
  return `${body}\n\n---\n\n${prompt}`;
}

// ---------------------------------------------------------------------------
// Freshness-gap reveal — C4
//
// Appended when a catch fires (any tier) BUT the upgrade prompt block did not
// fire on the same response (no double-printing). Gated on the same kill-switch
// so `LUMO_UPGRADE_PROMPT=off` suppresses both.
//
// The MCP add instruction is always inert-safe: it is a reference to the Pro
// server, which validates the license key at query time. No URL gate required —
// nothing breaks if the server is not yet live.
// ---------------------------------------------------------------------------

/**
 * Append the freshness-gap reveal line when: catch results are present, the
 * kill-switch is on, and the upgrade prompt block did NOT already fire.
 *
 * `snapshotDate` — the ISO generatedAt from the loaded snapshot. Substituted
 * into the template; falls back to "June 2025" if unavailable (extremely rare).
 */
function appendFreshnessReveal(
  body: string,
  results: CatchResult[],
  snapshotDate: string | undefined,
): string {
  if (results.length === 0 || !isUpgradePromptEnabled()) {
    return body;
  }

  const dateStr = snapshotDate ? snapshotDate.slice(0, 10) : 'June 2025';
  let reveal = FRESHNESS_REVEAL_LINE.replace('{date}', dateStr);

  // Only name an endpoint the reader can actually reach (same rule as the
  // checkout link). Unset → the freshness sentence stands alone.
  const proUrl = (process.env['LUMO_PRO_MCP_URL'] ?? '').trim();
  if (proUrl) {
    reveal += `\n\n${PRO_MCP_ADD_LINE.replace('{url}', proUrl)}`;
  }
  return `${body}\n\n---\n\n${reveal}`;
}
