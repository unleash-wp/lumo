---
title: "Phase 1: Convert Simple Commands"
status: completed
priority: P1
effort: 1h
completed: 2026-03-03
---

# Phase 1: Convert Simple Commands (18 skills)

## Context
- Parent plan: [plan.md](plan.md)
- Source: `.claude/commands/ckm/*.md` (top-level only, no subdirs)
- Target: `.claude/skills/ckm-{name}/SKILL.md`

## Commands to Convert

| # | Command File | New Skill Dir | Skill Name |
|---|-------------|---------------|------------|
| 1 | `ask.md` | `ckm-ask/` | `ckm:ask` |
| 2 | `campaign.md` | `ckm-campaign/` | `ckm:campaign` |
| 3 | `ck-help.md` | `ckm-ck-help/` | `ckm:ck-help` |
| 4 | `competitor.md` | `ckm-competitor/` | `ckm:competitor` |
| 5 | `dashboard.md` | `ckm-dashboard/` | `ckm:dashboard` |
| 6 | `email.md` | `ckm-email/` | `ckm:email` |
| 7 | `funnel.md` | `ckm-funnel/` | `ckm:funnel` |
| 8 | `hub.md` | `ckm-hub/` | `ckm:hub` |
| 9 | `init.md` | `ckm-init/` | `ckm:init` |
| 10 | `journal.md` | `ckm-journal/` | `ckm:journal` |
| 11 | `kanban.md` | `ckm-kanban/` | `ckm:kanban` |
| 12 | `persona.md` | `ckm-persona/` | `ckm:persona` |
| 13 | `plan.md` | `ckm-plan/` | `ckm:plan` |
| 14 | `preview.md` | `ckm-preview/` | `ckm:preview` |
| 15 | `seo.md` | `ckm-seo/` | `ckm:seo` |
| 16 | `social.md` | `ckm-social/` | `ckm:social` |
| 17 | `use-mcp.md` | `ckm-use-mcp/` | `ckm:use-mcp` |
| 18 | `watzup.md` | `ckm-watzup/` | `ckm:watzup` |
| 19 | `worktree.md` | `ckm-worktree/` | `ckm:worktree` |

Note: `analyze.md` and `social.md` have subdirectories so they're parent commands — included here for the parent file, subcommands in Phase 2.

## Implementation Steps

For each command file:

1. Create directory: `mkdir -p .claude/skills/ckm-{name}/`
2. Read source `.claude/commands/ckm/{name}.md`
3. Transform frontmatter:
   ```yaml
   # FROM (command):
   ---
   description: "..."
   argument-hint: [args]
   ---

   # TO (skill):
   ---
   name: ckm:{name}
   description: "..."
   argument-hint: "[args]"
   metadata:
     author: claudekit
     version: "1.0.0"
   ---
   ```
4. Copy body content as-is
5. Write to `.claude/skills/ckm-{name}/SKILL.md`

## Script Approach

Use a bash script to automate the conversion:

```bash
#!/bin/bash
CMD_DIR=".claude/commands/ckm"
SKILL_DIR=".claude/skills"

for file in "$CMD_DIR"/*.md; do
  name=$(basename "$file" .md)
  skill_dir="$SKILL_DIR/ckm-$name"
  mkdir -p "$skill_dir"

  # Extract frontmatter fields and transform
  # Copy body content
  # Write SKILL.md with new frontmatter
done
```

## Success Criteria
- [x] 19 new skill directories created
- [x] Each has valid SKILL.md with correct frontmatter
- [x] `$ARGUMENTS` placeholders preserved
- [x] No existing skills modified

## File Ownership
This phase owns: `skills/ckm-ask/`, `skills/ckm-campaign/`, `skills/ckm-ck-help/`, `skills/ckm-competitor/`, `skills/ckm-dashboard/`, `skills/ckm-email/`, `skills/ckm-funnel/`, `skills/ckm-hub/`, `skills/ckm-init/`, `skills/ckm-journal/`, `skills/ckm-kanban/`, `skills/ckm-persona/`, `skills/ckm-plan/`, `skills/ckm-preview/`, `skills/ckm-seo/`, `skills/ckm-social/`, `skills/ckm-use-mcp/`, `skills/ckm-watzup/`, `skills/ckm-worktree/`
