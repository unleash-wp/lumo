---
title: "Phase 2: Convert Subcommands"
status: completed
priority: P1
effort: 1.5h
completed: 2026-03-03
---

# Phase 2: Convert Subcommands (56 skills)

## Context
- Parent plan: [plan.md](plan.md)
- Source: `.claude/commands/ckm/{group}/*.md` and deeper
- Target: `.claude/skills/ckm-{group}-{sub}/SKILL.md`

## Naming Convention

| Command Path | Skill Dir | Skill Name |
|-------------|-----------|------------|
| `analyze/report.md` | `ckm-analyze-report/` | `ckm:analyze:report` |
| `brand/update.md` | `ckm-brand-update/` | `ckm:brand:update` |
| `plan/hard.md` | `ckm-plan-hard/` | `ckm:plan:hard` |
| `video/script/create.md` | `ckm-video-script-create/` | `ckm:video:script:create` |
| `write/blog/youtube.md` | `ckm-write-blog-youtube/` | `ckm:write:blog:youtube` |
| `skill/optimize/auto.md` | `ckm-skill-optimize-auto/` | `ckm:skill:optimize:auto` |

## Full Inventory (56 subcommands)

### analyze (1)
- `analyze/report.md` → `ckm-analyze-report/`

### brand (1)
- `brand/update.md` → `ckm-brand-update/`

### campaign (4)
- `campaign/analyze.md` → `ckm-campaign-analyze/`
- `campaign/create.md` → `ckm-campaign-create/`
- `campaign/email.md` → `ckm-campaign-email/`
- `campaign/status.md` → `ckm-campaign-status/`

### dashboard (1)
- `dashboard/check.md` → `ckm-dashboard-check/`

### docs (4)
- `docs/init.md` → `ckm-docs-init/`
- `docs/llms.md` → `ckm-docs-llms/`
- `docs/summarize.md` → `ckm-docs-summarize/`
- `docs/update.md` → `ckm-docs-update/`

### email (2)
- `email/flow.md` → `ckm-email-flow/`
- `email/sequence.md` → `ckm-email-sequence/`

### plan (8)
- `plan/archive.md` → `ckm-plan-archive/`
- `plan/ci.md` → `ckm-plan-ci/`
- `plan/cro.md` → `ckm-plan-cro/`
- `plan/fast.md` → `ckm-plan-fast/`
- `plan/hard.md` → `ckm-plan-hard/`
- `plan/parallel.md` → `ckm-plan-parallel/`
- `plan/two.md` → `ckm-plan-two/`
- `plan/validate.md` → `ckm-plan-validate/`

### seo (3)
- `seo/audit.md` → `ckm-seo-audit/`
- `seo/keywords.md` → `ckm-seo-keywords/`
- `seo/pseo.md` → `ckm-seo-pseo/`

### skill (7)
- `skill/add.md` → `ckm-skill-add/`
- `skill/create.md` → `ckm-skill-create/`
- `skill/fix-logs.md` → `ckm-skill-fix-logs/`
- `skill/optimize.md` → `ckm-skill-optimize/`
- `skill/optimize/auto.md` → `ckm-skill-optimize-auto/`
- `skill/plan.md` → `ckm-skill-plan/`
- `skill/update.md` → `ckm-skill-update/`

### slides (1)
- `slides/create.md` → `ckm-slides-create/`

### social (1)
- `social/schedule.md` → `ckm-social-schedule/`

### storage (4)
- `storage/list.md` → `ckm-storage-list/`
- `storage/sync.md` → `ckm-storage-sync/`
- `storage/upload.md` → `ckm-storage-upload/`
- `storage/url.md` → `ckm-storage-url/`

### test (2)
- `test/ui.md` → `ckm-test-ui/`
- `test/workflow.md` → `ckm-test-workflow/`

### video (3)
- `video/create.md` → `ckm-video-create/`
- `video/script/create.md` → `ckm-video-script-create/`
- `video/storyboard/create.md` → `ckm-video-storyboard-create/`

### write (9)
- `write/audit.md` → `ckm-write-audit/`
- `write/blog.md` → `ckm-write-blog/`
- `write/blog/youtube.md` → `ckm-write-blog-youtube/`
- `write/cro.md` → `ckm-write-cro/`
- `write/enhance.md` → `ckm-write-enhance/`
- `write/fast.md` → `ckm-write-fast/`
- `write/formula.md` → `ckm-write-formula/`
- `write/good.md` → `ckm-write-good/`
- `write/publish.md` → `ckm-write-publish/`

### youtube (3)
- `youtube/blog.md` → `ckm-youtube-blog/`
- `youtube/infographic.md` → `ckm-youtube-infographic/`
- `youtube/social.md` → `ckm-youtube-social/`

## Implementation Steps

Same transformation as Phase 1 but with path-to-name conversion:

1. Walk all subdirectories recursively
2. For each `.md` file, compute relative path from `commands/ckm/`
3. Convert path separators:
   - `/` → `-` for directory name
   - `/` → `:` for skill name
4. Strip `.md` extension
5. Create `skills/ckm-{dash-path}/SKILL.md` with transformed frontmatter

## Special Cases

- `storage/*.md` — Some have no YAML frontmatter (just `# Command:` header). Need to extract description from content.
- `skill/optimize/auto.md` — 3-level deep. Dir: `ckm-skill-optimize-auto/`
- `video/script/create.md` — 3-level deep. Dir: `ckm-video-script-create/`
- `write/blog/youtube.md` — 3-level deep. Dir: `ckm-write-blog-youtube/`

## Success Criteria
- [x] 56 new skill directories created
- [x] Each has valid SKILL.md with correct `ckm:` namespaced name
- [x] Deep paths correctly flattened (`:` in name, `-` in dir)
- [x] No existing skills modified
