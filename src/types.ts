// Shared type contracts for the Free Agent.
//
// Mirrored by contract from lumo-pro — copy field names/shape, do NOT import.
// Source: unleash-wp/lumo-pro src/knowledge/hpos-content.ts + src/knowledge/lookup.ts
// (as of the initial W0 seed; update when the Pro contract changes).
//
// snake_case keys match the DB columns and the JSON snapshot format so the
// generator, loader, and renderer share one canonical shape without a mapping
// step. See docs/tech-decisions.md D5-a for the casing rationale.

/** A single version constraint row for a knowledge entry. */
export interface SnapshotVersion {
  wp_version_min: string | null;
  wp_version_max: string | null;
  woo_version_min: string | null;
  breaking_change: boolean;
}

/**
 * One entry in data/snapshot.json — the Free projection of a published entry.
 * Fields are the allow-listed Free subset; `body` is NEVER present.
 * tier is always "free" in a valid snapshot artifact.
 */
export interface SnapshotEntry {
  slug: string;
  title: string;
  /** Routing key: maps a detected plugin to this entry (e.g. "woocommerce"). */
  category_slug: string;
  /** The Free answer — byte-identical to the Pro summary column. */
  summary: string;
  /** The correct code pattern; ships with Free (wrong-vs-correct is the value). */
  code_example: string;
  /** The wrong pattern the correct one replaces. */
  bad_pattern: string;
  /** Public canonical source URL; safe to redistribute in Free. */
  source_url: string;
  /** Verification step the dev can run after applying the fix. */
  test_step: string;
  tier: 'free';
  /** Per-entry source freshness; distinct from envelope generatedAt. */
  updatedAt: string;
  versions: SnapshotVersion[];
}

/** Top-level envelope for data/snapshot.json. */
export interface Snapshot {
  schemaVersion: 1;
  /**
   * Sourced from max(updatedAt) across entries — deterministic, not wall-clock,
   * so re-running on unchanged content produces an identical file.
   */
  generatedAt: string;
  source: {
    repo: string;
    db: string;
  };
  entries: SnapshotEntry[];
}

// ---------------------------------------------------------------------------
// Tool-signature contracts — mirror the MCP tool surface in lumo-pro.
// Source: unleash-wp/lumo-pro src/mcp/tools.ts (wp_lookup, wp_plugin_advice).
// ---------------------------------------------------------------------------

/** Input shape for the wp_lookup tool. */
export interface WpLookupInput {
  slug: string;
  tier?: 'free' | 'pro';
}

/** Input shape for the wp_plugin_advice tool. */
export interface WpPluginAdviceInput {
  plugin_slug: string;
  woo_version?: string;
}

/** Free-tier rendered response returned by the local snapshot loader. */
export interface FreeRenderedEntry {
  slug: string;
  title: string;
  tier: 'free';
  summary: string;
  code_example: string;
  bad_pattern: string;
  source_url: string;
  test_step: string;
  versions: SnapshotVersion[];
  /** ISO date this entry was last verified-current; rendered as the freshness line. */
  verifiedAt: string;
  /** Quiet depth reveal — appended after the Free answer, never a hard block. */
  upgradeHint: string;
}
