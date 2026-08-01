# Go-live checklist (48h) — founder

Canonical plan: [go-live-final.md](./go-live-final.md).

Locked ladder (2026-08-01):

| SKU | Price | Hosted? |
| --- | --- | --- |
| Free | 0 | No |
| **Agent Core** | **39 €/yr** | No · 2 agents |
| Agent Pack | 99 €/yr | No · full team |
| Freelancer | 149 €/yr | Yes · 1 seat + **Forge Hosted** |
| Pro | 199 €/seat/yr | Yes + CI + **Forge Hosted** |
| Agency | 599 €/yr | Yes · **20 seats** + **Forge Hosted** |

## Must before online

1. [ ] Lemon Squeezy: create **5** products (prices above). Agency activations = **20**.
2. [ ] Put Freelancer + Pro + Agency ids in Mittwald `LUMO_LS_PRODUCT_IDS` — **not** Core or Pack.
3. [ ] `LUMO_ENV=production` `LUMO_REQUIRE_AUTH=true` webhook secret set; `job restart`.
4. [ ] Smoke: no key → 401; free/core/pack-only → 402; paid key → tools OK.
5. [ ] Portal / LS downloads:
      - Core zip: `lumo-agent-kit/bin/package-agent-core.sh`
      - Pack zip: `lumo-agent-kit/bin/package-agent-pack.sh`
6. [ ] Freelancer/Pro/Agency buyers get **full Pack zip** without second charge.
7. [ ] Deploy lumo-pro so `/connect` shows 39 / 99 / 149 / 199 / 599 · 20 seats + Vol.1 honesty line.
8. [ ] www pricing page matches `docs/packages.md` (Vol.1 = living MCP lookups on paid seats).

## Can wait (week 1)

- Automated entitlement API for zip download
- Optional Vol.1 PDF attach for Pack buyers (manual LS file — not blocking)
- Fancy checkout upsells Core → Pack
- New agents beyond the 6

## Already built in repos

- Hosted paid gate + no self-hosted Pro
- Docs + connect copy on ladder (incl. Core + Vol.1 living edition honesty)
- Pack + Core zip scripts in `lumo-agent-kit`
