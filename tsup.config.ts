import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    // Default binary — `npx @unleashwp/lumo <cmd>` resolves the bin named after
    // the package, so this dispatcher is what makes the advertised command real.
    lumo: 'src/cli/main.ts',
    mcp: 'src/mcp/server.ts',
    // GitHub Action entry point — produces dist/action.mjs referenced by action.yml.
    action: 'src/action/main.ts',
    // Hook catch runner — called by .claude/hooks/wp-enforce.cjs via dynamic import().
    // Bundles checkCode + formatCatch with no MCP/transport deps.
    'hook-catch': 'src/hook/catch-runner.ts',
    // One-shot proactive scan CLI — `npx @unleashwp/lumo scan` / `lumo-scan`.
    // Runs git diff → diff-parser → catch → prints findings or dated-clean message.
    scan: 'src/scan/main.ts',
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
  // @actions/github and its transitive deps are CommonJS and reach for node
  // built-ins through require() at runtime. In an ESM bundle that call hits
  // esbuild's stub and throws 'Dynamic require of "net" is not supported' —
  // which is exactly how far `lumo action` got: it died before reading a
  // single input, in the published package as well as in CI. Handing the
  // bundle a real require closes that gap.
  banner: {
    js: "import { createRequire as __lumoCreateRequire } from 'node:module';\nconst require = __lumoCreateRequire(import.meta.url);",
  },
});
