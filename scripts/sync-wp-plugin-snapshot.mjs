#!/usr/bin/env node
/**
 * Copy the free snapshot into the WordPress plugin.
 *
 * The plugin ships the knowledge so it answers offline with no account, which
 * means the same 42 entries exist in two places on disk. One source, one copy,
 * one command — and a test that fails when the copy drifts, because a plugin
 * quietly serving last month's knowledge would be the staleness this product
 * exists to catch, committed by the product itself.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'data', 'snapshot.json');
const target = join(root, 'wordpress-plugin', 'data', 'snapshot.json');

const raw = readFileSync(source, 'utf8');
writeFileSync(target, raw, 'utf8');

const { entries, generatedAt } = JSON.parse(raw);
console.log(`Copied ${entries.length} entries (knowledge of ${generatedAt.slice(0, 10)}) into the WordPress plugin.`);
