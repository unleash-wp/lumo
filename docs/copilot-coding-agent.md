# Lumo and the GitHub Copilot coding agent

The coding agent opens pull requests on its own. Nobody is watching while it
writes, and it uses its MCP tools **autonomously, without asking for approval** —
GitHub's own wording. That makes it the surface where a stale WordPress pattern
is most likely to reach a branch unnoticed, and the surface where a wrong answer
from a checker is most expensive.

Lumo already speaks the protocol the agent consumes. Nothing has to be built;
two settings have to be right, and one of them is easy to miss.

## Set the firewall allowlist first, not last

The coding agent runs behind a firewall. GitHub's documentation: *"By default,
Copilot's access to the internet is limited by a firewall."* GitHub hosts and the
usual package registries are allowed; **an arbitrary domain is not**.

If you configure Lumo Pro without allowlisting its host, the calls are blocked
and GitHub writes a warning into the pull request body naming the blocked
address. The agent then writes WordPress code with no checker attached, and the
only sign is a warning that looks like the tool is broken.

So do this before anything else, under **Settings → Copilot → Internet access →
Custom allowlist** on the repository (or organisation-wide):

```
mcp.unleash-wp.com
```

**Lumo Free needs no allowlist entry.** It runs as a local stdio server installed
from npm, and package registries are on the default allowlist. If you want the
smallest possible setup, start there.

## Configure the server

Under **Settings → Copilot → MCP servers**, as JSON. This is a repository
setting, not a file in the repo.

### Free

```json
{
  "mcpServers": {
    "lumo": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@unleashwp/lumo", "mcp"],
      "tools": ["lumo_audit", "lumo_lookup", "lumo_check_code"]
    }
  }
}
```

### Pro

```json
{
  "mcpServers": {
    "lumo": {
      "type": "http",
      "url": "https://mcp.unleash-wp.com/mcp",
      "headers": {
        "Authorization": "Bearer $COPILOT_MCP_LUMO_LICENSE_KEY"
      },
      "tools": ["lumo_lookup", "lumo_check_code", "lumo_check_deprecation", "lumo_compat_check", "lumo_plugin_advice", "lumo_migration_pattern", "lumo_core_update_briefing", "lumo_propose_config"]
    }
  }
}
```

Store the key as an **Agents** secret named `LUMO_LICENSE_KEY`. Only secrets
whose names start with `COPILOT_MCP_` are visible to the MCP configuration, which
is why the reference above carries that prefix while the secret itself does not.

`tools` is required and we list the names rather than `"*"` on purpose: an
allowlist that names its tools breaks loudly when a name changes, where `"*"`
would quietly hand the agent whatever the server happens to expose next.

## Tell the agent to use it

Availability is not usage. Add this to `AGENTS.md` in your repository, or to
`.github/copilot-instructions.md`:

```markdown
## WordPress code

Before writing WordPress or WooCommerce PHP/JS, call `lumo_lookup` with the topic
in your own words and follow the pattern it returns. Before opening the pull
request, pass the code you wrote to `lumo_check_code`.

Read the flags, not the prose:

- `computed: false` means the check did not produce a usable verdict. It is not a
  pass. Say so in the pull request instead of treating the code as clean.
- `complete: false` means the check hit one of its own limits. What came back is
  real, but there may be more.
- A miss from `lumo_lookup` is not approval. It means Lumo has no
  source-verified answer for that topic, so do not read silence as agreement.
```

That last paragraph is the part that matters. The tools are built so a caller
that reads the flags cannot be told a fault was a clean result, but only if the
caller actually reads them.

## What this does not do

It does not review the pull request after the fact. That is the GitHub Action
([unleash-wp/lumo-action](https://github.com/unleash-wp/lumo-action)), and the two
are worth running together: the agent path catches a pattern while the code is
being written, the Action catches what any contributor pushes, agent or human.

It also does not make the agent's own reasoning current. Lumo answers when asked
and stays quiet otherwise; an agent that never calls it gets no benefit, which is
what the instructions block above is for.
