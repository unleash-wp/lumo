import { defineConfig } from 'vitest/config';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// State-dir containment. resolveStateDir() falls back to ~/.lumo, so any test
// that reaches a state-writing path would persist into the developer's real
// install: a teaser marker written here mutes the next real teaser. Pointing
// CLAUDE_PLUGIN_DATA at a throwaway dir makes that impossible for the whole
// suite, instead of relying on every test remembering to pass a temp dir.
const TEST_STATE_DIR = mkdtempSync(join(tmpdir(), 'lumo-suite-state-'));

// Scope tests to src/ and tests/ only.
// Exclude .claude/: the ClaudeKit scaffold ships standalone *.test.cjs scripts
// there (they call process.exit) that are not Vitest suites.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.claude/**', '.git/**'],
    env: { CLAUDE_PLUGIN_DATA: TEST_STATE_DIR },
  },
});
