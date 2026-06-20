# Code Review Summary

## Scope

- **Review focus**: Skill merge changes — 6 knowledge skills merged into grouped command skills
- **Merges reviewed**: `test-orchestrator→test`, `video-production→video`, `slides-design→slides`, `social-media→social`, `email-marketing→email`, `youtube-handling→youtube`
- **Files analyzed**: 6 SKILL.md files, ~117 changed files across commits, full cross-reference scan
- **Branch**: `goon`
- **Plan**: `plans/20260302-convert-commands-to-skills/phase-03-cleanup-and-validation.md`

---

## Overall Assessment

Merge logic is structurally sound. All 6 target skill directories exist with correct SKILL.md format, and all files referenced in SKILL.md tables are physically present. However, there are **two categories of issues**:

1. **Critical**: 39 new reference/script files are untracked (not staged) — old source dirs are also only physically deleted but not staged. The merge is **not committed** for the 6 skills in scope.
2. **High**: 7 command files contain broken absolute paths pointing to deleted skill directories. 18 command files contain stale skill name references.

---

## Critical Issues

### C1: Merge Changes Not Committed

The 6 skill merges are **incomplete in git**:

```
# Untracked (new files not staged):
?? .claude/skills/email/references/automation-flows.md
?? .claude/skills/email/references/deliverability-checklist.md
?? .claude/skills/email/references/email-templates.md
?? .claude/skills/email/references/subject-line-formulas.md
?? .claude/skills/slides/references/copywriting-formulas.md
... (39 total new files untracked)
?? .claude/skills/social/scripts/
?? .claude/skills/test/scripts/
?? .claude/skills/video/references/ (10 files)
?? .claude/skills/video/scripts/
?? .claude/skills/video/templates/
?? .claude/skills/youtube/references/api-content.md
?? .claude/skills/youtube/references/api-media.md
?? .claude/skills/youtube/scripts/

# Old source dirs physically deleted but NOT staged:
 D .claude/skills/email-marketing/SKILL.md (+ 4 references)
 D .claude/skills/slides-design/SKILL.md (+ 4 references)
 D .claude/skills/social-media/* (entire dir)
 D .claude/skills/test-orchestrator/* (entire dir)
 D .claude/skills/video-production/* (entire dir)
 D .claude/skills/youtube-handling/* (entire dir)
```

**Impact**: If someone `git checkout .` or resets, all copied references and all deletions revert. The working tree is consistent but git index is not.

**Fix**: Stage and commit all unstaged changes:
```bash
git add .claude/skills/email/references/
git add .claude/skills/slides/references/
git add .claude/skills/social/references/ .claude/skills/social/scripts/
git add .claude/skills/test/scripts/
git add .claude/skills/video/references/ .claude/skills/video/scripts/ .claude/skills/video/templates/
git add .claude/skills/youtube/references/ .claude/skills/youtube/scripts/
git add -u  # stage all deletions
git commit -m "feat(skills): complete merge of 6 knowledge skills into grouped skills"
```

---

## High Priority Findings

### H1: Broken Absolute Paths in 7 Command Files

These files reference `skills/{old-name}/...` paths that no longer exist on disk:

| File | Stale Path |
|------|-----------|
| `.claude/commands/ckm/video/create.md` (×4) | `skills/video-production/references/audio-directive-guide.md`, `scripts/analyze-video.cjs`, `scripts/optimize-for-platform.cjs`, `scripts/extract-captions.cjs` |
| `.claude/commands/ckm/test/workflow.md` | `skills/test-orchestrator/scripts/scan-components.py` |
| `.claude/commands/ckm/write/blog/youtube.md` (×3) | `skills/youtube-handling/scripts/vidcap.py` (3 calls) |
| `.claude/commands/ckm/youtube/blog.md` (×3) | `skills/youtube-handling/scripts/vidcap.py` (3 calls) |
| `.claude/commands/ckm/youtube/infographic.md` (×3) | `skills/youtube-handling/scripts/vidcap.py` (3 calls) |
| `.claude/commands/ckm/youtube/social.md` (×3) | `skills/youtube-handling/scripts/vidcap.py` (3 calls) |
| `.claude/commands/ckm/email/sequence.md` (×3) | `skills/email-marketing/references/*.md` (3 files) |

**Fix**: Update old skill name in paths. Example for `email/sequence.md`:
```
# Before
- `.claude/skills/email-marketing/references/automation-flows.md`
# After
- `.claude/skills/email/references/automation-flows.md`
```

For video and youtube scripts, replace `video-production` → `video` and `youtube-handling` → `youtube`.

### H2: Stale Skill Names in 18 Command Files

Commands instruct Claude to "Activate `email-marketing` skill" (or similar) — but those skill names no longer exist. Claude's auto-discovery won't find them.

Affected files and replacements needed:
| Stale Name | New Name | Files |
|-----------|---------|-------|
| `` `email-marketing` `` | `` `email` `` | `email.md`, `email/flow.md`, `email/sequence.md`, `campaign/email.md`, `campaign/create.md` |
| `` `video-production` `` | `` `video` `` | `video/create.md`, `video/script/create.md`, `video/storyboard/create.md` |
| `` `slides-design` `` | `` `slides` `` | `slides/create.md` |
| `` `youtube-handling` `` | `` `youtube` `` | `youtube/blog.md`, `youtube/infographic.md`, `youtube/social.md`, `write/blog/youtube.md` |
| `` `social-media` `` (as skill) | `` `social` `` | `social.md`, `social/schedule.md`, `youtube/social.md`, `write/publish.md`, `write/audit.md` |
| `` `test-orchestrator` `` | `` `test` `` | `test/workflow.md` |

