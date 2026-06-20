# Phase 01: Schema and Utility Function

## Context
- Parent: [plan.md](plan.md)
- Brainstorm: [brainstorm-260125-1823-hooks-config-toggle.md](../reports/brainstorm-260125-1823-hooks-config-toggle.md)

## Overview
- **Priority**: P1 (blocking Phase 2)
- **Status**: done
- **Effort**: 30m

Add `hooks` schema to JSON Schema and implement `isHookEnabled()` utility.

## Key Insights

1. Config already uses cascading merge (DEFAULT → global → local)
2. `loadConfig()` already available in `ck-config-utils.cjs`
3. Hook names should match script basenames (without `.cjs`)

## Requirements

### Functional
- Schema validates `hooks` object with boolean properties
- `isHookEnabled(hookName)` returns `true` if undefined (default enabled)
- Function uses existing `loadConfig()` with cascading merge

### Non-functional
- Minimal performance overhead
- Backward compatible (no config = all enabled)

## Architecture

```
.ck.json
├── hooks: {                    # New section
│   "session-init": true,
│   "privacy-block": false,     # Example: disabled
│   ...
│ }

ck-config-utils.cjs
├── DEFAULT_CONFIG.hooks        # Add defaults (all true)
├── isHookEnabled(hookName)     # New exported function
└── loadConfig() updates        # Include hooks section
```

## Related Code Files

### Modify
1. `.claude/schemas/ck-config.schema.json` - Add hooks schema
2. `.claude/hooks/lib/ck-config-utils.cjs` - Add utility function

## Implementation Steps

### Step 1: Update Schema (`ck-config.schema.json`)

Add after `assertions` property:

```json
"hooks": {
  "type": "object",
  "description": "Toggle individual hooks on/off. Default: all enabled.",
  "properties": {
    "session-init": {
      "type": "boolean",
      "default": true,
      "description": "SessionStart hook - project detection and env setup"
    },
    "subagent-init": {
      "type": "boolean",
      "default": true,
      "description": "SubagentStart hook - injects context to subagents"
    },
    "dev-rules-reminder": {
      "type": "boolean",
      "default": true,
      "description": "UserPromptSubmit hook - injects dev rules context"
    },
    "usage-context-awareness": {
      "type": "boolean",
      "default": true,
      "description": "UserPromptSubmit/PostToolUse hook - usage limits awareness"
    },
    "scout-block": {
      "type": "boolean",
      "default": true,
      "description": "PreToolUse hook - blocks heavy directories"
    },
    "privacy-block": {
      "type": "boolean",
      "default": true,
      "description": "PreToolUse hook - blocks sensitive files"
    },
    "post-edit-simplify-reminder": {
      "type": "boolean",
      "default": true,
      "description": "PostToolUse hook - simplify reminder after edits"
    }
  },
  "additionalProperties": false
}
```

### Step 2: Update DEFAULT_CONFIG (`ck-config-utils.cjs`)

Add to DEFAULT_CONFIG object:

```javascript
hooks: {
  'session-init': true,
  'subagent-init': true,
  'dev-rules-reminder': true,
  'usage-context-awareness': true,
  'scout-block': true,
  'privacy-block': true,
  'post-edit-simplify-reminder': true
}
```

### Step 3: Add isHookEnabled Function

Add function before module.exports:

```javascript
/**
 * Check if a hook is enabled in config
 * Returns true if hook is not defined (default enabled)
 *
 * @param {string} hookName - Hook name (script basename without .cjs)
 * @returns {boolean} Whether hook is enabled
 */
function isHookEnabled(hookName) {
  const config = loadConfig({ includeProject: false, includeAssertions: false, includeLocale: false });
  const hooks = config.hooks || {};
  // Return true if undefined (default enabled), otherwise return the boolean value
  return hooks[hookName] !== false;
}
```

### Step 4: Update loadConfig to include hooks

In `loadConfig()` function, ensure hooks are included in result:

```javascript
// After line: result.skills = merged.skills || DEFAULT_CONFIG.skills;
result.hooks = merged.hooks || DEFAULT_CONFIG.hooks;
```

### Step 5: Export isHookEnabled

Add to module.exports:

```javascript
module.exports = {
  // ... existing exports
  isHookEnabled
};
```

## Todo List

- [ ] Add hooks schema to ck-config.schema.json
- [ ] Add DEFAULT_CONFIG.hooks in ck-config-utils.cjs
- [ ] Implement isHookEnabled() function
- [ ] Update loadConfig() to include hooks
- [ ] Export isHookEnabled in module.exports

## Success Criteria

- [ ] Schema validates hooks object correctly
- [ ] `isHookEnabled('session-init')` returns true (default)
- [ ] `isHookEnabled('privacy-block')` returns false when set to false in config
- [ ] Config cascading works (global → local override)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| loadConfig overhead | Low | Low | Already optimized, OS caches file reads |
| Schema validation breaks existing configs | Low | Medium | additionalProperties: false only on hooks object |

## Security Considerations

- No security implications - only controls hook execution
- Defaults to enabled (fail-safe)

## Next Steps

After completion: Proceed to [Phase 02](phase-02-update-hooks.md) to update all hook files.
