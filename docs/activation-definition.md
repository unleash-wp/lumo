# Activation Definition

**Activation** is the first depth-gated HPOS catch on the developer's **own code**.

## Exact predicate

```
type === 'activation' && target === 'own' && gated === true
```

The single enforcement point is `isActivation()` in `src/lib/events.ts`. Every metric, dashboard ratio, and funnel gate keys off that function — nowhere else.

## What does and does not fire activation

| Scenario | Event recorded | Fires activation? |
|---|---|---|
| Own-code WooCommerce detected by `/wp-check` or beat 2 | `activation` with `target:'own'`, `gated:true` | Yes |
| Beat 1 bundled sample shown | `onboarded` | No |
| Clean repo, no WooCommerce order code | `no_target` | No |
| Skill answers an HPOS question mid-task | `pql_gated_touch` | No (scoreboard only) |

Key points:

- **The bundled sample never fires activation.** Beat 1 is teaching material; it produces an `onboarded` event, not `activation`.
- **A clean repo is `no_target`, not churn.** It is a valid, distinct outcome. Do not treat it as a failed activation.
- **`pql_gated_touch` counts towards the scoreboard** (`getGatedCount()`) but is orthogonal to the activation predicate. Both can be appended in the same session without conflict — the onboarding beat-2 own-code catch correctly records both a `pql_gated_touch` (the catch) and an `activation` (the milestone).

## Primary ratio

`activation / install` — segmentable by `source` (the `LUMO_INSTALL_SOURCE` channel on the install event). This is the master conversion metric for the Free → Pro gate.

The `README.md` at the repo root links to `docs/configuration.md` which covers `LUMO_INSTALL_SOURCE` and related env vars.
