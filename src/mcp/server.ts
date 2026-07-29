#!/usr/bin/env node
/**
 * Local Free-tier MCP server — stdio transport.
 *
 * Wire-up: McpServer (high-level) + StdioServerTransport.
 * Registers two tools:
 *   lumo_audit   — scan a project for stale or incorrect WordPress patterns
 *   lumo_lookup  — look up a Free snapshot entry by slug or category
 *
 * SDK pinned to 1.29.0 (matches lumo-pro).
 * Transport: stdio only — designed for local IDE spawn, NOT remote HTTP.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { handleAudit, handleLookup, handleCheckCode } from './handlers.js';
// Static JSON import: esbuild inlines it at build time, so the manifest is the
// single version source and the bundle carries no runtime path dependency.
// (A createRequire('../../package.json') variant stayed a RUNTIME require and
// broke in the installed package — dist/../../ points outside the tarball.)
import pkg from '../../package.json';

const server = new McpServer({
  name: 'unleashwp-lumo',
  version: pkg.version,
});

// ---------------------------------------------------------------------------
// lumo_audit
// ---------------------------------------------------------------------------

server.registerTool(
  'lumo_audit',
  {
    title: 'Lumo WordPress audit',
    description: [
      'Scan the open project for stale or incorrect WordPress patterns —',
      'block.json apiVersion, theme.json schema, deprecated Core APIs,',
      'WooCommerce order-meta, and more — and return the wrong-vs-correct fix',
      'with the source and a verification step to run before deploying.',
      'Proposes and cites; never applies code changes autonomously.',
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
    title: 'Lumo WordPress knowledge lookup',
    description: [
      'Look up the current, evidence-backed correct pattern for a WordPress topic —',
      'block.json/apiVersion, theme.json schema, Core APIs, WooCommerce, and more.',
      'Pass an entry slug or a category and get back the right approach, the source,',
      'the affected version range, and a test step to verify it.',
      'Free tier — proposes and cites, never edits autonomously.',
      'Example slug: "woocommerce-hpos-order-access". Example category: "gutenberg".',
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
// lumo_check_code
// ---------------------------------------------------------------------------

server.registerTool(
  'lumo_check_code',
  {
    title: 'Lumo WordPress code catch',
    description: [
      'Before presenting WordPress PHP/JS to the user, pass it here.',
      'Returns any place the code uses a stale pattern — block.json apiVersion,',
      'theme.json schema, deprecated Core APIs, WooCommerce order-meta — with the',
      'dated source and the correct form.',
      'Call this on every WordPress code suggestion before the user sees it.',
      'Proposes and cites; never edits autonomously.',
      'Accepts a raw blob or a unified diff (scans added lines only when a diff is detected).',
    ].join(' '),
    inputSchema: {
      code: z.string().describe('Raw PHP/JS code blob or unified diff to check.'),
      language: z
        .enum(['php', 'js', 'auto'])
        .optional()
        .describe(
          'Language of the blob. "auto" (default) sniffs from syntax cues. ' +
            'Pass "php" or "js" to force a language.',
        ),
      wp_version: z
        .string()
        .optional()
        .describe(
          "The project's target WordPress version, e.g. '6.9'. " +
            'When provided, catch output shows whether the project is already past the breaking version.',
        ),
      woo_version: z
        .string()
        .optional()
        .describe(
          "The project's target WooCommerce version, e.g. '8.5'. " +
            'Used to contextualise WooCommerce-specific catch results.',
        ),
      project_root: z
        .string()
        .optional()
        .describe(
          'Absolute path to the project root. Lumo will attempt to auto-detect the ' +
            'WP/WooCommerce version from composer.json or wp-cli when explicit versions are absent.',
        ),
    },
  },
  async ({ code, language, wp_version, woo_version, project_root }) => {
    const text = await handleCheckCode({
      code,
      language: language as 'php' | 'js' | 'auto' | undefined,
      wp_version,
      woo_version,
      project_root,
    });
    return { content: [{ type: 'text', text }] };
  },
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
