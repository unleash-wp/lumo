---
status: in_progress
created: 2026-06-17
mode: beta
route: feature
---

# Brainstorm HTML, Wiki, and Problem-First Update

## Outcome

Update `ck:brainstorm` so it supports:

- `--html`: create an additional self-contained editorial magazine HTML report.
- `--wiki`: publish markdown and HTML outputs through `agentwiki` CLI/MCP when available.
- `problem-first`: bundled reference and activation rule for solution-jumping or idea-triage prompts.

## Scope

- Modify `claude/skills/brainstorm/SKILL.md`.
- Add concise reference files under `claude/skills/brainstorm/references/`.
- Regenerate checked-in skill catalogs.
- Validate changed skill metadata and run repo tests/lint.

## Acceptance Criteria

- [ ] `ck:brainstorm` documents `--html`, `--wiki`, and combined usage.
- [ ] HTML mode routes agents to the editorial magazine reference without bloating `SKILL.md`.
- [ ] Wiki mode detects `agentwiki` CLI first, then MCP, and skips gracefully when unavailable.
- [ ] Problem-first reference is bundled and triggered for proposed-solution, roadmap, and idea-triage prompts.
- [ ] Catalogs reflect the new skill metadata/reference status.
- [ ] Relevant validation passes.

## Risks

- Avoid implying brainstorm may implement code; hard gates remain intact.
- Avoid making `--wiki` mandatory; publish only when tooling is available or user requested the flag.
- Keep references one level from `SKILL.md` for progressive disclosure.

## Validation

- Run skill frontmatter validation.
- Run skill creator quick validation on the brainstorm skill.
- Run catalog regeneration and confirm expected diff.
- Run `npm run lint` and `npm test`.

Unresolved questions:
- None.
