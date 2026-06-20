---
phase: 4
title: References and SKILL.md Wiring
status: completed
priority: P2
effort: 2h
dependencies:
  - 3
---

# Phase 4: References and SKILL.md Wiring

## Overview

Author reference markdown (`poster-design.md`, `poster-prompt-engineering.md`) and wire the new sub-skill into `SKILL.md`. **Invoke `/ck:skill-creator`** to validate sub-skill schema, optimize the description string against Skillmark conventions, and confirm the routing table entry is well-formed.

## Requirements

- Functional:
  - `references/poster-design.md`: when-to-use, hints, recommendations, axis recombination logic, examples for agents.
  - `references/poster-prompt-engineering.md`: prompt template anatomy, axis lock semantics, variation pool explanation, model-specific tweaks (Nano Banana 2 vs GPT Image).
  - `SKILL.md` updates:
    - Add Poster row to "Sub-skill Routing" table.
    - Add "Poster Design (Built-in)" section with `search.py`/`generate.py` examples.
    - Update top-level `description` frontmatter to mention "poster design" capability.
  - Bump `metadata.version` in SKILL.md frontmatter.
- Non-functional:
  - References ≤ 800 LOC each.
  - SKILL.md remains scannable — keep Poster section parallel to Logo/CIP sections.

## Architecture

```
SKILL.md (modify)
  ├─ frontmatter.description     → +"poster design (built-in, 20-30 styles, 4 axes, model-agnostic)"
  ├─ Sub-skill Routing table     → +Poster row
  └─ "Poster Design (Built-in)"  → new section after Icon

references/
  ├─ poster-design.md            → new
  └─ poster-prompt-engineering.md → new
```

## Related Code Files

- Create:
  - `.claude/skills/design/references/poster-design.md`
  - `.claude/skills/design/references/poster-prompt-engineering.md`
- Modify:
  - `.claude/skills/design/SKILL.md`

## Implementation Steps

1. Invoke `/ck:skill-creator` to validate the description string + ensure poster section matches existing logo/cip patterns.
2. Draft `poster-design.md` modeled after `logo-design.md` structure.
3. Draft `poster-prompt-engineering.md` modeled after `logo-prompt-engineering.md`, focused on axis recombination + variation pools.
4. Edit `SKILL.md`: add routing row, new Poster section with examples copy-paste-ready, version bump.
5. Re-run skill-creator validator to confirm no schema drift.

## Success Criteria

- [ ] `SKILL.md` lists Poster in routing table.
- [ ] `SKILL.md` Poster section has `search.py` and `generate.py` examples.
- [ ] Both reference files exist and load cleanly.
- [ ] `/ck:skill-creator` validation passes.
- [ ] SKILL.md description frontmatter mentions poster capability.

## Risk Assessment

- **Description string overflow** (Skillmark may cap length) → keep new keywords tight.
- **SKILL.md getting bloated** → keep Poster section terse; deep detail lives in references.
