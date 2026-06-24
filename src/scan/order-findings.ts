/**
 * Order catch findings LOUD-first.
 *
 * runCatch returns findings in file order (the order files appear in the diff),
 * not tier order. The scan leads with the alarm, so it sorts LOUD before SOFT
 * before printing. Stable for same-tier findings (preserves file order).
 */
export function orderFindingsLoudFirst<T extends { tier: string }>(findings: readonly T[]): T[] {
  return [...findings].sort((a, b) =>
    a.tier === 'LOUD' && b.tier !== 'LOUD' ? -1 : b.tier === 'LOUD' && a.tier !== 'LOUD' ? 1 : 0,
  );
}
