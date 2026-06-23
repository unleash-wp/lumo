# UnleashWP Lumo

**The HPOS guardrail for WooCommerce developers.**

Lumo audits your PHP code for order-data patterns that break under WooCommerce High-Performance Order Storage (HPOS — the default since WooCommerce 8.2) and shows you the wrong-vs-correct contrast with a verified source, in Claude Code, Cursor, or any MCP client.

> Your code isn't wrong yet. It will be — the moment a client upgrades past 8.2 and orders stop writing.

**MCP tools:** `lumo_audit` · `lumo_lookup` · `lumo_check_code` · Transport: stdio · Knowledge current as of June 2026

---

## Always current

The knowledge base is kept current with each WordPress and WooCommerce release. Entries are added when a core or plugin API change is verified against real source — always with a source URL, the affected version range, and a tested code example. See the [CHANGELOG](CHANGELOG.md) for what landed per release.

---

## Install

### Claude Code (primary)

```
/plugin marketplace add unleash-wp/lumo
/plugin install lumo@lumo
```

That's it. Lumo loads from the self-hosted marketplace. No separate account, no setup.

### Any MCP client (Cursor, Claude Desktop, etc.)

```bash
# install once
npm install -g @unleashwp/lumo

# then add to your MCP config:
# "command": "lumo-mcp", "args": [], "type": "stdio"
```

Or point directly at the built file without a global install:

```bash
git clone https://github.com/unleash-wp/lumo.git
cd lumo && npm install && npm run build
# "command": "node", "args": ["/absolute/path/to/lumo/dist/mcp.mjs"]
```

More install options: [docs/install.md](docs/install.md)

---

## What it does

When you open a WooCommerce project, Lumo watches for the classic pre-HPOS pattern:

```php
// current (outdated under HPOS)
$email = get_post_meta( $order_id, '_billing_email', true );
update_post_meta( $order_id, '_subscription_plan', 'pro' );
```

And shows you what it should look like instead:

```php
// current
$order = wc_get_order( $order_id );
$email = $order->get_billing_email();
$order->update_meta_data( '_subscription_plan', 'pro' );
$order->save();
```

With the source, a verification step, and the exact WooCommerce version the old pattern breaks on.

---

## The WordPress agent with receipts

AI coding tools freeze at their training cutoff. WordPress does not. Every Core release, every WooCommerce major, can shift which patterns are safe and which ones silently break production — and most of the time the AI you are using does not know yet.

Lumo tracks the current standard and answers with proof: source, affected version range, and a test step you can run before the code ships. It proposes and cites, it does not silently edit your files. Whatever AI editor you use — Claude Code, Cursor, or any MCP client — Lumo gives it a reference point that stays current.

---

## Usage

```
/lumo:wp-onboard      # first run: see the HPOS contrast on a sample, then your own repo
/lumo:wp-check        # audit the current project for HPOS order-access risks
```

**`/lumo:wp-check` demo** — what happens when Lumo finds a risk:

1. Lumo scans the current project for `get_post_meta`, `update_post_meta`, `get_posts`, and `WP_Query` calls on order data.
2. For each hit, it shows the wrong pattern, the correct replacement, the source, and a test step.
3. A scoreboard tracks how many HPOS-unsafe patterns it has caught across the session.

---

## The binding — consult Lumo before writing WordPress code

The commands above audit a project on demand. The binding makes Lumo the **first
source before any WordPress code is written**, not a tool you remember to run.

When the `wp-binding` skill is active, Claude checks every WordPress or
WooCommerce code suggestion through `lumo_check_code` before presenting it. If
Lumo flags a pattern, the correct form is surfaced with the source URL and the
exact version it broke — not the stale suggestion. This is the mechanism behind
the "keeps your AI current" promise.

**One-command install (plugin path):**

```
/plugin marketplace add unleash-wp/lumo
/plugin install lumo@lumo
```

The `wp-binding` skill activates automatically once the plugin loads.

**Activate manually (if the plugin is already installed):**

