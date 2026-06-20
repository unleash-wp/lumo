#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

// Early exit if hook disabled in config
if (!isHookEnabled('descriptive-name')) {
  process.exit(0);
}

try {
  let injectedPrompt = `## File naming guidance:
- Prefer kebab-case for JS/TS/Python/shell files with descriptive names
- For Markdown/plain text reports and plans, include workflow + scope in the filename
- Avoid generic report names like red-team-review.md, review.md, report.md, or notes.md
- Goal: self-documenting names for LLM tools (Grep, Glob, Search)`

  console.log(JSON.stringify({
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "allow",
      "additionalContext": injectedPrompt
    }
  }));

  // All paths allowed
  process.exit(0);

} catch (error) {
  // Fail-open for unexpected errors
  console.error('WARN: Hook error, allowing operation -', error.message);
  process.exit(0);
}
