/**
 * Pure version-comparison utilities for the catch layer.
 *
 * No deps, no throws. Both functions are safe to call with any input.
 */

/**
 * Compare two version strings part-by-part ("x.y[.z]").
 * Missing or non-numeric parts are treated as 0.
 * Returns -1 | 0 | 1.
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const parsePart = (s: string): number => {
    const n = parseInt(s, 10);
    return isNaN(n) ? 0 : n;
  };

  const aParts = String(a ?? '').split('.');
  const bParts = String(b ?? '').split('.');
  const len = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < len; i++) {
    const av = parsePart(aParts[i] ?? '0');
    const bv = parsePart(bParts[i] ?? '0');
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}

export type VersionState = 'already-broken' | 'upcoming' | 'unknown';

/**
 * Determine the project's relationship to a known breaking version.
 *
 * - Either value missing/unparseable → 'unknown'
 * - projectVersion >= breakingVersion → 'already-broken'
 * - projectVersion <  breakingVersion → 'upcoming'
 */
export function resolveVersionState(
  projectVersion: string | null | undefined,
  breakingVersion: string | null | undefined,
): VersionState {
  if (!projectVersion || !breakingVersion) return 'unknown';
  // Treat purely non-numeric values as unparseable → unknown
  if (!/\d/.test(projectVersion) || !/\d/.test(breakingVersion)) return 'unknown';

  const cmp = compareVersions(projectVersion, breakingVersion);
  return cmp >= 0 ? 'already-broken' : 'upcoming';
}
