---
phase: 2
title: Catalog And User Skill Sync
status: completed
priority: P2
effort: 35m
---

# Phase 2: Catalog And User Skill Sync

## Overview

Regenerate checked-in skill catalogs and sync the shipped skill to the
USER-level skill directory after repo validation.

## Implementation Steps

1. Run `python3 claude/scripts/scan_skills.py` after metadata edits.
2. Confirm `claude/scripts/skills_data.yaml`, `guide/SKILLS.yaml`, and
   `guide/SKILLS.md` reflect `ck-plan --wiki`.
3. Validate repo skill with `quick_validate.py` and package validation.
4. After beta ship succeeds, copy `claude/skills/ck-plan` to
   `/Users/duynguyen/.agents/skills/ck-plan`.
5. Verify the user-level copy with recursive diff and quick validation.

## Success Criteria

- [ ] Generated catalogs include the new flag.
- [ ] Repo skill validates.
- [ ] USER-level skill copy matches source exactly.
