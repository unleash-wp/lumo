# Lumo Configuration

Environment variables that control Lumo's behavior. All are optional — defaults are safe for most users.

## Upgrade prompt

### `LUMO_UPGRADE_PROMPT`

Controls whether the upgrade reveal line and prompt block are shown after a Free answer.

- **Default:** on (shown when the developer is eligible)
- **Opt out:** set to `off`, `0`, `false`, or `no` (any case)

```sh
# Disable the upgrade prompt entirely:
LUMO_UPGRADE_PROMPT=off
```

The kill-switch gates only the reveal line and prompt block. Detection, the Free answer, the scoreboard increment, and all onboarding value paths are unaffected regardless of this setting.

### `LUMO_CHECKOUT_URL`

The base checkout URL used when the upgrade CTA fires.

- **Default:** `https://lumo.so/pro` (stable 301 — redirect target is founder-controlled)
- **Override:** set to any URL; Lumo appends `?ref=…&gated=…&v=…` attribution params at click time

```sh
# Override for staging:
LUMO_CHECKOUT_URL=https://staging.lumo.so/pro
```

## Telemetry

### `LUMO_TELEMETRY_ENDPOINT`

Endpoint URL for opt-in anonymous usage telemetry. No data is ever sent unless the developer has explicitly opted in via the onboarding prompt AND this variable is set.

- **Default:** unset (strictly local; no network calls)

### `LUMO_INSTALL_SOURCE`

Attribution channel set by distribution partners in their install snippet. Stamped on the `install` event.

- **Default:** `unknown` when absent

## State directory

### `CLAUDE_PLUGIN_DATA`

Override the directory where Lumo stores its local state (`events.jsonl`, variant assignments, prompt state, telemetry consent).

- **Default:** `~/.lumo`
