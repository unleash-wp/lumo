---
title: ck-ship AgentWiki journal publish
description: >-
  Teach ck:ship to optionally publish ship journal notes to AgentWiki when the
  CLI or MCP surface is available.
status: completed
priority: P2
effort: 1h
branch: codex/ck-ship-agentwiki-journal
tags:
  - skill
  - ship
  - journal
  - agentwiki
blockedBy: []
blocks: []
created: '2026-06-15T00:00:00+07:00'
createdBy: 'ck:vibe'
source: user-request
---

# ck-ship AgentWiki journal publish

## Overview

Update `ck:ship` so its journal step checks for `agentwiki` CLI or AgentWiki MCP. If either exists, publish the technical diary or journal note with title, summary, tags, category, and project folder placement. If neither exists, skip the publish step without blocking ship.

## Acceptance Criteria

- [ ] `ck:ship` frontmatter mentions optional AgentWiki journal publishing.
- [ ] Ship workflow documents CLI-first, MCP-second AgentWiki detection.
- [ ] AgentWiki publish is non-blocking when unavailable.
- [ ] Journal notes include summary, tags, category, and project folder placement.
- [ ] Generated skill catalogs reflect the updated skill metadata.
- [ ] USER-level `/Users/duynguyen/.agents/skills/ship/SKILL.md` matches repo skill.
- [ ] Lint and tests pass before shipping.

## Implementation

1. Update existing ship skill instructions only.
2. Regenerate checked-in skill catalogs.
3. Validate skill metadata and run repo lint/tests.
4. Sync the user-level skill copy and verify byte-for-byte equality.
5. Ship beta PR to `dev`.

## Validation Log

- README read.
- Installed repo rules read from `claude/rules/CLAUDE.md`, `primary-workflow.md`, `development-rules.md`, `orchestration-protocol.md`, and `documentation-management.md`.
- Existing ship skill and references read.
- AgentWiki MCP document tools found.
- `agentwiki` CLI found and authenticated.
- `python3 claude/scripts/scan_skills.py` passed.
- `python3 claude/skills/skill-creator/scripts/quick_validate.py claude/skills/ship` passed.
- `python3 claude/skills/skill-creator/scripts/package_skill.py claude/skills/ship /tmp/claudekit-skill-packages` passed.
- `npm run lint` passed.
- `npm test` passed: 90 Node tests and 27 Python tests.
- USER-level `/Users/duynguyen/.agents/skills/ship/SKILL.md` sync verified with `cmp -s`.

Unresolved questions:
- None
