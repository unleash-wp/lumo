# Lumo release notes — go-live tag

English. Customer-facing repos tag together for the first public ladder.

## Recommended tag

```
v1.0.0-go-live
```

Apply on:

| Repository | What the tag marks |
| --- | --- |
| `unleash-wp/lumo` | Free CLI, local MCP, bundled snapshot, product docs, demo |
| `unleash-wp/lumo-pro` | Hosted MCP, connect page, Pro knowledge DB (~177 entries incl. 69 Vol.1 refs), auth gate |
| `unleash-wp/lumo-agent-kit` | Agent Core + Agent Pack zip artefacts |

`unleash-wp/lumo-action` stays on `@v1` unless the manifest copy changes.

## What ships at v1.0.0-go-live

### Lumo Free (0 €)

- Local `@unleashwp/lumo` CLI: `demo`, `check`, `scan`, local `lumo-mcp`
- Bundled free snapshot (~42 catch entries)
- AI Forge self-host path documented
- **No** hosted MCP bytes from UnleashWP

### Agent Core (39 €/yr)

- 2 agents: Currency Guard + Code Reviewer
- Lemon Squeezy download entitlement (1 activation)
- Product id **not** in `LUMO_LS_PRODUCT_IDS`

### Agent Pack (99 €/yr)

- 6 agents + 9 skills + 5 commands
- Zip from `lumo-agent-kit/bin/package-agent-pack.sh`
- Product id **not** in `LUMO_LS_PRODUCT_IDS`
- **No** Vol.1 MCP corpus (living knowledge = paid hosted only)

### Freelancer (149 €/yr · 1 seat)

- Hosted MCP on `mcp.unleash-wp.com`
- Full Agent Pack included (no double-sell)
- **UnleashWP Learn Vol.1 living edition**: 69 `lumo_lookup` reference entries
- **AI Forge Hosted** (included entitlement — all paid hosted seats)
- No CI Action

### Lumo Pro (199 €/seat/yr)

- Hosted MCP + GitHub Action CI gate
- Agent Pack + Vol.1 living lookups included
- **AI Forge Hosted** (same entitlement as Freelancer / Agency)
- No self-hosted Pro product

### Agency (599 €/yr · 20 seats)

- Up to 20 hosted MCP activations
- Agent Pack + Vol.1 living lookups
- **AI Forge Hosted** (same entitlement as Freelancer / Pro)

## Pre-tag checklist

### lumo

```bash
npx vitest run
npx tsc --noEmit
npm run build
node scripts/mcp-smoke-test.mjs
node scripts/check-vocabulary.mjs
```

### lumo-pro

```bash
npx vitest run
npx tsc --noEmit
node scripts/check-vocabulary.mjs
# verify:knowledge before publishing new knowledge entries
```

### Founder (after tag, before announcing)

- [ ] Lemon Squeezy 5 products live with correct prices
- [ ] `LUMO_LS_PRODUCT_IDS` = Freelancer, Pro, Agency only
- [ ] Deploy + day-0 smoke (see [go-live-final.md](./go-live-final.md))
- [ ] www pricing matches `docs/packages.md`

## Vol.1 honesty (all channels)

Living edition = **69 queryable MCP reference lookups** on paid hosted seats via
`lumo_lookup`. Updated as WordPress ships. **Not** the 345-page PDF. **Not** Catch.
Bookstore PDF may remain a separate Digistore24 SKU.
