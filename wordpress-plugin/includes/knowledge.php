<?php
/**
 * The bundled snapshot: reading it, searching it, and saying when it is absent.
 *
 * The ranking is the same one the MCP server and the Forge adapter use — slug 4,
 * title 3, category 2, summary 1 per matched term — so the same question ranks
 * the same answer on every surface. A user who learns the search on one of them
 * has learned it on all of them.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Load the snapshot once per request.
 *
 * @return array{generatedAt?: string, entries?: array<int, array<string, mixed>>}|null
 *         Null when the file is missing or unreadable — callers must say so
 *         rather than answering from nothing.
 */
function lumo_load_snapshot(): ?array {
	static $snapshot = null;
	static $loaded   = false;

	if ( $loaded ) {
		return $snapshot;
	}
	$loaded = true;

	$path = LUMO_PLUGIN_DIR . 'data/snapshot.json';
	if ( ! is_readable( $path ) ) {
		return null;
	}

	$raw = file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions -- local bundled file, no HTTP.
	if ( false === $raw ) {
		return null;
	}

	$decoded = json_decode( $raw, true );
	if ( ! is_array( $decoded ) || ! isset( $decoded['entries'] ) || ! is_array( $decoded['entries'] ) ) {
		return null;
	}

	$snapshot = $decoded;
	return $snapshot;
}

/** The knowledge date, as the snapshot states it. Never a clock read. */
function lumo_knowledge_date(): ?string {
	$snapshot = lumo_load_snapshot();
	if ( null === $snapshot || ! isset( $snapshot['generatedAt'] ) || ! is_string( $snapshot['generatedAt'] ) ) {
		return null;
	}
	return substr( $snapshot['generatedAt'], 0, 10 );
}

/**
 * Score one entry against the search terms.
 *
 * @param array<string, mixed> $entry
 * @param list<string>         $terms
 */
function lumo_score_entry( array $entry, array $terms ): int {
	$slug     = strtolower( (string) ( $entry['slug'] ?? '' ) );
	$title    = strtolower( (string) ( $entry['title'] ?? '' ) );
	$summary  = strtolower( (string) ( $entry['summary'] ?? '' ) );
	$category = strtolower( (string) ( $entry['category_slug'] ?? '' ) );

	$score = 0;
	foreach ( $terms as $term ) {
		if ( str_contains( $slug, $term ) ) {
			$score += 4;
		}
		if ( str_contains( $title, $term ) ) {
			$score += 3;
		}
		if ( str_contains( $category, $term ) ) {
			$score += 2;
		}
		if ( str_contains( $summary, $term ) ) {
			$score += 1;
		}
	}
	return $score;
}

/**
 * Rank entries for a free-text query.
 *
 * @return list<array<string, mixed>> Best first, at most $limit.
 */
function lumo_search_entries( string $query, int $limit = 5 ): array {
	$snapshot = lumo_load_snapshot();
	if ( null === $snapshot ) {
		return [];
	}

	$terms = array_values(
		array_filter(
			preg_split( '/\s+/', strtolower( trim( $query ) ) ) ?: [],
			static fn( string $t ): bool => strlen( $t ) > 1
		)
	);
	if ( [] === $terms ) {
		return [];
	}

	$scored = [];
	foreach ( $snapshot['entries'] as $entry ) {
		if ( ! is_array( $entry ) ) {
			continue;
		}
		$score = lumo_score_entry( $entry, $terms );
		if ( $score > 0 ) {
			$scored[] = [ 'entry' => $entry, 'score' => $score ];
		}
	}

	usort(
		$scored,
		static function ( array $a, array $b ): int {
			if ( $a['score'] !== $b['score'] ) {
				return $b['score'] <=> $a['score'];
			}
			return strcmp( (string) $a['entry']['slug'], (string) $b['entry']['slug'] );
		}
	);

	return array_map(
		static fn( array $row ): array => $row['entry'],
		array_slice( $scored, 0, $limit )
	);
}

/**
 * Fetch one entry by its exact slug.
 *
 * @return array<string, mixed>|null
 */
function lumo_find_entry( string $slug ): ?array {
	$snapshot = lumo_load_snapshot();
	if ( null === $snapshot ) {
		return null;
	}
	foreach ( $snapshot['entries'] as $entry ) {
		if ( is_array( $entry ) && ( $entry['slug'] ?? null ) === $slug ) {
			return $entry;
		}
	}
	return null;
}

/**
 * Shape one entry for an agent: the correct pattern first, the wrong one for
 * contrast, and the source that dates both.
 *
 * @param array<string, mixed> $entry
 * @return array<string, mixed>
 */
function lumo_format_entry( array $entry ): array {
	$date = lumo_knowledge_date();

	return [
		'slug'            => (string) ( $entry['slug'] ?? '' ),
		'title'           => (string) ( $entry['title'] ?? '' ),
		'summary'         => (string) ( $entry['summary'] ?? '' ),
		'correct_pattern' => (string) ( $entry['code_example'] ?? '' ),
		'wrong_pattern'   => (string) ( $entry['bad_pattern'] ?? '' ),
		'source_url'      => (string) ( $entry['source_url'] ?? '' ),
		'verify_step'     => (string) ( $entry['test_step'] ?? '' ),
		'knowledge_date'  => $date,
		// A hit is where over-confidence starts: an agent that gets an answer
		// for its topic reads the topic as covered, and a file on disk keeps
		// saying "current" long after it stopped being current. So every hit
		// carries its own age and its own limit, not just every miss.
		'scope'           => sprintf(
			/* translators: %s: the knowledge date, YYYY-MM-DD. */
			__( 'Verified as of %s and shipped with this plugin — it changes only when the plugin updates. It covers 42 curated WordPress Core, block, theme and security topics; a match here says nothing about the rest of your code.', 'lumo' ),
			null === $date ? __( 'an unknown date', 'lumo' ) : $date
		),
	];
}
