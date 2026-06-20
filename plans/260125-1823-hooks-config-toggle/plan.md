---
title: "Hooks Configuration Toggle"
description: "Add hooks field to .ck.json for enabling/disabling individual hooks"
status: completed
priority: P2
effort: 1h
branch: goon
tags: [hooks, configuration, ck-json]
created: 2026-01-25
---

# Hooks Configuration Toggle

Allow users to enable/disable individual hooks via `.ck.json` configuration.

## Context

- Brainstorm: [brainstorm-260125-1823-hooks-config-toggle.md](reports/brainstorm-260125-1823-hooks-config-toggle.md)
- Current hooks: 7 total in `.claude/hooks/`
- Config system: cascading merge (user → project)

## Implementation Phases

| Phase | Description | Status | Effort |
|-------|-------------|--------|--------|
| [Phase 01](phase-01-schema-and-utility.md) | Schema + isHookEnabled utility | ✅ done | 30m |
| [Phase 02](phase-02-update-hooks.md) | Update all 7 hook files | ✅ done | 30m |

## Success Criteria

- [x] `hooks` object in `.ck.json` schema validated
- [x] `isHookEnabled(hookName)` function works with cascading config
- [x] All 7 hooks check enabled state before executing
- [x] Setting `hook-name: false` disables that hook
- [x] Undefined hooks default to enabled (true)

## Files Modified

### Phase 1 (Schema + Utility)
- `.claude/schemas/ck-config.schema.json`
- `.claude/hooks/lib/ck-config-utils.cjs`

### Phase 2 (Hook Updates)
- `.claude/hooks/session-init.cjs`
- `.claude/hooks/subagent-init.cjs`
- `.claude/hooks/dev-rules-reminder.cjs`
- `.claude/hooks/usage-context-awareness.cjs`
- `.claude/hooks/scout-block.cjs`
- `.claude/hooks/privacy-block.cjs`
- `.claude/hooks/post-edit-simplify-reminder.cjs`

## Risks

| Risk | Mitigation |
|------|------------|
| Performance overhead | loadConfig() already cached by OS, minimal impact |
| Breaking existing setups | Defaults to true, backward compatible |
