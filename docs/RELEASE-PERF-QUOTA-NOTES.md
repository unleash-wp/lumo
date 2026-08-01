# Release: perf + quota deploy notes (2026-08-01)

Go-live companion for `release/v1.0.0-go-live`. Perf P0-1 (batch `lumo_check_code`) and P0-2 (catch signal cache) ship in this branch.

## Quota accounting (batch)

**Decision:** one successful HTTP POST to `/mcp` = **one quota unit**, regardless of how many files are in `files[]`.

- Rationale: relieves Mittwald RPS and LS auth amortisation; Action already batches up to 50 files per call (`CHECK_CODE_BATCH_FILE_CAP`).
- Chunks above 50 files = multiple HTTP calls = multiple quota units (disclosed in Action logs via chunk count).
- Scan CPU still scales with file count inside one call; only HTTP/quota multiplier drops.

Product law unchanged: 429 / 402 `ci_not_included` → `checkDidNotRun`, never silent clean.

## Deploy order

1. **`lumo-pro`** → Mittwald (`main` on Pro repo triggers deploy). New MCP accepts `files[]` on `lumo_check_code`.
2. **`@unleashwp/lumo` npm** → publish from `lumo` after Pro is live (Action runner sends batch; falls back to per-file if server omits `batch: true`).
3. **`lumo-action`** → tag only if manifest inputs changed (this release: consumer package bump, no action.yml change required).

Do **not** publish npm before Pro deploy: batch requests against an old server fall back to N sequential calls (safe, but no perf win).

## Env vars (Mittwald / Pro)

See `lumo-pro/.env.example` and `docs/server-load.md`. Minimum for quota + SKU gates:

| Variable | Purpose |
| --- | --- |
| `LEMON_SQUEEZY_API_KEY` | Licence validation |
| `LS_PRODUCT_SOLO_HOSTED` | Solo SKU product id |
| `LS_PRODUCT_PRO` | Pro SKU product id |
| `LS_PRODUCT_TEAM_20` | Team SKU product id |
| `QUOTA_SOLO_DAILY` / `QUOTA_SOLO_MINUTE` | Solo hosted limits |
| `QUOTA_PRO_DAILY` / `QUOTA_PRO_MINUTE` | Pro limits |
| `QUOTA_TEAM_DAILY` / `QUOTA_TEAM_MINUTE` | Team limits |

Action sends `X-Lumo-Client: action`. Solo Hosted returns 402 `ci_not_included` (by design).

## Smoke after deploy

1. Pro MCP `tools/call` with `files: [{ path: 'test.php', code: '...' }]` → `structuredContent.batch === true`, `results[0].computed`.
2. Action on a multi-file PR → one fetch in logs (or ceil(n/50) for large PRs).
3. Quota heart test: `docs/quota-sku-heart-test-2026-08-01.md` scenarios still green.

## Still founder-gated (not blocked by this release)

- Lemon Squeezy go-live (products, webhooks)
- Mittwald production deploy approval
- npm `@unleashwp/lumo` publish
- Briefing #1 / pricing copy
