/**
 * Unified diff parser for the Lumo GitHub Action.
 *
 * Extracts per-file blobs of added lines from a unified diff string.
 * Pure function — no I/O, no side effects.
 */

export interface FileDiff {
  filename: string;
  language: 'php' | 'js';
  /** Added lines only, with the leading '+' stripped. */
  blob: string;
}

/**
 * Parse a unified diff and return one FileDiff per PHP/JS file that has
 * at least one added line. Removed lines (starting with '-') are excluded
 * so the catch engine never fires on code being deleted.
 */
export function parseDiff(diff: string): FileDiff[] {
  const files: FileDiff[] = [];

  // Split on "diff --git" headers to isolate per-file chunks.
  const chunks = diff.split(/^diff --git /m).filter(Boolean);

  for (const chunk of chunks) {
    // Extract the b-side filename from the first line: "a/path b/path"
    const headerMatch = chunk.match(/^a\/.+ b\/(.+)\n/);
    if (!headerMatch?.[1]) continue;

    const filename = headerMatch[1].trim();

    // Only PHP and JS/TS files — skip everything else (YAML, CSS, etc.)
    const language: 'php' | 'js' | null = filename.endsWith('.php')
      ? 'php'
      : /\.(js|ts|jsx|tsx|mjs|cjs)$/.test(filename)
        ? 'js'
        : null;

    if (!language) continue;

    // Keep only added lines (start with '+') and strip the leading '+'.
    // Exclude the '+++ b/...' file header line.
    const blob = chunk
      .split('\n')
      .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
      .map((line) => line.slice(1))
      .join('\n');

    if (!blob.trim()) continue;

    files.push({ filename, language, blob });
  }

  return files;
}
