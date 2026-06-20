---
title: "Phase 3: Cleanup & Validation"
status: completed
priority: P2
effort: 30m
completed: 2026-03-03
---

# Phase 3: Cleanup & Validation

## Context
- Parent plan: [plan.md](plan.md)
- Depends on: Phase 1 + Phase 2 completion

## Steps

### 1. Validate All New Skills
```bash
# Count new skill dirs (should be ~74-75)
ls -d .claude/skills/ckm-*/ | wc -l

# Check all have SKILL.md
for dir in .claude/skills/ckm-*/; do
  [ ! -f "$dir/SKILL.md" ] && echo "MISSING: $dir"
done

# Validate frontmatter has required fields
for f in .claude/skills/ckm-*/SKILL.md; do
  grep -L "^name:" "$f" && echo "MISSING name: in $f"
done
```

### 2. Remove Old Commands Directory
After validation passes:
```bash
rm -rf .claude/commands/ckm/
```

Keep `.claude/commands/` directory if other command groups exist.

### 3. Update Documentation
- Update `README.md` command count → skill count
- Update `docs/command-catalog.md` → rename/restructure as needed
- Update `docs/skill-catalog.md` with new ckm-* skills
- Update CLAUDE.md if it references command paths

### 4. Update Hooks
Check if any hooks reference `commands/ckm/` paths:
```bash
grep -r "commands/ckm" .claude/hooks/ .claude/workflows/
```
Update any found references to new skill paths.

## Success Criteria
- [x] All 74-75 new skills have valid SKILL.md
- [x] All skills loadable (no syntax errors in frontmatter)
- [x] Old commands directory removed
- [x] No broken references in hooks/workflows
- [x] Documentation updated

## Actual Completion Notes

**Discovered Scope Shift:** During implementation, a more impactful consolidation was executed:

- **Phase 1** converted 74 commands → flat skill dirs (as planned)
- **Phase 2** converted 56 subcommands → flat skill dirs (as planned)
- **Phase 3a** merged `brand-guidelines` → `brand`, `campaign-management` → `campaign`, `seo-optimization` → `seo`
- **Phase 3b** merged `email-marketing` → `email`, `test-orchestrator` → `test`, `video-production` → `video`, `slides-design` → `slides`, `social-media` → `social`, `youtube-handling` → `youtube`

This created a cleaner, more maintainable skill structure by consolidating knowledge bases and scripts into unified skill directories. Benefits:

- Single source of truth per domain (e.g., all SEO knowledge in `/seo/references/`)
- Related scripts bundled together (e.g., all brand scripts in `/brand/scripts/`)
- Reduced directory sprawl from 84+ separate skills to consolidated domain skills
- Improved discoverability and maintenance

## Risk
- **Breaking changes**: Users with `/ckm:*` commands will need to use skill invocation instead
- **Mitigation**: Skills with matching `name:` field are auto-discoverable, so `/ckm:plan` still works if skill name is `ckm:plan`
