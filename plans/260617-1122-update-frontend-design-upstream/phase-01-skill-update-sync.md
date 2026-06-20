# Phase 01: Skill Update And Sync

## Context Links

- Plan: `plans/260617-1122-update-frontend-design-upstream/plan.md`
- Upstream source: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- Local skill: `claude/skills/frontend-design/SKILL.md`
- Generated catalogs: `claude/scripts/skills_data.yaml`, `guide/SKILLS.yaml`, `guide/SKILLS.md`, `scripts/skills_data.yaml`

## Overview

Priority: high
Status: complete
Description: Merge upstream design-lead guidance into the existing ClaudeKit frontend skill without replacing local workflow references.

## Requirements

1. Preserve `ck:frontend-design` metadata and current workflow/reference table.
2. Add missing upstream principles:
   - Ground design in subject, audience, and page job.
   - Treat hero as thesis, not a generic metric/stat block.
   - Make structure encode content meaning.
   - Use a two-pass design plan with compact tokens and ASCII wireframes.
   - Critique default AI design looks before build.
   - Add CSS specificity caution.
   - Add restraint and copywriting guidance for labels, errors, empty states, and actions.
3. Keep `SKILL.md` under 300 lines.
4. Sync the whole skill directory to `/Users/duynguyen/.agents/skills/frontend-design` after validation.

## Implementation Steps

1. [x] Edit `claude/skills/frontend-design/SKILL.md` in place.
2. [x] Run skill catalog scanner and inspect generated file diffs.
3. [x] Run frontmatter, cross-reference, lint, and test gates.
4. [x] Copy repo skill directory to user-level path.
5. [x] Compare repo and user-level directories.
6. [x] Validate user-level `SKILL.md` directly.
7. [ ] Commit, push, open beta PR, merge, and watch beta CI/release.

## Success Criteria

- [x] Repo and user-level frontend skill directories are byte-equivalent after sync.
- [x] Validation output is green.
- [ ] PR is merged to beta target and checked after merge.

## Risk Assessment

- Risk: importing upstream text verbatim creates duplication with existing references.
- Mitigation: fold concepts into concise local instructions and preserve reference-first structure.

## Security Considerations

- No secrets or customer data involved.
- Do not include private local paths in public issue/PR except the user-requested sync target if needed in local completion notes.

## Open Questions

None.
