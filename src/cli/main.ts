#!/usr/bin/env node
/**
 * `lumo` — the default binary.
 *
 * npm resolves `npx @unleashwp/lumo <cmd>` to the bin whose name matches the
 * package's last path segment. Without a bin literally named `lumo`, the
 * documented flagship command (`npx @unleashwp/lumo scan`) fails with
 * "could not determine executable to run" — so this dispatcher exists to make
 * the advertised entry point real.
 *
 * Subcommands are lazily imported: `scan` must not pull the MCP SDK into
 * memory, and `mcp` must not pull the GitHub Action deps.
 */

const HELP = `UnleashWP Lumo — catches stale AI-written WordPress code.

Usage: lumo <command>

Commands:
  scan     Scan your current git diff for WordPress/WooCommerce patterns that
           broke in a real release. Prints findings (LOUD first) or the scope
           that was checked — never a verdict on your code.
  mcp      Start the MCP server on stdio (for Claude Code, Cursor, VS Code).
  skills   Install the official WordPress agent skills (WordPress/agent-skills)
           — the manual to Lumo's watcher. Delegates to their installer.
  action   GitHub Action runner (used by the bundled action.yml in CI).

Run without arguments to print this help.`;

async function main(): Promise<void> {
  const cmd = process.argv[2];

  switch (cmd) {
    case 'scan':
      await import('../scan/main.js');
      return;
    case 'mcp':
      await import('../mcp/server.js');
      return;
    case 'skills':
      await (await import('./skills.js')).installOfficialSkills();
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