Note: `social-media` as a **skill name** (not the `social-media-manager` agent) is stale. The `social-media-manager` agent references are valid — that agent still exists.

---

## Medium Priority Improvements

### M1: email SKILL.md Uses `<type>` Instead of `<args>`

The `email` SKILL.md uses `<type>$ARGUMENTS</type>` while all other merged skills use `<args>$ARGUMENTS</args>`. Only 2 of 11 skills in the codebase use `<type>` — this is a minor inconsistency but could confuse argument routing if the runtime expects `<args>`.

```yaml
# Current (email/SKILL.md line 14)
<type>$ARGUMENTS</type>

# Expected (consistent with other 9 skills)
<args>$ARGUMENTS</args>
```

**Fix**: Change `<type>` → `<args>` in `email/SKILL.md` line 14.

### M2: `social-media/references/hook-writing.md` Path in `write/publish.md`

Line 24 in `.claude/commands/ckm/write/publish.md`:
```
# Stale reference (not an absolute path, but still wrong skill name)
Rewrite using hook formulas from `social-media/references/hook-writing.md`
# Should be:
Rewrite using hook formulas from `social/references/hook-writing.md`
```

Same in `youtube/social.md` line 44: `` Reference `social-media/references/hook-writing.md` ``

### M3: Untracked Summary/Report Files

Several files are untracked that appear to be generated artifacts:
- `PLAN_SYNC_REPORT.md`
- `SKILL_CONSOLIDATION_SUMMARY.md`
- `plans/20260302-convert-commands-to-skills/COMPLETION_SUMMARY.md`
- `plans/20260302-convert-commands-to-skills/SYNC_VERIFICATION.md`

These should either be committed (if useful) or added to `.gitignore`.

---

## Low Priority Suggestions

### L1: `social/SKILL.md` version is `2.0.0`, others are `1.0.0`

Minor inconsistency — all 6 merged skills were new writes, but `social` has version `2.0.0` while `test`, `video`, `slides`, `email`, `youtube` all have `1.0.0`. Not a bug, but worth standardizing.

### L2: Old SKILL.md Stubs Still Exist in `brand-guidelines`, `campaign-management`, `seo-optimization`

According to git, these earlier-merged old dirs ARE already deleted and committed (not in current `git status`). The snapshot in the session context showed them as modified, but that was a prior state. Current state is clean for those 3.

---

## Positive Observations

- **File completeness**: All SKILL.md-referenced files (subcommands, scripts, templates, knowledge base) physically exist — no broken internal references within the skills themselves.
- **Frontmatter consistency**: All 6 SKILL.md files have required fields: `name`, `description`, `argument-hint`, `metadata.author`, `metadata.version`.
- **Routing pattern**: All 6 use the same 3-step routing pattern — consistent and correct.
- **`<args>` tag present**: 5 of 6 skills correctly use `<args>$ARGUMENTS</args>` (email is the outlier).
- **Old dirs deleted**: The 6 source skill dirs are removed from disk — no duplicates.
- **Agent names preserved**: `social-media-manager`, `email-wizard`, `content-creator` agent references are correctly left untouched (they are agents, not skill names).

---

## Recommended Actions

1. **[IMMEDIATE]** Stage and commit all unstaged merge changes (39 new files + 56 deletions) — see C1 fix.
2. **[HIGH]** Update 7 command files with broken absolute skill paths — see H1 fix list.
3. **[HIGH]** Update 18 command files with stale skill name references in backticks — see H2 table.
4. **[MEDIUM]** Fix `email/SKILL.md` line 14: `<type>` → `<args>`.
5. **[MEDIUM]** Fix relative path refs `social-media/references/hook-writing.md` → `social/references/hook-writing.md` in `write/publish.md` and `youtube/social.md`.
6. **[LOW]** Commit or gitignore the summary/report artifacts (`PLAN_SYNC_REPORT.md`, `SKILL_CONSOLIDATION_SUMMARY.md`).

---

## Plan Status Update

**Plan**: `plans/20260302-convert-commands-to-skills/phase-03-cleanup-and-validation.md`

The phase-03 plan marks all success criteria as `[x]` complete, but two criteria are not fully met:

| Criterion | Status |
|-----------|--------|
| All 74-75 new skills have valid SKILL.md | PASS |
| All skills loadable | PASS |
| Old commands directory removed | PASS (commands/ckm still exists with stale refs — not removed) |
| No broken references in hooks/workflows | **FAIL** — 7 files with broken paths, 18 files with stale names |
| Documentation updated | PASS |

**Recommendation**: Re-open phase-03 or create a follow-up task for the stale reference cleanup.

---

## Unresolved Questions

1. Are the `.claude/commands/ckm/` files being deprecated or kept in sync? If skills fully replace commands, the `commands/ckm/` directory should be removed (phase-03 plan mentions this but it was not done).
2. Is `<type>` vs `<args>` tag a deliberate semantic distinction (type-constrained input vs free-form args) or an oversight? If semantic, `email` may need separate routing logic.
