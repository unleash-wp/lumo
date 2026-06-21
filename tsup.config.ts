import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { mcp: 'src/mcp/server.ts' },
  format: ['esm'],
  outDir: 'dist',
  outExtension: () => ({ js: '.mjs' }),
  target: 'node22',
  splitting: false,
  sourcemap: false,
  clean: true,
  // Bundle all deps into the single output file so IDEs can spawn the bin
  // without a node_modules install in the dist directory.
  noExternal: ['@modelcontextprotocol/sdk', 'zod'],
});
