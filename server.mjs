// AI Forge plugin surface for Lumo — the knowledge layer that feeds the Forge.
//
// AI Forge is the platform; this file is the zero-dependency adapter that makes
// the Lumo knowledge base (data/snapshot.json, curated + source-verified) a
// first-class Forge plugin: installable via `github:unleash-wp/lumo`, served
// through `uwp mcp` alongside changelog/contributors.
//
// Two tools, honest split:
//   forge_wp_lookup     — pure data: query the bundled snapshot (always works).
//   forge_wp_check_code — the live catch, delegated to the REAL Lumo engine by
//                         spawning the installed `lumo-mcp` binary (npm package
//                         @unleashwp/lumo). The precision engine is never
//                         reimplemented here; without the binary the tool
//                         degrades to an install hint — it never guesses.
//
// Zero runtime dependencies, plain Node >=18 — matches the Forge contract.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const DIR = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Snapshot loading (cached per process; a few hundred KB of JSON)
// ---------------------------------------------------------------------------

let snapshotCache = null;
function loadSnapshot() {
  if (snapshotCache) return snapshotCache;
  const raw = readFileSync(join(DIR, 'data', 'snapshot.json'), 'utf8');
  snapshotCache = JSON.parse(raw);
  return snapshotCache;
}

// ---------------------------------------------------------------------------
// Lookup — simple deterministic scoring over slug/title/summary/category.
// ---------------------------------------------------------------------------

function scoreEntry(entry, terms) {
  const slug = entry.slug.toLowerCase();
  const title = entry.title.toLowerCase();
  const summary = (entry.summary || '').toLowerCase();
  const category = (entry.category_slug || '').toLowerCase();
  let score = 0;
  for (const t of terms) {
    if (slug.includes(t)) score += 4;
    if (title.includes(t)) score += 3;
    if (category.includes(t)) score += 2;
    if (summary.includes(t)) score += 1;
  }
  return score;
}

function renderEntry(entry, generatedAt) {
  const out = [`# ${entry.title}`, '', entry.summary];
  if (entry.bad_pattern) out.push('', '## Wrong pattern', '```php', entry.bad_pattern, '```');
  if (entry.code_example) out.push('', '## Correct pattern', '```php', entry.code_example, '```');
  const v = (entry.versions || [])[0];
  if (v) {
    const parts = [];
    if (v.woo_version_min) parts.push(`WooCommerce ≥ ${v.woo_version_min}`);
    if (v.wp_version_min) parts.push(`WordPress ≥ ${v.wp_version_min}`);
    if (parts.length) out.push('', `**Affected:** ${parts.join(' · ')}${v.breaking_change ? ' (breaking change)' : ''}`);
  }
  if (entry.source_url) out.push('', `**Source:** ${entry.source_url}`);
  if (entry.test_step) out.push('', `**Verify:** ${entry.test_step}`);
  if (generatedAt) out.push('', `_Knowledge as of ${String(generatedAt).slice(0, 10)}._`);
  return out.join('\n');
}

function lookup(topic, top) {
  const snap = loadSnapshot();
  const terms = String(topic).toLowerCase().split(/[^a-z0-9_./-]+/).filter((t) => t.length > 1);
  if (terms.length === 0) return { found: false, text: 'Pass a topic, e.g. "HPOS", "apiVersion", "escaping".' };
  const ranked = snap.entries
    .map((e) => ({ e, s: scoreEntry(e, terms) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);
  if (ranked.length === 0) {
    return { found: false, text: `No knowledge entry matches "${topic}" (${snap.entries.length} entries searched).` };
  }
  const parts = [renderEntry(ranked[0].e, snap.generatedAt)];
  const also = ranked.slice(1, top).map((r) => `- ${r.e.slug} — ${r.e.title}`);
  if (also.length) parts.push('', '**Related entries:**', ...also);
  return { found: true, text: parts.join('\n') };
}

// ---------------------------------------------------------------------------
// Live catch — delegate to the installed @unleashwp/lumo MCP binary.
// One JSON-RPC roundtrip over stdio, bounded; never reimplements the engine.
// ---------------------------------------------------------------------------

const INSTALL_HINT =
  'The live catch needs the Lumo engine: `npm install -g @unleashwp/lumo` ' +
  '(or set LUMO_MCP_BIN to the lumo-mcp binary). The bundled knowledge lookup ' +
  '(forge_wp_lookup) works without it.';

function checkCodeViaEngine(code, language) {
  return new Promise((resolve) => {
    const bin = process.env.LUMO_MCP_BIN || 'lumo-mcp';
    // A .mjs/.js target (e.g. a repo checkout's dist/mcp.mjs) has no shebang on
    // every platform — run it through node; a bare binary name goes to PATH.
    const viaNode = /\.(mjs|cjs|js)$/.test(bin);
    let srv;
    try {
      srv = viaNode
        ? spawn(process.execPath, [bin], { stdio: ['pipe', 'pipe', 'ignore'] })
        : spawn(bin, [], { stdio: ['pipe', 'pipe', 'ignore'] });
    } catch {
      resolve({ found: false, text: INSTALL_HINT });
      return;
    }
    const timer = setTimeout(() => {
      try { srv.kill('SIGKILL'); } catch { /* already gone */ }
      resolve({ found: false, text: 'The Lumo engine did not answer within 20s.' });
    }, 20_000);
    const finish = (result) => {
      clearTimeout(timer);
      try { srv.kill('SIGKILL'); } catch { /* already gone */ }
      resolve(result);
    };
    srv.on('error', () => finish({ found: false, text: INSTALL_HINT }));
    let buf = '';
    srv.stdout.on('data', (chunk) => {
      buf += chunk;
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx); buf = buf.slice(idx + 1);
        let msg; try { msg = JSON.parse(line); } catch { continue; }
        if (msg.id === 1) {
          send({ jsonrpc: '2.0', method: 'notifications/initialized' });
          send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'lumo_check_code', arguments: { code, language } } });
        }
        if (msg.id === 2) {
          const text = msg.result?.content?.[0]?.text;
          finish(text ? { found: true, text } : { found: false, text: 'Unexpected engine response.' });
        }
      }
    });
    const send = (o) => srv.stdin.write(JSON.stringify(o) + '\n');
    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'ai-forge-lumo', version: '0.3.0' } } });
  });
}

