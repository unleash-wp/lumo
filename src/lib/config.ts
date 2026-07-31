// ---------------------------------------------------------------------------
// Config resolvers, pure, env-injectable. No fs, no Date.now.
//
// Kill-switch: LUMO_UPGRADE_PROMPT (default ON; explicit opt-out only)
// Checkout URL: LUMO_CHECKOUT_URL (default https://lumo.so/pro)
// ---------------------------------------------------------------------------

/**
 * Returns true unless the env var is explicitly set to an opt-out value.
 * Opt-out strings: '0', 'false', 'off', 'no' (any case).
 * Default (unset or any other value) = ON.
 */
export function isUpgradePromptEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const val = (env['LUMO_UPGRADE_PROMPT'] ?? '').toLowerCase();
  return !['0', 'false', 'off', 'no'].includes(val);
}

/**
 * Resolve the checkout base URL from the environment.
 * Defaults to 'https://lumo.so/pro', a stable 301 the founder controls.
 * The actual Lemon Squeezy destination is a redirect target, not a code constant.
 */
export function getCheckoutUrl(env: Record<string, string | undefined> = process.env): string {
  return env['LUMO_CHECKOUT_URL'] ?? 'https://lumo.so/pro';
}

/**
 * Build an attributed checkout URL by appending ref/gated/v query params.
 * Param order is stable: ref → gated → v.
 * Values are percent-encoded.
 */
export function buildCheckoutUrl(
  base: string,
  params: { source: string; gatedCount: number; promptVariant: string },
): string {
  const url = new URL(base);
  url.searchParams.set('ref', params.source);
  url.searchParams.set('gated', String(params.gatedCount));
  url.searchParams.set('v', params.promptVariant);
  return url.toString();
}
