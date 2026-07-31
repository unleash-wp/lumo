/**
 * lumo_audit must never issue a clean bill of health for a project it did not
 * read (issue #111).
 *
 * Measured before this test existed: a path that does not exist, and a
 * directory that is not a WordPress project, both returned
 *
 *   "No known WordPress risk patterns detected in this project.
 *    Nothing to check here."
 *
 * That asserts a project-wide result and instructs the caller to stop looking.
 * It was also the only no-match surface in the product without the caveat that
 * ACTION_NO_MATCH_LINE and CATCH_NEUTRAL_LINE both carry, which is what makes it
 * a product-law failure rather than a wording preference: never a false
 * all-clear.
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleAudit } from '../src/mcp/handlers.js';

const NONEXISTENT = join(tmpdir(), 'lumo-no-such-project-9f3a2b');

describe('lumo_audit — a path it could not read', () => {
  it('does not claim the project is clean', async () => {
    const out = await handleAudit({ project_root: NONEXISTENT });
    expect(out).not.toContain('No known WordPress risk patterns detected in this project');
  });

  it('never tells the caller to stop looking', async () => {
    const out = await handleAudit({ project_root: NONEXISTENT });
    expect(out).not.toContain('Nothing to check here');
  });

  it('names the path it could not read, so the caller can fix the call', async () => {
    const out = await handleAudit({ project_root: NONEXISTENT });
    expect(out).toContain(NONEXISTENT);
  });
});

describe('lumo_audit — a readable directory that is not a WordPress project', () => {
  it('says nothing matched without claiming the project is safe', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'lumo-empty-'));
    try {
      const out = await handleAudit({ project_root: empty });
      expect(out).not.toContain('Nothing to check here');
      // The caveat every other no-match surface carries.
      expect(out.toLowerCase()).toContain('not an all-clear');
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});

/**
 * The three states must stay distinguishable in the text, not only in a flag,
 * because this tool declares no outputSchema and prose is its entire contract.
 */
describe('lumo_audit — the three states read differently', () => {
  it('separates "could not read" from "read and nothing matched"', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'lumo-empty-'));
    try {
      const unreadable = await handleAudit({ project_root: NONEXISTENT });
      const scanned = await handleAudit({ project_root: empty });
      expect(unreadable).not.toBe(scanned);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
