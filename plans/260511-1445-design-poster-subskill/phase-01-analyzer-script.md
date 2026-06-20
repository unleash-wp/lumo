---
phase: 1
title: Analyzer Script
status: completed
priority: P1
effort: 3h
dependencies: []
---

# Phase 1: Analyzer Script

## Overview

Build `scripts/poster/analyze.py` that vision-analyzes all 121 posters in `test-ck/posters/` via Gemini multimodal (`ai-multimodal` skill API) and emits a structured intermediate JSON per image with style cues, palette hexes, layout signature, texture/material, mood, and shape primitives.

## Requirements

- Functional:
  - Read every `*.jpg` in user-supplied `--input-dir` (default `test-ck/posters`).
  - Per-image call Gemini Flash multimodal (cheapest tier acceptable; few-shot JSON schema for stability).
  - Write `analysis/raw/{image-hash}.json` next to skill data dir.
  - Resume-safe: skip images with existing JSON unless `--force`.
  - CLI: `--input-dir`, `--output-dir`, `--model`, `--force`, `--limit N` (smoke runs).
- Non-functional:
  - File size < 200 lines (modularize if needed).
  - Kebab-case file names.
  - Uses `~/.claude/skills/.venv/bin/python3`.
  - GEMINI_API_KEY loaded via existing `core.py` env loader pattern (mirror `logo/core.py`).

## Architecture

```
analyze.py
  ├─ load_env()              # reuse pattern from logo/generate.py
  ├─ list_images(input_dir)
  ├─ extraction_prompt()     # few-shot JSON schema
  ├─ call_gemini(image, prompt) → JSON
  └─ write_raw(json, hash)
```

Output JSON schema per image:
```json
{
  "image": "<filename>",
  "style_cues": ["swiss", "grid", "high-contrast"],
  "palette_hexes": ["#0a0a0a", "#f5e6c8"],
  "layout": {"grid": "12-col asymmetric", "focal": "top-left", "whitespace_ratio": "high"},
  "texture": {"material": "matte paper", "finish": "halftone dots"},
  "mood": ["editorial", "serious"],
  "shape_primitives": ["circle", "thick rule", "rotated text block"],
  "typography": ["geometric sans", "extreme size contrast"]
}
```

## Related Code Files

- Create:
  - `.claude/skills/design/scripts/poster/analyze.py`
  - `.claude/skills/design/scripts/poster/core.py` (env loader, Gemini client, JSON validator)
  - `.claude/skills/design/data/poster/analysis/raw/` (output dir, gitkept)
- Modify: none
- Delete: none

## Implementation Steps

1. Scaffold `scripts/poster/` dir; copy env-loader pattern from `scripts/logo/generate.py`.
2. Write `core.py` with `load_env()`, `gemini_client()`, `validate_extraction(json)` (strict schema check).
3. Write `analyze.py` with CLI, image iteration, few-shot prompt with 1-2 worked examples.
4. Add `--limit 5` smoke run; verify JSON shape on 5 images before full run.
5. Run full 121-image pass; tolerate per-image failures (log + continue).
6. Verify resume-safety: re-run same args → 0 new calls.

## Success Criteria

- [ ] `analyze.py --limit 5` produces 5 valid JSON files matching schema.
- [ ] Full run produces ≥115/121 valid JSON files (≥95% success).
- [ ] Re-run skips already-analyzed images.
- [ ] No file > 200 LOC.

## Risk Assessment

- **Gemini schema drift** → mitigate with strict JSON validator + retry-once on validation failure.
- **Rate limits** → simple 250ms sleep between calls; backoff on 429.
- **Cost overrun** → use Flash tier; estimated ~$1-3 total for 121 images.

## Security Considerations

- `.env` loading reuses existing pattern; never commit `GEMINI_API_KEY`.
- Raw JSON output may contain image filenames only — no PII.
