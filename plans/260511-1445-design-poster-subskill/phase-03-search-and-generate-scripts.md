---
phase: 3
title: Search and Generate Scripts
status: completed
priority: P1
effort: 3h
dependencies:
  - 2
---

# Phase 3: Search and Generate Scripts

## Overview

Runtime scripts agents call: `search.py` filters CSVs by domain/keywords; `generate.py` assembles a randomized-but-style-locked text prompt for any image-gen model. Both mirror `logo/search.py` and `logo/generate.py` patterns but `generate.py` here emits prompt text to stdout — no API call.

## Requirements

- Functional:
  - `search.py --domain {style|palette|layout|texture}` — keyword/category match, return top-N rows as JSON or formatted text.
  - `search.py --poster-brief --topic "tech meetup"` — assemble a design brief combining matched style+palette+layout+texture.
  - `generate.py --topic "tech meetup" [--style swiss-minimal] [--lock-axis style,texture] [--aspect a3|a2|square] [--seed N]` — print a complete image-gen prompt to stdout.
  - Random axis-recombiner: pick style → pick palette (filter `pairs_with_styles`) → pick layout (compatible) → pick texture (pairs_with_styles).
  - Variation seed: shuffle positions, pick 2-4 shapes from style `Shape Pool`, fill copy slots, rotation jitter, density variance.
  - `--lock-axis` keeps specified axes fixed across repeated calls (for series).
  - `--seed` for deterministic repro.
- Non-functional:
  - Model-agnostic — no API keys needed at runtime.
  - File size < 200 LOC each; shared loaders in `core.py`.

## Architecture

```
search.py
  ├─ load_csv(domain)
  ├─ filter(rows, query, category)
  └─ format_output(rows, mode)   # json | text | brief

generate.py
  ├─ load_all_csvs()
  ├─ pick_axes(query, locks, seed)
  ├─ build_variation_seed(style)
  └─ render_prompt(axes, seed)   → stdout
```

Prompt template (rendered):
```
Design a {aspect} poster on the theme of "{topic}".

STYLE (locked): {style.name} — {style.description}. Era: {style.era}. Mood: {style.mood}.
PALETTE (locked): {palette.name} using {palette.hex_colors}. Contrast: {palette.contrast}.
TEXTURE/MATERIAL (locked): {texture.name} — {texture.effect_description}. Rendering: {texture.rendering_hints}.

COMPOSITION (varied):
- Grid: {layout.grid_system}
- Focal anchor: {variation.focal_position}
- Element hierarchy: {variation.shuffled_hierarchy}
- Whitespace density: {variation.density}
- Shape primitives to incorporate (2-4): {variation.shape_set}
- Rotation jitter on secondary elements: {variation.rotation}°

COPY SLOTS:
- Headline: {topic-derived}
- Sub: {variation.sub_slot}
- Meta: {variation.meta_slot}

CONSTRAINTS: preserve the texture/material identity exactly; vary only composition, position, and shape selection from the pool above.
```

## Related Code Files

- Create:
  - `.claude/skills/design/scripts/poster/search.py`
  - `.claude/skills/design/scripts/poster/generate.py`
- Modify: `scripts/poster/core.py` (add `load_all_csvs`, `pick_axes`, `build_variation_seed`, `render_prompt`)

## Implementation Steps

1. Mirror arg parsing from `scripts/logo/search.py`.
2. Implement `load_all_csvs()` returning dict of pandas/csv rows.
3. Implement `pick_axes` with `--lock-axis` and `--seed`.
4. Implement `build_variation_seed` with shape pool sampler, position shuffler, density picker.
5. Implement `render_prompt` using f-string template above.
6. Run 5× with same `--topic` no seed → verify 5 distinct prompts.
7. Run 3× with same `--seed 42` → verify byte-identical prompts.

## Success Criteria

- [ ] `search.py --domain style --query "swiss"` returns matching style rows.
- [ ] `generate.py --topic "tech meetup"` prints valid prompt to stdout.
- [ ] 5 unseeded calls → 5 distinct prompts.
- [ ] Same `--seed` → identical output.
- [ ] `--lock-axis style,texture` keeps those fixed, varies layout/palette.
- [ ] Each file < 200 LOC.

## Risk Assessment

- **Empty match for narrow query** → fallback to mood-similarity, then random.
- **Pairs filter eliminates all options** → relax pairs constraint, log warning in prompt header.
