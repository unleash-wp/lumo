# Update ck:frontend-design From Upstream

## Outcome

Refresh `ck:frontend-design` with current upstream frontend-design guidance from Anthropic while preserving ClaudeKit-specific workflow routing, anti-slop references, and user-level sync.

## Source

- Upstream: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- Local skill: `claude/skills/frontend-design/SKILL.md`
- User-level sync target: `/Users/duynguyen/.agents/skills/frontend-design`

## Phases

- [x] [Phase 01: skill update and sync](./phase-01-skill-update-sync.md)

## Acceptance Criteria

- [x] Local `ck:frontend-design` includes the upstream concepts that are missing today.
- [x] Existing ClaudeKit references and anti-slop guardrails remain intact.
- [x] Generated skill catalogs are refreshed if scanner output changes.
- [x] Skill frontmatter, cross-references, lint, and tests pass.
- [x] User-level skill directory matches the repo skill directory and validates directly.
- [ ] Beta PR is shipped, merged, and target-branch CI/release state is verified or blocked with evidence.

## Validation Gates

- Plan validation: passed. Scope is a feature-route skill refresh with no runtime behavior change.
- Red-team review: passed. Main risk is over-importing upstream prose; mitigation is concise integration into existing ClaudeKit workflow.
- Local validation: passed. `scan_skills.py`, frontmatter, crossrefs, lint, and `npm test` are green.
- User-level sync check: passed. `diff -ru`, `cmp`, and user-level `quick_validate.py` are green.

## Open Questions

None.
