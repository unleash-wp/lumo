# Phase 02: Update Hook Files

## Context
- Parent: [plan.md](plan.md)
- Depends on: [Phase 01](phase-01-schema-and-utility.md)

## Overview
- **Priority**: P1
- **Status**: done
- **Effort**: 30m

Update all 7 hook scripts to check enabled state before executing.

## Key Insights

1. All hooks already import from `./lib/ck-config-utils.cjs`
2. Early exit with `process.exit(0)` is non-blocking
3. Check should be at top of main() function, after imports

## Requirements

### Functional
- Each hook imports `isHookEnabled` from lib
- Each hook exits silently (code 0) if disabled
- Check happens before any other logic

### Non-functional
- Minimal code addition (~3 lines per hook)
- Consistent pattern across all hooks

## Architecture

```
hook.cjs
├── imports
├── isHookEnabled check  ← NEW (early exit if disabled)
├── main()
└── ...
```

## Related Code Files

### Modify
1. `.claude/hooks/session-init.cjs`
2. `.claude/hooks/subagent-init.cjs`
3. `.claude/hooks/dev-rules-reminder.cjs`
4. `.claude/hooks/usage-context-awareness.cjs`
5. `.claude/hooks/scout-block.cjs`
6. `.claude/hooks/privacy-block.cjs`
7. `.claude/hooks/post-edit-simplify-reminder.cjs`

## Implementation Steps

### Pattern for Each Hook

Add after existing imports, before main():

```javascript
const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

// Early exit if hook disabled in config
if (!isHookEnabled('hook-name-here')) {
  process.exit(0);
}
```

### Step 1: session-init.cjs

Import already exists. Add check after imports (around line 38):

```javascript
// Early exit if hook disabled in config
if (!isHookEnabled('session-init')) {
  process.exit(0);
}
```

Note: Need to add `isHookEnabled` to the existing require statement.

### Step 2: subagent-init.cjs

Import already exists. Add check after imports (around line 24):

```javascript
// Early exit if hook disabled in config
if (!isHookEnabled('subagent-init')) {
  process.exit(0);
}
```

### Step 3: dev-rules-reminder.cjs

Add import and check after existing requires (around line 20):

```javascript
const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

// Early exit if hook disabled in config
if (!isHookEnabled('dev-rules-reminder')) {
  process.exit(0);
}
```

### Step 4: usage-context-awareness.cjs

Add import and check after existing requires:

```javascript
const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

// Early exit if hook disabled in config
if (!isHookEnabled('usage-context-awareness')) {
  process.exit(0);
}
```

### Step 5: scout-block.cjs

Add import and check after existing requires:

```javascript
const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

// Early exit if hook disabled in config
if (!isHookEnabled('scout-block')) {
  process.exit(0);
}
```

### Step 6: privacy-block.cjs

Add import and check after existing requires (around line 29):

```javascript
const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

// Early exit if hook disabled in config
if (!isHookEnabled('privacy-block')) {
  process.exit(0);
}
```

### Step 7: post-edit-simplify-reminder.cjs

Add import and check after existing requires:

```javascript
const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

// Early exit if hook disabled in config
if (!isHookEnabled('post-edit-simplify-reminder')) {
  process.exit(0);
}
```

## Todo List

- [ ] Update session-init.cjs (add isHookEnabled to import + check)
- [ ] Update subagent-init.cjs (add isHookEnabled to import + check)
- [ ] Update dev-rules-reminder.cjs (add import + check)
- [ ] Update usage-context-awareness.cjs (add import + check)
- [ ] Update scout-block.cjs (add import + check)
- [ ] Update privacy-block.cjs (add import + check)
- [ ] Update post-edit-simplify-reminder.cjs (add import + check)

## Success Criteria

- [ ] Each hook has isHookEnabled check at top level
- [ ] Setting `hook-name: false` in .ck.json disables that hook
- [ ] All hooks still work when enabled (no regression)
- [ ] Disabled hooks exit silently (exit code 0)

## Testing Checklist

Manual test for each hook:

1. Add to `.claude/.ck.json`:
   ```json
   "hooks": {
     "session-init": false
   }
   ```
2. Trigger hook (e.g., start new session)
3. Verify hook doesn't execute
4. Remove config, verify hook executes again

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Import path wrong | Low | Medium | All hooks already use same pattern |
| Check blocks legitimate execution | Low | Medium | Default is enabled (true) |
| Exit code breaks something | Low | Low | Exit 0 is already used for success |

## Security Considerations

- No security implications
- Disabled privacy-block could expose sensitive files (user's choice)

## Next Steps

After completion:
- Test all hooks manually
- Update documentation if needed
- Consider adding to README
