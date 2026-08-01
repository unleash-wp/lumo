#!/usr/bin/env node
/**
 * `lumo`: the default binary.
 *
 * npm resolves `npx @unleashwp/lumo <cmd>` to the bin whose name matches the
 * package's last path segment. Without a bin literally named `lumo`, the
 * documented flagship command (`npx @unleashwp/lumo scan`) fails with
 * "could not determine executable to run", so this dispatcher exists to make
 * the advertised entry point real.
 *
 * Subcommands are lazily imported: `scan` must not pull the MCP SDK into
 * memory, and `mcp` must not pull the GitHub Action deps.
 */

const HELP = `UnleashWP Lumo — the WordPress AI code watcher (English).

Start here (30 seconds, no account):
  lumo demo

Usage: lumo <command>

Commands:
  demo     Prove the catch on four shipped samples (real engine, real findings).
  check    Check whole file contents (what scan cannot see in committed code).
           Example: lumo check path/to/plugin.php
  scan     Scan your current git DIFF only for patterns that broke in a release.
           Not a whole-tree audit. Quiet ≠ clean.
  mcp      Start the LOCAL Free MCP (bundled snapshot). Hosted Pro MCP is paid
           only: https://mcp.unleash-wp.com/connect (Solo Hosted / Pro / Team 20).
  skills   Install WordPress agent-skills (the manual; Lumo is the watcher).
  action   GitHub Action runner (Lumo Pro / Team 20 licence required).

Products: Free (local) · Starter 39€ · Agent Team 99€ · Solo Hosted 149€ / Pro / Team 20 (hosted MCP).
Free gets nothing from the Pro server. Lumo stays English. AI Forge local UI may offer DE.`;

async function main(): Promise<void> {
  const cmd = process.argv[2];

  switch (cmd) {
    case 'demo':
      await import('../demo/main.js');
      return;
    case 'check':
      await import('../check/main.js');
      return;
    case 'scan':
      await import('../scan/main.js');
      return;
    case 'mcp':
      await import('../mcp/server.js');
      return;
    case 'skills':
      await (await import('./skills.js')).installWordPressAgentSkills();
      return;
    case 'action':
      await import('../action/main.js');
      return;
    case undefined:
    case '-h':
    case '--help':
    case 'help':
      console.log(HELP);
      return;
    case '-v':
    case '--version': {
      const pkg = (await import('../../package.json')).default as { version: string };
      console.log(pkg.version);
      return;
    }
    default:
      console.error(`lumo: unknown command "${cmd}"\n`);
      console.error(HELP);
      process.exitCode = 1;
  }
}

void main();
