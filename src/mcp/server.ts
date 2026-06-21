#!/usr/bin/env node
/**
 * Local Free-tier MCP server — stdio transport.
 *
 * Wire-up: McpServer (high-level) + StdioServerTransport.
 * Registers two tools:
 *   lumo_audit   — detect HPOS risk in a project root
 *   lumo_lookup  — look up a Free snapshot entry by slug or category
 *
 * SDK pinned to 1.29.0 (matches lumo-pro).
 * Transport: stdio only — designed for local IDE spawn, NOT remote HTTP.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { handleAudit, handleLookup } from './handlers.js';

const server = new McpServer({
  name: 'unleashwp-lumo',
  version: '0.2.0',
});

// ---------------------------------------------------------------------------
// lumo_audit
// ---------------------------------------------------------------------------

server.registerTool(
  'lumo_audit',
  {
    title: 'Lumo WordPress/WooCommerce audit',
    description: [
      'Scan the open project for known WordPress and WooCommerce risk patterns —',
      'such as deprecated order-meta calls and HPOS-incompatible code — and return',
      'the wrong-vs-correct fix with the source and a verification step to run before',
      'deploying. Proposes and cites; never applies code changes autonomously.',
    ].join(' '),
    inputSchema: {
      project_root: z
        .string()
        .optional()
        .describe(
          'Absolute path to the project root to audit. Defaults to the current working directory.',
        ),
    },
  },
  async ({ project_root }) => {
    const text = await handleAudit({ project_root });
    return { content: [{ type: 'text', text }] };
  },
);

// ---------------------------------------------------------------------------
// lumo_lookup
// ---------------------------------------------------------------------------

server.registerTool(
  'lumo_lookup',
  {
    title: 'Lumo WordPress/WooCommerce knowledge lookup',
    description: [
      'Look up the current, evidence-backed correct pattern for a WordPress or',
      'WooCommerce topic. Pass an entry slug or a category and get back the right',
      'approach, the source, the affected version range, and a test step to verify it.',
      'Free tier — proposes and cites, never edits autonomously.',
      'Example slug: "woocommerce-hpos-order-access". Example category: "woocommerce".',
    ].join(' '),
    inputSchema: {
      slug: z
        .string()
        .optional()
        .describe('Exact entry slug, e.g. "woocommerce-hpos-order-access".'),
      category: z
        .string()
        .optional()
        .describe('Category slug to look up the first matching entry, e.g. "woocommerce".'),
    },
  },
  async ({ slug, category }) => {
    const text = await handleLookup({ slug, category });
    return { content: [{ type: 'text', text }] };
  },
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
