---
phase: 5
title: Smoke Test and Sample Outputs
status: completed
priority: P2
effort: 2h
dependencies:
  - 4
---

# Phase 5: Smoke Test and Sample Outputs

## Overview

End-to-end validation: generate prompts via `generate.py`, feed to Nano Banana 2 (out-of-band, manual), inspect outputs for (a) style coherence within a series and (b) visible variation between calls. Capture sample prompts + thumbnails as documentation evidence.

## Requirements

- Functional:
  - Pick 3 styles; for each style, generate 5 prompts (varied seeds).
  - Pipe 15 prompts through Nano Banana 2 (or any image-gen model) — manual or scripted via existing `ai-multimodal` skill.
  - Save outputs to `plans/260511-1445-design-poster-subskill/visuals/`.
  - Author `smoke-test-report.md` with thumbnails, prompts, observations.
- Non-functional:
  - Honest assessment: if style coherence fails, file ticket in plan rather than declaring success.

## Architecture

```
smoke-test/
  ├─ run-smoke.sh                # bash: 3 styles × 5 seeds → 15 prompts
  ├─ prompts/                    # generated prompt text files
  ├─ outputs/                    # rendered poster images (manual or scripted)
  └─ smoke-test-report.md
```

## Related Code Files

- Create:
  - `plans/260511-1445-design-poster-subskill/visuals/smoke-test/run-smoke.sh`
  - `plans/260511-1445-design-poster-subskill/visuals/smoke-test/smoke-test-report.md`
- Modify: none

## Implementation Steps

1. Pick 3 contrasting styles from `poster-styles.csv` (e.g., swiss-minimal, japanese-gradient, brutalist-grid).
2. `run-smoke.sh` loops: for style in styles; for seed in 1..5; `generate.py --style $style --topic "AI Conference" --seed $seed` > `prompts/$style-$seed.txt`.
3. Feed each prompt to Nano Banana 2 (or document the manual step).
4. Compose `smoke-test-report.md`: 3 grids of 5 thumbnails + the 15 prompts + per-style observation.
5. Assess: do 5 outputs per style read as "same series, different posters"? If no → file findings and propose CSV refinement.

## Success Criteria

- [ ] 15 prompts generated.
- [ ] 15 rendered images saved (or manual step documented if API unavailable).
- [ ] Smoke report identifies pass/fail per style.
- [ ] Style coherence verdict: at least 2/3 styles produce visually coherent 5-image series.
- [ ] Variation verdict: no two outputs in a series are near-duplicates.

## Risk Assessment

- **No GEMINI_API_KEY** → manual generation acceptable; document with screenshots.
- **Style coherence fails** → likely thin Shape Pool or weak description; loop back to Phase 2 for that cluster.
- **All outputs near-duplicate** → variation seed insufficient; expand layout/density randomization in Phase 3.

## Next Steps

- If pass → mark plan complete, run `/ck:journal`.
- If fail → file refinement plan referencing this report.