```
/wp-binding
```

**Teams using Cursor or a bare MCP config** get the same behaviour via
`.cursor/rules/lumo.mdc` (ships in this repo). For Claude Code projects that
do not use the plugin, copy the rule snippet from
`skills/wp-binding/claude-rule-snippet.md` into the project's `CLAUDE.md`.

---

## Edit-time enforcement hook

The `wp-enforce` hook is a Claude Code `PreToolUse` hook that intercepts `Write`, `Edit`, and `MultiEdit` calls on WordPress/PHP/plugin files and runs the catch engine over the proposed content **before the file changes**. An instruction in `CLAUDE.md` is model-chosen; a hook fires deterministically on every qualifying write regardless of context pressure.

### Precision model

The hook inherits the no-false-LOUD guarantee from the catch engine:

| Finding | Default action |
|---------|---------------|
| `LOUD` / CERTAIN (dated, breaking) | **Block** — edit rejected with the dated reason + correct pattern |
| `SOFT` / context-dependent | **Warn** — edit allowed; advisory injected into model context |
| No finding | Silent allow |

### Enabling the hook

The hook ships in this repo and is registered in `.claude/settings.json` for the `lumo` development repo itself — do not copy that registration into target projects as part of plugin install (it would block edits in a non-WordPress project). It requires the compiled catch runner:

```bash
npm run build   # produces dist/hook-catch.mjs
```

Without the build, the hook exits silently (fail-open) and logs a notice to stderr.

### Configuring enforcement mode

**Environment variable (per-session or CI):**

```bash
LUMO_ENFORCE_HOOK=block      # default — LOUD catches block
LUMO_ENFORCE_HOOK=warn-only  # all findings warn; nothing blocked
LUMO_ENFORCE_HOOK=off        # hook disabled entirely
```

**Project config (`.claude/.lumo.json`):**

```json
{
  "enforce": {
    "mode": "warn-only"
  }
}
```

Env var takes priority over the config file. The config file applies per-project; the env var is useful for CI or per-session override.

### WordPress file scoping

The hook only fires on files where at least one of these is true:

- **Path signal:** path contains `wp-content/`, `plugins/`, `themes/`, `woocommerce`, `wp-`, `blocks/`, `mu-plugins/`
- **Content signal:** blob contains `<?php`, `add_action`, `@wordpress/`, `wc_`, `WP_`, `get_post_meta`, etc.

Non-WordPress PHP files (e.g. a Laravel controller) are not intercepted unless the content carries WordPress API calls.

### Pro seam

When a Lumo Pro MCP server is available, `runHookCatch()` can be replaced with a Pro-backed call that draws from the full versioned knowledge base. The interface is identical — the seam is `src/hook/catch-runner.ts`. That integration is tracked separately (requires a staging MCP endpoint).

---

## Configuration

Two env vars cover the most common needs. Full reference: [docs/configuration.md](docs/configuration.md)

### `LUMO_UPGRADE_PROMPT`

Controls the upgrade reveal line and prompt block shown after a Free answer.

- **Default:** on
- **Opt out:** `LUMO_UPGRADE_PROMPT=off`

Detection, the Free answer, and the scoreboard are unaffected regardless of this setting.

### `LUMO_CHECKOUT_URL`

The base URL used when the upgrade prompt fires.

- **Default:** `https://lumo.so/pro`
- **Override:** set to any URL; attribution params are appended at click time

---

## Lumo Pro

Lumo Pro adds the full written breakdown and the complete version/breaking-change matrix across the WP/Woo version range — not just the single "≥ 8.2" line the Free agent ships.

Free gives you a correct, shippable answer. Pro gives you the depth to understand why, and the coverage to know which exact versions are affected on your client's stack.

Install Pro via the MCP endpoint once you have a license. See [docs/install.md](docs/install.md) for the `claude mcp add` command.

---

## License

MIT — see [LICENSE](LICENSE) if present. The Lumo Pro knowledge base is separately licensed.
