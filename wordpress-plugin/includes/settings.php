<?php
/**
 * The licence screen.
 *
 * It exists because `lumo/check-code` tells the user to come here when no
 * licence is configured. A message that points at a screen which does not exist
 * is the same class of untruth as a check that did not run reporting a pass.
 *
 * Both settings register a sanitize callback. Lumo's own knowledge flags
 * `register_setting()` without one, and a plugin that ships the rule while
 * breaking it would deserve every bit of the ridicule.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'admin_init',
	static function (): void {
		register_setting(
			'lumo',
			'lumo_license_key',
			[
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => '',
				'show_in_rest'      => false, // A licence key is not public.
			]
		);
		register_setting(
			'lumo',
			'lumo_pro_url',
			[
				'type'              => 'string',
				'sanitize_callback' => 'esc_url_raw',
				'default'           => '',
				'show_in_rest'      => false,
			]
		);
	}
);

add_action(
	'admin_menu',
	static function (): void {
		add_options_page(
			__( 'Lumo', 'lumo' ),
			__( 'Lumo', 'lumo' ),
			'manage_options',
			'lumo',
			'lumo_render_settings_page'
		);
	}
);

function lumo_render_settings_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$date    = lumo_knowledge_date();
	$licence = lumo_licence_key();
	?>
	<div class="wrap">
		<h1><?php echo esc_html__( 'Lumo', 'lumo' ); ?></h1>

		<p>
			<?php
			if ( null === $date ) {
				echo esc_html__( 'The bundled knowledge could not be read. The pattern lookup will report that instead of answering.', 'lumo' );
			} else {
				printf(
					/* translators: %s: the knowledge date, YYYY-MM-DD. */
					esc_html__( 'Bundled knowledge of %s. The pattern lookup works offline and needs no licence.', 'lumo' ),
					esc_html( $date )
				);
			}
			?>
		</p>

		<p>
			<?php
			echo '' === $licence
				? esc_html__( 'No licence key set: the code catch does not run, and it reports that rather than reporting a pass.', 'lumo' )
				: esc_html__( 'A licence key is set. The code catch runs on your Lumo Pro server.', 'lumo' );
			?>
		</p>

		<form action="options.php" method="post">
			<?php settings_fields( 'lumo' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row">
						<label for="lumo_pro_url"><?php echo esc_html__( 'Lumo Pro server URL', 'lumo' ); ?></label>
					</th>
					<td>
						<input
							type="url"
							id="lumo_pro_url"
							name="lumo_pro_url"
							class="regular-text"
							value="<?php echo esc_attr( (string) get_option( 'lumo_pro_url', '' ) ); ?>"
							placeholder="https://mcp.example.com"
						/>
						<p class="description"><?php echo esc_html__( 'Base URL, without the /mcp path.', 'lumo' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="lumo_license_key"><?php echo esc_html__( 'Licence key', 'lumo' ); ?></label>
					</th>
					<td>
						<input
							type="password"
							id="lumo_license_key"
							name="lumo_license_key"
							class="regular-text"
							value="<?php echo esc_attr( $licence ); ?>"
							autocomplete="off"
						/>
						<p class="description">
							<?php echo esc_html__( 'Both can also be set in wp-config.php as LUMO_PRO_URL and LUMO_LICENSE_KEY, which keeps them out of the database.', 'lumo' ); ?>
						</p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}
