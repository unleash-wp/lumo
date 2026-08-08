<?php
/**
 * The two abilities.
 *
 * `lumo/verified-pattern` answers before generation: an agent about to write
 * WordPress code asks what the current correct pattern is and gets one that was
 * verified in a sandbox, with the source that dates it. That is the moment
 * where wrong code is cheapest to prevent — before it exists.
 *
 * `lumo/check-code` is the gate after generation and before execution. It needs
 * the licensed server, because the engine that decides loud-versus-quiet lives
 * there. Without a licence it refuses in a way that cannot be mistaken for a
 * pass: no verdict, stated as no verdict.
 *
 * Both are read-only. This plugin never writes, never executes, and never
 * touches the site's content.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Who may ask. The knowledge itself is public — these are published WordPress
 * facts — but an ability is an endpoint, and an endpoint open to anonymous
 * visitors is a liability with no upside. `edit_posts` is the floor a developer
 * or an agent acting for one already clears.
 */
function lumo_ability_permission(): bool {
	return current_user_can( 'edit_posts' );
}

add_action(
	'wp_abilities_api_categories_init',
	static function (): void {
		wp_register_ability_category(
			'lumo',
			[
				'label'       => __( 'Lumo', 'lumo' ),
				'description' => __( 'Verified WordPress patterns and the code catch.', 'lumo' ),
			]
		);
	}
);

add_action(
	'wp_abilities_api_init',
	static function (): void {
		wp_register_ability(
			'lumo/verified-pattern',
			[
				'label'       => __( 'Get the verified WordPress pattern', 'lumo' ),
				'description' => __(
					'Before writing WordPress code, get the current correct pattern for the task, with the source it comes from and the date it was verified. Ask by topic (for example "escaping output" or "REST permission callback") or by exact entry slug. Returns the correct pattern, the wrong one for contrast, a source URL and a verification step. Answers only from curated, source-verified knowledge: when nothing matches it says so instead of guessing.',
					'lumo'
				),
				'category'            => 'lumo',
				'execute_callback'    => 'lumo_execute_verified_pattern',
				'permission_callback' => 'lumo_ability_permission',
				'input_schema'        => [
					'type'       => 'object',
					'properties' => [
						'topic' => [
							'type'        => 'string',
							'description' => __( 'What you are about to write, in your own words. Example: "reading order meta", "nonce in an ajax handler".', 'lumo' ),
						],
						'slug'  => [
							'type'        => 'string',
							'description' => __( 'Exact entry slug, when you already know it. Takes priority over topic.', 'lumo' ),
						],
					],
				],
				'meta'                => [
					'show_in_rest' => true,
					'mcp'          => [ 'public' => true, 'type' => 'tool' ],
					'annotations'  => [
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					],
				],
			]
		);

		wp_register_ability(
			'lumo/check-code',
			[
				'label'       => __( 'Check WordPress code against the live catch', 'lumo' ),
				'description' => __(
					'Pass WordPress PHP or JS here before running or shipping it. Returns any place the code uses a pattern that broke in a real release, with the dated source and the correct form. Requires a Lumo Pro licence: the catch runs on the licensed server. Without one it returns no verdict and says so — never a pass.',
					'lumo'
				),
				'category'            => 'lumo',
				'execute_callback'    => 'lumo_execute_check_code',
				'permission_callback' => 'lumo_ability_permission',
				'input_schema'        => [
					'type'       => 'object',
					'properties' => [
						'code' => [
							'type'        => 'string',
							'description' => __( 'The PHP or JS to check.', 'lumo' ),
						],
					],
					'required'   => [ 'code' ],
				],
				'meta'                => [
					'show_in_rest' => true,
					'mcp'          => [ 'public' => true, 'type' => 'tool' ],
					'annotations'  => [
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					],
				],
			]
		);
	}
);

/**
 * @param mixed $input
 * @return array<string, mixed>|WP_Error
 */
function lumo_execute_verified_pattern( $input ) {
	// Schema defaults are not injected, so read defensively rather than
	// assuming the keys exist.
	$args  = is_array( $input ) ? $input : [];
	$slug  = isset( $args['slug'] ) && is_string( $args['slug'] ) ? trim( $args['slug'] ) : '';
	$topic = isset( $args['topic'] ) && is_string( $args['topic'] ) ? trim( $args['topic'] ) : '';

	if ( null === lumo_load_snapshot() ) {
		return new WP_Error(
			'lumo_snapshot_unavailable',
			__( 'The bundled knowledge snapshot could not be read, so nothing was looked up. This is not an answer about your code — reinstall the plugin or report this.', 'lumo' ),
			[ 'status' => 500 ]
		);
	}

	if ( '' === $slug && '' === $topic ) {
		return new WP_Error(
			'lumo_missing_query',
			__( 'Pass a "topic" describing what you are about to write, or a "slug" if you know the exact entry.', 'lumo' ),
			[ 'status' => 400 ]
		);
	}

	if ( '' !== $slug ) {
		$entry = lumo_find_entry( $slug );
		if ( null === $entry ) {
			return [
				'found'          => false,
				'message'        => sprintf(
					/* translators: %s: the slug that was looked up. */
					__( 'No curated entry with the slug "%s". Nothing is claimed about that topic either way.', 'lumo' ),
					$slug
				),
				'knowledge_date' => lumo_knowledge_date(),
			];
		}
		return [ 'found' => true, 'match' => lumo_format_entry( $entry ) ];
	}

	$matches = lumo_search_entries( $topic );
	if ( [] === $matches ) {
		return [
			'found'          => false,
			'message'        => __( 'Nothing in the curated knowledge matches that topic. That is not a verdict on the pattern you had in mind — it means Lumo has no source-verified answer for it, so do not treat silence as approval.', 'lumo' ),
			'knowledge_date' => lumo_knowledge_date(),
		];
	}

	return [
		'found'       => true,
		'match'       => lumo_format_entry( $matches[0] ),
		'also_ranked' => array_map(
			static fn( array $e ): array => [
				'slug'  => (string) ( $e['slug'] ?? '' ),
				'title' => (string) ( $e['title'] ?? '' ),
			],
			array_slice( $matches, 1 )
		),
	];
}

