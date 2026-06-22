/**
 * Tool handler logic — pure functions, no transport dependency.
 * Factored out so vitest can test them without a live MCP server.
 */

import { loadSnapshot, findEntry, findByCategory } from '../lib/snapshot.js';
import { renderFree, formatFreeMarkdown, formatCatch, CATCH_NEUTRAL_LINE } from '../lib/render.js';
import type { Snapshot } from '../types.js';

const NOT_FOUND_AUDIT =
  'No known WordPress risk patterns detected in this project — nothing to check here.';

const NOT_FOUND_LOOKUP = (query: string) =>
  `No curated entry found for "${query}" in the snapshot.`;

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

    return 'Provide either a "slug" or a "category" to look up an entry.';
  } catch {
    return 'Snapshot unavailable — cannot look up entries right now.';
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
export async function handleCheckCode(
  input: CheckCodeHandlerInput,
  snapshot?: Snapshot,
): Promise<string> {
  try {
    const { checkCode } = await import('../detection/catch.js');
    const results = checkCode(input.code ?? '', input.language ?? 'auto', snapshot);

    if (results.length === 0) {
      return CATCH_NEUTRAL_LINE;
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

    return results
      .map((r) => {
        // Select the version that matches this result's versionFact field.
        const projectVersion =
          r.versionFact?.field === 'woo' ? resolvedWoo : resolvedWp;
        return formatCatch(r, projectVersion);
      })
      .join('\n\n---\n\n');
  } catch {
    return CATCH_NEUTRAL_LINE;
  }
}
