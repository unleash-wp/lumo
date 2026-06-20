---
phase: 3
title: Validation And Beta Ship
status: in-progress
priority: P2
effort: 40m
---

# Phase 3: Validation And Beta Ship

## Overview

Run repo validation, ship a beta PR to `dev`, merge it, and watch the beta
release path until the post-merge state is verified.

## Implementation Steps

1. Run focused validation:
   - `python3 claude/scripts/scan_skills.py`
   - `python3 claude/skills/skill-creator/scripts/quick_validate.py claude/skills/ck-plan`
   - `python3 claude/skills/skill-creator/scripts/package_skill.py claude/skills/ck-plan /tmp/claudekit-skill-packages`
2. Run `npm run lint` and relevant tests.
3. Create PR from `codex/ck-plan-wiki-publish` into `dev`.
4. Review PR diff for duplicate behavior, security leaks, and catalog drift.
5. Merge after checks are green.
6. Watch post-merge beta workflow/release and verify the beta tag.

## Success Criteria

- [ ] PR is merged to `dev`.
- [ ] Target-branch CI/release is green or a true external blocker is recorded.
- [ ] Beta release/tag exists for the merged change.
- [ ] Issue and PR carry `ready to ship beta` when review is complete.
