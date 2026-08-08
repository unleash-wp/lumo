<?php
/**
 * Plugin Name: Lumo — verified WordPress patterns for AI agents
 * Plugin URI: https://unleash-wp.com/lumo
 * Description: Registers WordPress Abilities that hand an AI agent the current, source-verified pattern for a WordPress task — before it writes the code. Read-only. Works offline from a bundled snapshot; a Lumo Pro licence adds the daily-tended knowledge and the code catch.
 * Version: 0.1.0
 * Requires at least: 6.9
 * Requires PHP: 8.0
 * Author: UnleashWP
 * Author URI: https://unleash-wp.com
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: lumo
 *
 * Why an Abilities plugin at all: an agent that can execute WordPress code is
 * only as safe as what it knew before it wrote that code. Registering the
 * knowledge as an ability puts it in the same tool list as the execution tools
 * an agent already holds — it can ask before it acts, in the session it is
 * already in. Any MCP host that reads the Abilities registry picks this up;
 * none of it is specific to one host.
 *
 * What this plugin deliberately does NOT do: re-implement the detection engine
 * in PHP. That engine decides what is loud, what stays quiet, and what counts
 * as a source — a second copy of that logic would drift, and it would drift in
 * the honesty rules, which is the worst place for drift. So the lookup runs
 * locally against the bundled snapshot, and code checking is delegated to the
 * licensed server that owns the engine.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'LUMO_VERSION', '0.1.0' );
define( 'LUMO_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

/**
 * The Abilities API is WordPress 6.9 and later. On older installs the plugin
 * stays inert and says why on the plugins screen, rather than fataling or —
 * worse — appearing installed while registering nothing.
 */
function lumo_abilities_available(): bool {
	return function_exists( 'wp_register_ability' ) && function_exists( 'wp_register_ability_category' );
}

require_once LUMO_PLUGIN_DIR . 'includes/knowledge.php';
require_once LUMO_PLUGIN_DIR . 'includes/abilities.php';
require_once LUMO_PLUGIN_DIR . 'includes/settings.php';

add_action(
	'admin_notices',
	static function (): void {
		if ( lumo_abilities_available() ) {
			return;
		}
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}
		printf(
			'<div class="notice notice-warning"><p>%s</p></div>',
			esc_html__(
				'Lumo is installed but inactive: this site has no Abilities API. WordPress 6.9 or later is required.',
				'lumo'
			)
		);
	}
);
