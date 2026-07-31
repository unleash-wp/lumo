=== Lumo — verified WordPress patterns for AI agents ===
Contributors: unleashwp
Tags: ai, agents, abilities, mcp, code-quality
Requires at least: 6.9
Tested up to: 6.9
Requires PHP: 8.0
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Hands an AI agent the current, source-verified WordPress pattern before it writes the code. Read-only, works offline.

== Description ==

An AI assistant's WordPress knowledge stops at its training cutoff. WordPress does not. This plugin registers two WordPress Abilities, so any agent connected to your site — through an MCP host, the REST API, or the Command Palette — can ask what the current correct pattern is *before* it writes code, instead of reconstructing it from memory.

**lumo/verified-pattern** — ask by topic or by slug and get the correct pattern, the wrong one for contrast, a source URL and a step to verify it yourself. Every entry is curated and carries the date it was verified. When nothing matches, it says so: silence is never presented as approval.

**lumo/check-code** — pass code through the Lumo catch before running or shipping it. This needs a Lumo Pro licence, because the detection engine runs on the licensed server. Without a licence it returns no verdict and says exactly that. It never reports a pass it did not earn.

The plugin is read-only. It never writes content, never executes code, and never modifies your site.

= What runs where =

The pattern lookup runs entirely on your server against a bundled snapshot of 42 curated entries. No account, no network, no data leaves your site.

The code catch sends the code you pass it to the Lumo Pro server you configure, and only when you have configured one. Nothing is sent anywhere by default.

= Honest about its limits =

Lumo's knowledge covers WordPress Core, block and theme APIs, and security fundamentals. WooCommerce and premium plugins are Lumo Pro. Where the free tier cannot answer, it names the gap instead of going quiet — that boundary is the product, not a footnote.

== Installation ==

1. Install and activate. WordPress 6.9 or later is required (the Abilities API arrived in 6.9).
2. Nothing else is needed for the pattern lookup.
3. For the code catch, add your Lumo Pro server URL and licence key under Settings → Lumo, or define `LUMO_PRO_URL` and `LUMO_LICENSE_KEY` in `wp-config.php` to keep them out of the database.

== Frequently Asked Questions ==

= Does this send my code anywhere? =

The pattern lookup does not: it reads a file bundled with the plugin. The code catch sends what you pass to it to the Lumo Pro server you configured, and it only exists once you configure one.

= Does it work without an AI agent? =

The abilities are also exposed over the REST API, so anything that speaks `wp-abilities/v1` can use them. They are most useful to an agent, but nothing here requires one.

= What happens when my subscription ends? =

The bundled pattern lookup keeps working — it is part of the plugin. The code catch stops and says so.

== Changelog ==

= 0.1.0 =
* First release: the two abilities, the bundled snapshot, and the licence screen.
