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
    title: 'Lumo HPOS audit',
    description: [
      'Detect HPOS-unsafe WooCommerce order-access patterns in a local project.',
      'Returns the correct pattern with source citation, a verification step, and',
      'the minimum affected WooCommerce version — all from the curated HPOS snapshot.',
      'Proposes the fix; never applies code changes autonomously.',
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
    title: 'Lumo HPOS knowledge lookup',
    description: [
      'Look up curated, evidence-backed HPOS guidance by entry slug or category slug.',
      'Returns the wrong pattern, the correct replacement, source URL, test step, and',
      'the minimum affected WooCommerce version.',
      'Free tier — proposes/cites only, never edits autonomously.',
      'Example slugs: "woocommerce-hpos-order-access". Example categories: "woocommerce".',
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
