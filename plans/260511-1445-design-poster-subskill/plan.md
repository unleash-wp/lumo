---
title: Design Poster Sub-skill
description: ''
status: completed
priority: P2
branch: worktree-feat-design-poster-skill
tags: []
blockedBy: []
blocks: []
created: '2026-05-11T07:46:13.684Z'
createdBy: 'ck:plan'
source: skill
---

# Design Poster Sub-skill

## Overview

Add a `poster` built-in sub-skill to the unified `ckm:design` skill, as a sibling of `logo`/`cip`/`icon`. Pipeline: build-time vision analysis of 121 reference posters in `test-ck/posters/` → cluster → 4 curated CSVs (styles, palettes, layouts, textures) → runtime `search.py` + model-agnostic `generate.py` emits text prompts for Nano Banana 2 / GPT Image / etc. Variation guaranteed by axis recombination + per-call randomization (positions, shapes, density, rotation) while locking style/palette/texture identity.

Brainstorm: `plans/reports/brainstorm-260511-1257-design-poster-subskill.md`

**Skill orchestration:** Invoke `/ck:skill-creator` to scaffold the sub-skill structure and validate against Skillmark conventions. Use it in phase 4 when wiring `SKILL.md` and reference docs to ensure the description string and routing table follow the established skill schema.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Analyzer Script](./phase-01-analyzer-script.md) | Completed |
| 2 | [Cluster and CSV Emission](./phase-02-cluster-and-csv-emission.md) | Completed |
| 3 | [Search and Generate Scripts](./phase-03-search-and-generate-scripts.md) | Completed |
| 4 | [References and SKILL.md Wiring](./phase-04-references-and-skill-md-wiring.md) | Completed |
| 5 | [Smoke Test and Sample Outputs](./phase-05-smoke-test-and-sample-outputs.md) | Completed |

## Dependencies

<!-- Cross-plan dependencies -->
