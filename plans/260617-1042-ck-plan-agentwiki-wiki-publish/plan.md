---
title: ck-plan AgentWiki wiki publish flag
description: ''
status: in-progress
priority: P2
effort: 2h
issue: 836
branch: codex/ck-plan-wiki-publish
tags:
  - feature
  - skill
  - agentwiki
blockedBy: []
blocks: []
created: '2026-06-17T03:43:43.385Z'
createdBy: 'ck:plan'
source: skill
---

# ck-plan AgentWiki wiki publish flag

## Overview

Add a composable `--wiki` flag to `ck:plan`. When present, the skill publishes
the final plan artifact to AgentWiki after validation gates:

- Markdown docs use AgentWiki document create/upload + publish/share.
- HTML plans use AgentWiki static site upload when available.
- Prefer CLI when `agentwiki` is installed and authenticated; use AgentWiki MCP
  document/file/site tools when exposed; otherwise skip without blocking plan
  creation.

Scope is instruction/catalog only. No runtime `ck` CLI implementation changes.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Skill Wiki Flag Semantics](./phase-01-skill-wiki-flag-semantics.md) | Completed |
| 2 | [Catalog And User Skill Sync](./phase-02-catalog-and-user-skill-sync.md) | Completed |
| 3 | [Validation And Beta Ship](./phase-03-validation-and-beta-ship.md) | In Progress |

## Dependencies

- Builds on prior `ck-plan --html` and `--github` behavior.
- `agentwiki` CLI is available locally and authenticated during planning.
- AgentWiki MCP document/upload/site list tools are discoverable in this
  Codex session, but CLI remains the concrete publish command surface.
- GitHub issue: https://github.com/claudekit/claudekit-engineer/issues/836

## Acceptance Criteria

- [ ] `ck:plan` frontmatter advertises `--wiki`.
- [ ] `--wiki` semantics are documented as composable with Markdown,
  `--html`, and `--github`.
- [ ] Wiki publish chooses AgentWiki CLI or MCP only when available and never
  blocks plan creation if unavailable.
- [ ] Markdown plans publish as AgentWiki documents with title, description,
  category/tags, and returned document/published/share URL.
- [ ] HTML plans publish through AgentWiki hosted static site upload and record
  the returned site URL.
- [ ] Generated skill catalogs reflect the new argument hint/description.
- [ ] USER-level `/Users/duynguyen/.agents/skills/ck-plan` matches repo skill.
- [ ] Lint/tests pass before beta ship.

## Validation Log

### Plan Validation

- Repo: `claudekit/claudekit-engineer`
- Branch: `codex/ck-plan-wiki-publish` from `origin/dev`
- Issue: https://github.com/claudekit/claudekit-engineer/issues/836
- Route: feature
- Mode: beta
- Source skill: `claude/skills/ck-plan`
- Existing overlap: prior HTML/GitHub plan is informational, not blocking.
- AgentWiki CLI: available and authenticated.
- AgentWiki MCP: document/upload/site metadata tools discoverable.

### Red Team Review

- Risk: `--wiki` could leak private local paths or secrets into AgentWiki.
  Mitigation: require redaction and repo-relative paths before publish.
- Risk: missing AgentWiki auth could block planning.
  Mitigation: publish is best-effort unless user explicitly requires it.
- Risk: HTML static-site publish could fail if the file is not self-contained.
  Mitigation: reuse existing `--html` portability checks before upload.
- Risk: CLI and MCP capabilities differ.
  Mitigation: document deterministic CLI commands and MCP fallback by capability.

### Whole-Plan Consistency Sweep

- Files reread: `plan.md`, all phase files.
- Reconciled stale references: 0
- Unresolved contradictions: 0

### Implementation Validation

- `python3 claude/scripts/scan_skills.py` passed.
- `python3 claude/skills/skill-creator/scripts/quick_validate.py claude/skills/ck-plan` passed.
- `python3 claude/skills/skill-creator/scripts/package_skill.py claude/skills/ck-plan /tmp/claudekit-skill-packages` passed.
- `python3 claude/scripts/validate-skill-frontmatter.py claude/skills/ck-plan/SKILL.md` passed.
- `python3 claude/scripts/validate-skill-crossrefs.py claude/skills` passed.
- `npm run lint` passed.
- `npm test` passed: 90 Node tests and 27 Python tests.

Unresolved questions:
- None
