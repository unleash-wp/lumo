#!/usr/bin/env node
/**
 * CI smoke test: spawn dist/mcp.mjs over stdio, send MCP initialize + tools/list,
 * assert both lumo_audit and lumo_lookup are registered.
 *
 * Exits 0 on success, 1 on any failure.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, '..', 'dist', 'mcp.mjs');

// lumo_check_code is the product. It was missing from this list, so the one
// check that runs the built server against a real client would have passed with
// the catch tool gone.
const REQUIRED_TOOLS = ['lumo_audit', 'lumo_lookup', 'lumo_check_code'];
const TIMEOUT_MS = 10_000;

function fail(msg) {
  console.error(`[smoke] FAIL: ${msg}`);
  process.exit(1);
}

const child = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

let buffer = '';
let messageId = 1;

function send(obj) {
  const msg = JSON.stringify(obj);
  child.stdin.write(msg + '\n');
}

function nextId() {
  return messageId++;
}

const timeout = setTimeout(() => {
  child.kill();
  fail('timed out waiting for tools/list response');
}, TIMEOUT_MS);

child.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';

  for (const line of lines) {
    if (!line.trim()) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      // non-JSON line (e.g. debug output), skip
      continue;
    }

    // Step 1: server responds to initialize — send initialized notification, then tools/list
    if (msg.id === 1 && msg.result?.serverInfo) {
      send({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
      send({ jsonrpc: '2.0', id: nextId(), method: 'tools/list', params: {} });
      continue;
    }

    // Step 2: tools/list response
    if (msg.id != null && msg.result?.tools) {
      clearTimeout(timeout);
      child.kill();

      const names = msg.result.tools.map((t) => t.name);
      console.log('[smoke] tools listed:', names.join(', '));

      for (const required of REQUIRED_TOOLS) {
        if (!names.includes(required)) {
          fail(`missing tool: ${required} — got [${names.join(', ')}]`);
        }
      }

      console.log('[smoke] PASS — all required tools registered');
      process.exit(0);
    }
  }
});

child.on('error', (err) => {
  clearTimeout(timeout);
  fail(`child process error: ${err.message}`);
});

child.on('exit', (code, signal) => {
  clearTimeout(timeout);
  if (signal !== 'SIGTERM' && code !== 0) {
    fail(`server exited unexpectedly with code ${String(code)}`);
  }
});

// Send MCP initialize handshake
send({
  jsonrpc: '2.0',
  id: nextId(),
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'lumo-smoke-test', version: '0.0.1' },
  },
});
