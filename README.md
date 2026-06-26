# UnleashWP Lumo

**The WordPress watcher for AI-assisted development.**

The official WordPress/agent-skills make your AI write WordPress correctly when you ask. Lumo Free tells you when your AI just wrote something stale — without being asked. Run both.

Pairs with WordPress/agent-skills — they are the manual, Lumo is the watcher.

> Your AI froze at its training cutoff. WordPress did not. Lumo catches the delta in the moment the code is written — not after you ship it.

**MCP tools:** `lumo_audit` · `lumo_lookup` · `lumo_check_code` · Transport: stdio · Snapshot verified as of June 2026

---

## What makes Lumo different from the official WordPress skills

The official WordPress/agent-skills are a reference the AI reads when routed to a WordPress task. Lumo Free is a watcher that flags stale AI output the moment it is written, with a dated source, without being asked.

That difference is the reason to run both:

| | Official WordPress/agent-skills | Lumo Free |
|---|---|---|
| **Verb** | Instruct (AI reads on request) | Watch (fires unprompted on AI output) |
| **When it fires** | When you route a task to a WP skill | When the AI writes any covered WP pattern |
| **Coverage** | Core and theme (GPL, official) | Core/Block/Theme snapshot + commercial plugin detection |
| **Third-party plugins** | None (by design — GPL) | ACF Pro, Gravity Forms, Elementor Pro, Meta Box, Carbon Fields |
| **Knowledge type** | STOCK — handbook on request | STOCK catch + FLOW in Pro |

**One clear line:** Lumo Free is a snapshot (verified, frozen between releases). The live currency — re-checked on every WordPress release — is Lumo Pro.

---

## Install

### Claude Code (primary)

```
/plugin marketplace add unleash-wp/lumo
/plugin install lumo@lumo
```

That is it. Lumo loads from the self-hosted marketplace. No separate account, no setup.

After install, run this once in your project to catch outdated WordPress patterns in your current changes:

```bash
npx @unleashwp/lumo scan
```

Lumo scans your uncommitted diff and prints either the flagged patterns (LOUD first) or an honest "scanned N files — clean as of {date}".

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

## What it catches

When your AI writes WordPress code, Lumo checks it against a curated snapshot of Core/Block/Theme patterns that changed or broke in a specific version. For each hit it shows:

- The wrong pattern (what the AI suggested)
- The correct replacement
- The source URL
- The affected version range
- A test step to verify before shipping

Example — the AI suggesting a pre-HPOS order-data pattern:

```php
// outdated under WooCommerce ≥ 8.2
$email = get_post_meta( $order_id, '_billing_email', true );
update_post_meta( $order_id, '_subscription_plan', 'pro' );
```

Lumo flags it and shows the correct form:

```php
$order = wc_get_order( $order_id );
$email = $order->get_billing_email();
$order->update_meta_data( '_subscription_plan', 'pro' );
$order->save();
```

With the source and the exact WooCommerce version the old pattern breaks on.

The same mechanism covers Block Editor API changes (`apiVersion 2→3`, `useSetting()` deprecation, `isValidBlockContent()` removal), Core function deprecations (`get_page_by_title()`, `wp_img_tag_add_decoding_attr()`), and security patterns.

---

## The precision model

Three catch tiers — no false alarms:

| Tier | Meaning | Default action |
|---|---|---|
| **LOUD** | A dated, breaking, CERTAIN signal — version fact verified against source | Blocked in the enforce hook; flagged in the catch |
| **SOFT** | Worth reviewing if a condition holds — honest when the break is context-dependent | Warned; advisory surfaced |
| **SILENT** | Repository-state noise that does not reach the developer | Suppressed |

False-LOUD rate is held at zero by design. A LOUD catch requires a verified version fact; without one it structurally degrades to SOFT.

---

## Usage

```
/lumo:wp-onboard      # first run: see a catch on a sample, then your own repo
/lumo:wp-check        # audit the current project for WordPress risk patterns
```

**`/lumo:wp-check` demo** — what happens when Lumo finds a risk:

1. Lumo scans the current project for patterns covered in the snapshot.
2. For each hit it shows the wrong pattern, the correct replacement, the source, and a test step.
3. A scoreboard tracks how many patterns it has caught across the session.

---

## The binding — consult Lumo before writing WordPress code

The commands above audit a project on demand. The binding makes Lumo the **first
source before any WordPress code is written**, not a tool you remember to run.

When the `wp-binding` skill is active, Claude checks every WordPress or
WooCommerce code suggestion through `lumo_check_code` before presenting it. If
Lumo flags a pattern, the correct form is surfaced with the source URL and the
exact version it broke — not the stale suggestion.

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

---

## Configuration

Two env vars cover the most common needs. Full reference: [docs/configuration.md](docs/configuration.md)

### `LUMO_UPGRADE_PROMPT`

Controls the upgrade reveal line and prompt block shown after a Free catch.

- **Default:** on
- **Opt out:** `LUMO_UPGRADE_PROMPT=off`

Detection, the Free answer, and the scoreboard are unaffected regardless of this setting.

### `LUMO_CHECKOUT_URL`

The base URL used when the upgrade prompt fires.

- **Default:** `https://lumo.so/pro`
- **Override:** set to any URL; attribution params are appended at click time

---

## Lumo Pro

Free ships a snapshot — verified, static between WordPress releases. Pro is the live layer.

| | Lumo Free | Lumo Pro |
|---|---|---|
| The catch | Over the Core/Block/Theme snapshot | Over the full, live catalog |
| Commercial plugins | Detection only (note shown) | Full curated coverage (ACF Pro, GF, Elementor, Meta Box, Carbon Fields) |
| Version matrix | Single constraint row per entry | Full multi-version breakdown |
| Freshness | Snapshot — verified as of last release | Re-checked on every WordPress release |
| Pre-release briefings | Tease shown | Full briefing — what breaks before it ships |

Free gives you a correct, shippable answer with a dated source. Pro gives you depth, commercial-plugin coverage, and the foresight layer.

Add Pro: `claude mcp add lumo-pro --transport http https://p-w8t2yy.project.space/mcp`

---

## License

MIT — see [LICENSE](LICENSE) if present. The Lumo Pro knowledge base is separately licensed.
