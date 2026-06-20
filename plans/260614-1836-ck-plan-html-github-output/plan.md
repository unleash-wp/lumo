---
title: ck-plan HTML and GitHub flags
description: >-
  Teach ck-plan to document --html and --github output modes while keeping the
  skill catalog and installed copy in sync.
status: pending
priority: P2
effort: 3h
issue: 826
branch: codex/ck-plan-html-github
tags:
  - feature
  - skill
  - github
  - frontend
blockedBy: []
blocks: []
created: '2026-06-14T11:36:50.863Z'
createdBy: 'ck:plan'
source: skill
---

# ck-plan HTML and GitHub flags

## Overview

Add two user-facing flags to `ck:plan`:

- `--html`: plan output becomes a self-contained, interactive HTML file instead of Markdown, using `ck:frontend-design` during generation and including user flows, diagrams, charts, and URL citations.
- `--github`: after plan validation, create a GitHub issue containing branch name, plan summary, relative links to `plan.md` and brainstorm report, open questions when present, and label `ready to review`.

Minimum change set: update existing skill instructions and generated skill catalogs; sync the installed USER-level skill copy after repo validation.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Skill Flag Semantics](./phase-01-skill-flag-semantics.md) | Completed |
| 2 | [Catalog And User Skill Sync](./phase-02-catalog-and-user-skill-sync.md) | Completed |
| 3 | [Validation And Shipping](./phase-03-validation-and-shipping.md) | Pending |

## Dependencies

- Existing `ck` plan CLI owns plan scaffolding only; this change updates skill behavior instructions.
- Existing `gh` CLI is the issue creation surface for `--github`.
- Existing skill catalog generation reads `SKILL.md` frontmatter, so frontmatter must be updated before regenerating catalogs.
- GitHub issue: https://github.com/claudekit/claudekit-engineer/issues/826

## Acceptance Criteria

- [ ] `ck:plan` frontmatter and workflow document `--html` and `--github`.
- [ ] HTML mode requires `ck:frontend-design` and produces a self-contained `.html` plan artifact with user flows, diagrams, charts, interactivity, and URL citations.
- [ ] GitHub mode creates or updates a GitHub issue with branch, summary, relative `plan.md` link, brainstorm report link when present, open questions when present, and `ready to review` label.
- [ ] Generated catalogs reflect the new argument hint.
- [ ] Installed USER-level `ck-plan` skill matches the repo skill after validation.
- [ ] Lint/tests pass before shipping.

## Validation Log

### Verification Results
- Tier: Standard
- Claims checked: 6
- Verified: 6 | Failed: 0 | Unverified: 0
- `claude/skills/ck-plan/SKILL.md` exists and owns `ck:plan` frontmatter.
- `claude/scripts/scan_skills.py` reads `argument-hint` from skill frontmatter.
- `guide/SKILLS.yaml` and `claude/scripts/skills_data.yaml` contain generated `ck-plan` argument hints.
- `package.json` exposes `npm run lint` and `npm test`.
- Current branch is `codex/ck-plan-html-github`.
- Repository remote is `claudekit/claudekit-engineer`.

### Red Team Review
- Finding: `--html` could be interpreted as only a preview flag. Decision: document artifact location, Markdown replacement semantics, and mandatory design skill activation.
- Finding: `--github` could leak sensitive details into public issues. Decision: add explicit redaction and no-secrets rule to the GitHub issue mode.
- Finding: issue links can break if absolute local paths are used. Decision: require repo-relative links only.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-skill-flag-semantics.md, phase-02-catalog-and-user-skill-sync.md, phase-03-validation-and-shipping.md
- Decision deltas checked: 3
- Reconciled stale references: 0
- Unresolved contradictions: 0

Unresolved questions:
- None
