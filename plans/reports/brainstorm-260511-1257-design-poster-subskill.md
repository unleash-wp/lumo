# Brainstorm — Poster Sub-skill for `design`

**Date:** 2026-05-11 12:57 (Asia/Saigon)
**Branch:** worktree-feat-design-poster-skill
**Status:** Design approved by user.

## Problem Statement

Enhance the unified `ckm:design` skill with poster design capability. AI agents (Claude Code, Codex, OpenClaw) invoke the skill → receive text prompts for image-gen models (Nano Banana 2, GPT Image, etc.) → outputs match the style of 121 reference posters in `test-ck/posters/` but vary in layout, element position, and shape composition while preserving texture/material identity.

## Requirements

- Sibling of `logo`, `cip`, `icon` under `design` skill (built-in sub-skill).
- Build-time vision analysis of all 121 posters → clustered curated knowledge.
- Model-agnostic prompt emission (no API call from `generate.py`).
- "Same style, different output" guaranteed by axis recombination + per-call randomization.

## Decisions (locked)

| Axis | Choice |
|------|--------|
| Knowledge base | Cluster 121 → ~20-30 curated styles |
| Variation method | Text-only prompt with rich variation pools |
| Schema | 4 CSVs: styles, palettes, layouts, **textures** |
| Source refs in CSV | No — text tokens only |
| Analysis timing | Build-time, commit CSVs |
| Default model | Model-agnostic — emit prompt only |

## Final Architecture

```
.claude/skills/design/
├── SKILL.md                          # + Poster section
├── data/poster/
│   ├── poster-styles.csv             # ~20-30 clusters
│   ├── poster-palettes.csv
│   ├── poster-layouts.csv
│   └── poster-textures.csv
├── scripts/poster/
│   ├── analyze.py                    # build-time: 121 imgs → cluster → CSVs
│   ├── search.py                     # --domain {style|palette|layout|texture}
│   ├── generate.py                   # emit text prompt (no API call)
│   └── core.py                       # shared loaders/recombiners
└── references/
    ├── poster-design.md
    └── poster-prompt-engineering.md
```

### CSV Schemas (text only)

- **poster-styles.csv** — `No, Style Name, Category, Keywords, Mood, Description, Specs, When To Use, Avoid For, Hints, Recommendations, Era`
- **poster-palettes.csv** — `No, Palette Name, Hex Colors, Color Mood, Contrast Level, Pairs With Styles, When To Use`
- **poster-layouts.csv** — `No, Layout Name, Grid System, Focal Anchor, Element Hierarchy, Whitespace Ratio, Best For Content`
- **poster-textures.csv** — `No, Texture Name, Material, Grain/Finish, Effect Description, Pairs With Styles, Rendering Hints`

### Build Pipeline (`analyze.py`, runs once)

1. Vision-extract per image via `ai-multimodal` Gemini call → structured JSON (style cues, palette hexes, grid signature, texture/material, mood, shape primitives). Few-shot for schema stability.
2. Cluster:
   - Styles: attribute-vector cluster (HDBSCAN/k-means) → 20-30 groups.
   - Palettes: quantize across full corpus, dedupe by ΔE.
   - Layouts: cluster on grid signatures.
   - Textures: tag-based grouping.
3. Synthesize curated rows (centroid + LLM-summarized description, hints, when-to-use, pairs-with mappings).
4. Write 4 CSVs. Commit. Re-runnable on corpus additions.

### Variation Algorithm (`generate.py`)

```
filter style by keywords/category (user query)
pick style → pick palette (pairs_with) → pick layout (compatible) → pick texture (pairs_with)
variation_seed = {
  element_positions: shuffle(focal + secondary slots),
  shape_set: pick_n(style.shape_pool, 2-4),
  copy_slots: {headline, sub, meta},
  rotation_jitter: rand(-8..+8°),
  density: rand(low|medium|high) within style.whitespace_ratio
}
render templated prompt → stdout
```

Locked axes: style identity, texture/material, palette family. Randomized axes: positions, shapes, density, rotation. Result: stylistic continuity + visible variety per call.

## Approaches Evaluated

| Option | Why not |
|--------|---------|
| 121 raw rows | Near-duplicates; hard for agents to pick |
| Hybrid 121 + curated | 2× build effort; YAGNI |
| Reference-image conditioning | Locks to Nano Banana; user wants any model |
| Inline texture column | Loses recombination axis |
| Runtime analysis | 121 Gemini calls per session; expensive |

## Risks

- **Cluster noise**: extraction must use stable JSON schema + few-shot examples.
- **Thin variation pools**: each cluster needs ≥4-8 shape primitives or output looks repetitive.
- **Texture/style coupling**: enforced via `pairs_with_styles` columns.
- **Build cost**: ~121 Gemini Flash multimodal calls, ~$1-3, one-time.

## Success Criteria

- 4 CSVs committed with ≥20 styles, ≥15 palettes, ≥10 layouts, ≥8 textures.
- `search.py --domain poster-style` returns matched rows.
- `generate.py --topic "tech meetup" --style swiss-minimal` prints a complete prompt referencing locked + randomized axes.
- Running `generate.py` 5× with same args produces 5 visibly different prompts (different positions/shapes/density).
- Sample outputs from Nano Banana 2 fed by 3 prompts of the same style are visually coherent as a series.

## Next Steps

1. `/ck:plan` to phase: (a) analysis script, (b) cluster + CSV emit, (c) search.py, (d) generate.py, (e) references docs, (f) SKILL.md wiring, (g) smoke test with real image-gen.
2. Confirm `GEMINI_API_KEY` available for build-time analysis.

## Unresolved Questions

- Target cluster count exact: 20 vs 30? (Let HDBSCAN decide, cap at 30.)
- Should `generate.py` accept `--lock-axis style|palette|layout|texture` to pin specific axes when user wants a series? (Likely yes, defer to plan phase.)
- Poster aspect ratio handling — fixed at A2/A3/square or user-supplied? (Add `--aspect` flag.)
