import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runCheck } from '../src/check/run-check.js';
import { SCAN_NO_MATCH_TEMPLATE } from '../src/lib/render.js';

describe('lumo check (whole-file)', () => {
  it('catches unprepared $wpdb SQL in a whole file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'lumo-check-'));
    const file = join(dir, 'bad.php');
    writeFileSync(
      file,
      `<?php
function get_user_row( $user_id ) {
    global $wpdb;
    return $wpdb->get_results( "SELECT * FROM {$wpdb->users} WHERE ID = $user_id" );
}
`,
    );
    const { lines, exitCode } = await runCheck([file]);
    const text = lines.join('\n');
    expect(exitCode).toBe(0);
    expect(text).toMatch(/BREAKING:|LOUD|SQL injection|prepare/i);
  });

  it('explains usage when no paths given', async () => {
    const { lines } = await runCheck([]);
    expect(lines.join('\n')).toContain('lumo check');
    expect(lines.join('\n')).toContain('lumo scan');
  });
});

describe('scan no-match points at check + demo', () => {
  it('names diff-only scope and next commands', () => {
    expect(SCAN_NO_MATCH_TEMPLATE).toContain('git diff');
    expect(SCAN_NO_MATCH_TEMPLATE).toContain('lumo check');
    expect(SCAN_NO_MATCH_TEMPLATE).toContain('lumo demo');
    expect(SCAN_NO_MATCH_TEMPLATE).toContain('not an all-clear');
    expect(SCAN_NO_MATCH_TEMPLATE.toLowerCase()).not.toContain('clean');
  });
});
