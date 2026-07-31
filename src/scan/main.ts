#!/usr/bin/env node
/**
 * lumo-scan: one-shot proactive catch for the developer's current changes.
 *
 * Thin process shell around runScan() (./run-scan.js): prints the returned
 * lines and sets the exit code. All scan logic, argument handling, git diff,
 * catch, the CI gate, lives in run-scan.ts so tests can drive it without a
 * child process or a real git repository.
 *
 * Entry point: bin/lumo-scan (via package.json#bin.lumo-scan → dist/scan.mjs)
 */

import { runScan } from './run-scan.js';

async function main(): Promise<void> {
  const { lines, exitCode } = await runScan();
  for (const line of lines) {
    console.log(line);
  }
  // process.exitCode, not process.exit(): stdout to a pipe flushes
  // asynchronously on POSIX, and exit() here could truncate findings
  // mid-print in CI logs.
  process.exitCode = exitCode;
}

main().catch(() => {
  // Top-level safety net, never let an unhandled rejection surface.
  process.exit(0);
});
