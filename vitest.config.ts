import { defineConfig } from 'vitest/config';

// Scope tests to src/ and tests/ only.
// Exclude .claude/ — the ClaudeKit scaffold ships standalone *.test.cjs scripts
// there (they call process.exit) that are not Vitest suites.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.claude/**', '.git/**'],
  },
});
