---
phase: 2
title: Cluster and CSV Emission
status: completed
priority: P1
effort: 4h
dependencies:
  - 1
---

# Phase 2: Cluster and CSV Emission

## Overview

Consume Phase 1 raw JSONs → cluster on 4 axes (style, palette, layout, texture) → synthesize curated rows via LLM summarization → emit 4 committed CSVs that become the runtime knowledge base.

## Requirements

- Functional:
  - `cluster.py` reads `data/poster/analysis/raw/*.json`.
  - Style clustering: attribute-vector cluster (HDBSCAN preferred, k-means fallback), cap 30 clusters, min 3 images/cluster.
  - Palette clustering: quantize all hexes across corpus, dedupe by ΔE < 5, min 15 palettes.
  - Layout clustering: cluster on grid signature + focal anchor + whitespace ratio, min 10 layouts.
  - Texture clustering: tag-grouping on material+finish, min 8 textures.
  - Per cluster: call Gemini text model to summarize → `description`, `when_to_use`, `hints`, `recommendations`, `pairs_with_styles` (for palettes/textures).
  - Emit 4 CSVs to `data/poster/`.
  - Build `shape_pool` per style row by aggregating shape_primitives from member images (dedupe).
- Non-functional:
  - Deterministic — same raw JSONs produce same CSVs (set random_state).
  - Reproducible: keep `data/poster/analysis/clusters.json` audit trail (cluster → member images).

## Architecture

```
cluster.py
  ├─ load_raw()
  ├─ cluster_styles()    → list[StyleCluster]
  ├─ cluster_palettes()  → list[PaletteCluster]
  ├─ cluster_layouts()   → list[LayoutCluster]
  ├─ cluster_textures()  → list[TextureCluster]
  ├─ synthesize_row(cluster) → CSV row (Gemini text call)
  ├─ pair_axes()         → fill pairs_with_styles cross-references
  └─ write_csvs()
```

CSV schemas (final):

- **poster-styles.csv**: `No, Style Name, Category, Keywords, Mood, Description, Specs, Shape Pool, When To Use, Avoid For, Hints, Recommendations, Era`
- **poster-palettes.csv**: `No, Palette Name, Hex Colors, Color Mood, Contrast Level, Pairs With Styles, When To Use`
- **poster-layouts.csv**: `No, Layout Name, Grid System, Focal Anchor, Element Hierarchy, Whitespace Ratio, Best For Content`
- **poster-textures.csv**: `No, Texture Name, Material, Grain/Finish, Effect Description, Pairs With Styles, Rendering Hints`

## Related Code Files

- Create:
  - `.claude/skills/design/scripts/poster/cluster.py`
  - `.claude/skills/design/data/poster/poster-styles.csv`
  - `.claude/skills/design/data/poster/poster-palettes.csv`
  - `.claude/skills/design/data/poster/poster-layouts.csv`
  - `.claude/skills/design/data/poster/poster-textures.csv`
  - `.claude/skills/design/data/poster/analysis/clusters.json` (audit trail)
- Modify: `scripts/poster/core.py` (add clustering helpers, csv writer)

## Implementation Steps

1. Add `scikit-learn`/`hdbscan` to install (or use stdlib k-means; HDBSCAN preferred).
2. Implement vector encoding for style attributes (one-hot keywords + palette stats + layout signature).
3. Run clustering with seed; print silhouette/cluster sizes for sanity.
4. Per cluster: synthesize row via Gemini text call (few-shot from logo/styles.csv tone).
5. Cross-reference `Pairs With Styles` columns by co-occurrence in source images.
6. Write CSVs; write `clusters.json` audit trail.
7. Manual spot-check: open `poster-styles.csv`, verify ≥20 rows, descriptions read sensibly.

## Success Criteria

- [ ] 4 CSVs exist with required column headers.
- [ ] `poster-styles.csv` has 20-30 rows.
- [ ] `poster-palettes.csv` ≥15 rows, `poster-layouts.csv` ≥10 rows, `poster-textures.csv` ≥8 rows.
- [ ] Each style row has ≥4 shape primitives in `Shape Pool`.
- [ ] Cross-axis `Pairs With Styles` columns non-empty.
- [ ] Re-running with same raw JSONs produces byte-identical CSVs.

## Risk Assessment

- **Sparse clusters** (singletons) → enforce `min_cluster_size=3`; reassign outliers to nearest.
- **Monotone descriptions** from LLM → vary temperature; include 3-5 example styles in few-shot.
- **Pairs cross-ref empty** if co-occurrence sparse → fallback to mood-similarity match.
