import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    mcp: 'src/mcp/server.ts',
    // GitHub Action entry point — produces dist/action.mjs referenced by action.yml.
    action: 'src/action/main.ts',
    // Hook catch runner — called by .claude/hooks/wp-enforce.cjs via dynamic import().
    // Bundles checkCode + formatCatch with no MCP/transport deps.
    'hook-catch': 'src/hook/catch-runner.ts',
  },
  format: ['esm'],
  outDir: 'dist',
  outExtension: () => ({ js: '.mjs' }),
  target: 'node22',
  splitting: false,
  sourcemap: false,
  clean: true,
  // Bundle all deps so the MCP bin works without a node_modules install and
  // the Action entry point is a single self-contained file for GitHub's runner.
  noExternal: ['@modelcontextprotocol/sdk', 'zod', '@actions/core', '@actions/github'],
});