// ---------------------------------------------------------------------------
// Forge plugin exports
// ---------------------------------------------------------------------------

export const mcpTools = [
  {
    name: 'forge_wp_lookup',
    description:
      'Look up curated, source-verified WordPress knowledge from the Lumo snapshot: Core API deprecations, block.json/theme.json currency, security patterns, WooCommerce/HPOS. Pass a topic or function name (e.g. "HPOS", "apiVersion", "get_page_by_title"). Returns the wrong-vs-correct pattern with source and a verification step.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', minLength: 2, description: 'Topic, API name or slug, e.g. "HPOS" or "escaping"' },
        top: { type: 'number', minimum: 1, maximum: 10, description: 'Max related entries to list (default 5)' },
      },
      required: ['topic'],
    },
    run: async (a) => lookup(a.topic, Math.min(10, Math.max(1, Number(a.top) || 5))).text,
  },
  {
    name: 'forge_wp_check_code',
    description:
      'Run the Lumo live catch on a WordPress PHP/JS snippet or diff: flags patterns that broke in a real Core/Gutenberg/WooCommerce release, with the dated source and the fix. Delegates to the installed @unleashwp/lumo engine (precision-first, never guesses); without it, returns the install hint.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', minLength: 1, maxLength: 100000, description: 'The code blob or unified diff to check' },
        language: { type: 'string', enum: ['php', 'js', 'auto'], description: 'Language (default auto)' },
      },
      required: ['code'],
    },
    run: async (a) => (await checkCodeViaEngine(a.code, a.language || 'auto')).text,
  },
];

// ---------------------------------------------------------------------------
// Browser-panel routes (AI Forge). `open: true` — this data comes from the
// local snapshot and the local engine, not from wordpress.org, so the wp.org
// cookie gate does not apply. The panel is a shop window: status, setup, one
// live bark. The work itself stays in the assistant and the terminal.
// ---------------------------------------------------------------------------

function engineStatus() {
  const bin = process.env.LUMO_MCP_BIN;
  if (bin) return existsSync(bin) ? 'ready' : 'missing';
  const path = process.env.PATH || '';
  const sep = process.platform === 'win32' ? ';' : ':';
  for (const dir of path.split(sep)) {
    if (dir && existsSync(join(dir, 'lumo-mcp'))) return 'ready';
  }
  return 'missing';
}

async function statusHandler(req, res, url, { json }) {
  try {
    const snap = loadSnapshot();
    json(res, 200, {
      entries: snap.entries.length,
      generatedAt: (snap.generatedAt || '').slice(0, 10),
      engine: engineStatus(),
      installHint: INSTALL_HINT,
    });
  } catch {
    json(res, 200, { entries: 0, generatedAt: null, engine: engineStatus(), installHint: INSTALL_HINT });
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', (c) => {
      b += c;
      if (b.length > 200_000) { reject(new Error('body too large')); req.destroy(); }
    });
    req.on('end', () => resolve(b));
    req.on('error', reject);
  });
}

async function checkHandler(req, res, url, { json }) {
  try {
    const body = JSON.parse((await readBody(req)) || '{}');
    const code = String(body.code || '');
    if (!code.trim()) { json(res, 400, { error: 'paste some PHP or JS first' }); return; }
    const result = await checkCodeViaEngine(code.slice(0, 100_000), body.language || 'auto');
    json(res, 200, { found: result.found === true, text: result.text });
  } catch (e) {
    json(res, 500, { error: String(e && e.message || e) });
  }
}

export const routes = [
  { method: 'GET', path: '/api/lumo/status', handler: statusHandler, open: true },
  { method: 'POST', path: '/api/lumo/check', handler: checkHandler, open: true },
];