/**
 * @param mixed $input
 * @return array<string, mixed>|WP_Error
 */
function lumo_execute_check_code( $input ) {
	$args = is_array( $input ) ? $input : [];
	$code = isset( $args['code'] ) && is_string( $args['code'] ) ? $args['code'] : '';

	if ( '' === trim( $code ) ) {
		return new WP_Error(
			'lumo_missing_code',
			__( 'Pass the code to check in the "code" field.', 'lumo' ),
			[ 'status' => 400 ]
		);
	}

	$licence = lumo_licence_key();
	if ( '' === $licence ) {
		// The shape mirrors the free MCP server's verdict: `checked` false means
		// the check did not happen. An agent must not read the absence of
		// findings as an absence of problems.
		return [
			'checked'  => false,
			'findings' => [],
			'message'  => __( 'The code catch is part of Lumo Pro and no licence key is configured, so this code was NOT checked. This is not a pass. Use lumo/verified-pattern to ask what the correct pattern is, or add a licence key in Settings, Lumo.', 'lumo' ),
		];
	}

	return lumo_remote_check( $code, $licence );
}

/** The licence key, from the site option or a constant in wp-config.php. */
function lumo_licence_key(): string {
	if ( defined( 'LUMO_LICENSE_KEY' ) && is_string( LUMO_LICENSE_KEY ) ) {
		return trim( LUMO_LICENSE_KEY );
	}
	$stored = get_option( 'lumo_license_key', '' );
	return is_string( $stored ) ? trim( $stored ) : '';
}

/**
 * Ask the licensed server. Every failure path returns `checked: false` with a
 * reason: a request that did not complete must never be reported as one that
 * found nothing.
 *
 * @return array<string, mixed>
 */
function lumo_remote_check( string $code, string $licence ): array {
	$url = defined( 'LUMO_PRO_URL' ) && is_string( LUMO_PRO_URL )
		? rtrim( LUMO_PRO_URL, '/' )
		: (string) get_option( 'lumo_pro_url', '' );

	if ( '' === $url ) {
		return [
			'checked'  => false,
			'findings' => [],
			'message'  => __( 'A licence key is configured but no Lumo Pro server URL is set, so nothing was checked. This is not a pass.', 'lumo' ),
		];
	}

	$response = wp_remote_post(
		$url . '/mcp',
		[
			'timeout' => 15,
			'headers' => [
				'authorization' => 'Bearer ' . $licence,
				'content-type'  => 'application/json',
				'accept'        => 'application/json, text/event-stream',
			],
			'body'    => wp_json_encode(
				[
					'jsonrpc' => '2.0',
					'id'      => 1,
					'method'  => 'tools/call',
					'params'  => [
						'name'      => 'lumo_check_code',
						'arguments' => [ 'code' => $code ],
					],
				]
			),
		]
	);

	if ( is_wp_error( $response ) ) {
		return [
			'checked'  => false,
			'findings' => [],
			'message'  => sprintf(
				/* translators: %s: the transport error message. */
				__( 'The Lumo Pro server could not be reached (%s), so this code was NOT checked. This is not a pass.', 'lumo' ),
				$response->get_error_message()
			),
		];
	}

	$status = (int) wp_remote_retrieve_response_code( $response );
	if ( $status < 200 || $status > 299 ) {
		return [
			'checked'  => false,
			'findings' => [],
			'message'  => sprintf(
				/* translators: %d: the HTTP status code. */
				__( 'The Lumo Pro server answered %d, so this code was NOT checked. This is not a pass; check the licence key and the server status.', 'lumo' ),
				$status
			),
		];
	}

	$body = json_decode( (string) wp_remote_retrieve_body( $response ), true );
	$text = $body['result']['content'][0]['text'] ?? null;
	if ( ! is_string( $text ) ) {
		return [
			'checked'  => false,
			'findings' => [],
			'message'  => __( 'The Lumo Pro server answered in a shape this plugin does not understand, so nothing can be reported. This is not a pass.', 'lumo' ),
		];
	}

	return [
		'checked' => true,
		'report'  => $text,
		'found'   => (bool) ( $body['result']['structuredContent']['found'] ?? false ),
	];
}
