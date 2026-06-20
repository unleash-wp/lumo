# Smoke Test Results

Pipeline: analyze (113/119 images) → cluster → generate.

## Knowledge Base

- 22 styles
- 16 palettes
- 14 layouts
- 8 textures

## Unseeded Variety (5 random seeds)

Distinct styles, palettes, layouts, textures per call. Pass.

## Locked-Style Series (style=deconstructed-editorial, seeds 11-15)

Locked axes held across all 5:
- style: `deconstructed-editorial`
- texture: `texture-07-newsprint` (filtered via Pairs With Styles)

Varied across all 5:
- palette: 4 distinct
- layout: 4 distinct
- grid, whitespace, hierarchy, focal, secondary positions, shape set, density: all distinct

Brief satisfied: "exactly that design style but still look various."

## Files

- `locked-style-seed-11.txt` … `locked-style-seed-15.txt` — full prompts piped-ready for any image-gen model.
