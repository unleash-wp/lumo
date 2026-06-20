---
title: "Convert ckm commands to skills"
description: "Convert all 74 command files in .claude/commands/ckm/ to skill format in .claude/skills/"
status: completed
priority: P1
effort: 3h
branch: goon
tags: [skills, commands, migration, refactoring]
created: 2026-03-02
completed: 2026-03-03
---

# Convert CKM Commands to Skills

## Summary

Convert all 74 command `.md` files in `.claude/commands/ckm/` to skill `SKILL.md` format in `.claude/skills/`. Commands use flat `.md` files with `$ARGUMENTS` injection; skills use directory-based structure with `SKILL.md`, `references/`, and `scripts/`.

## Current State

- **74 command files** across 21 directories (parent commands + subcommands)
- **84 existing skills** already in `.claude/skills/`
- Some commands already have corresponding skills (e.g., `storage`, `seo-optimization`, `brand-guidelines`) — these are **knowledge skills** that commands activate, NOT the command logic itself

## Key Insight: Commands vs Skills

| Aspect | Command (.md) | Skill (SKILL.md) |
|--------|---------------|-------------------|
| Format | Single `.md` with frontmatter | Directory with `SKILL.md` + optional `references/`, `scripts/` |
| Frontmatter | `description`, `argument-hint` | `name`, `description`, `argument-hint`, `metadata` |
| Invocation | `/ckm:command-name` | Auto-activated by description match OR `/skill-name` |
| Arguments | `$ARGUMENTS` placeholder | `$ARGUMENTS` placeholder |
| Subcommands | Nested dirs (e.g., `plan/hard.md` → `/ckm:plan:hard`) | Single skill per command, colon-delimited name |

## Conversion Strategy

### Naming Convention
- Parent command: `analyze.md` → skill dir `ckm-analyze/SKILL.md` with `name: ckm:analyze`
- Subcommand: `analyze/report.md` → skill dir `ckm-analyze-report/SKILL.md` with `name: ckm:analyze:report`
- Deep sub: `video/script/create.md` → skill dir `ckm-video-script-create/SKILL.md` with `name: ckm:video:script:create`

### Frontmatter Template
```yaml
---
name: ckm:{colon-separated-path}
description: {from command description}
argument-hint: "{from command argument-hint}"
metadata:
  author: claudekit
  version: "1.0.0"
---
```

### Content Rules
1. Copy command body as-is into SKILL.md (commands are already concise instructions)
2. Keep `$ARGUMENTS` placeholders unchanged
3. Add `name` and `metadata` fields to frontmatter
4. Keep SKILL.md under 150 lines (split to `references/` if needed)
5. If command references scripts, keep script paths relative

## Command Inventory (74 files → 74 new skills)

### Group 1: Simple Commands (single .md, no subdir) — 18 skills
`ask`, `campaign`, `ck-help`, `competitor`, `dashboard`, `email`, `funnel`, `hub`, `init`, `journal`, `kanban`, `persona`, `plan`, `preview`, `seo`, `social`, `use-mcp`, `watzup`, `worktree`

### Group 2: Parent + Subcommands — 56 skills across 13 groups

| Group | Parent | Subcommands | Total |
|-------|--------|-------------|-------|
| analyze | analyze | report | 2 |
| brand | — | update | 1 |
| campaign | — | analyze, create, email, status | 4 |
| dashboard | — | check | 1 |
| docs | — | init, llms, summarize, update | 4 |
| email | — | flow, sequence | 2 |
| plan | — | archive, ci, cro, fast, hard, parallel, two, validate | 8 |
| seo | — | audit, keywords, pseo | 3 |
| skill | — | add, create, fix-logs, optimize, optimize/auto, plan, update | 7 |
| slides | — | create | 1 |
| social | — | schedule | 1 |
| storage | — | list, sync, upload, url | 4 |
| test | — | ui, workflow | 2 |
| video | — | create, script/create, storyboard/create | 3 |
| write | — | audit, blog, blog/youtube, cro, enhance, fast, formula, good, publish | 9 |
| youtube | — | blog, infographic, social | 3 |

## Phases

### Phase 1: Group 1 — Simple Commands (18 skills)
File: [phase-01-simple-commands.md](phase-01-simple-commands.md)
Status: pending

### Phase 2: Group 2 — Parent+Sub Commands (56 skills)
File: [phase-02-subcommands.md](phase-02-subcommands.md)
Status: pending

### Phase 3: Cleanup & Validation
File: [phase-03-cleanup-and-validation.md](phase-03-cleanup-and-validation.md)
Status: pending

## Execution Strategy

- Phase 1 and Phase 2 can run **in parallel** (no file overlap)
- Phase 3 runs after both complete (validation + cleanup)

## File Ownership Matrix

| Phase | Owns |
|-------|------|
| Phase 1 | `skills/ckm-ask/`, `skills/ckm-campaign/`, `skills/ckm-ck-help/`, ... (18 new dirs) |
| Phase 2 | `skills/ckm-analyze/`, `skills/ckm-analyze-report/`, `skills/ckm-brand-update/`, ... (56 new dirs) |
| Phase 3 | `commands/ckm/` (removal), docs updates |

## Risk Assessment

- **Low risk**: No existing skills modified — only new dirs created
- **Naming collision**: None — all new skills use `ckm-` prefix (existing skills don't)
- **Rollback**: `git checkout` reverses everything
