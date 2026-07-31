# WordPress Security and Performance: Stable Reference

Security and performance sit on stable APIs that have not materially changed in
years. The patterns here are safe to apply without routing through Lumo first.
Where a pattern touches WooCommerce order data, always run `lumo_check_code`.
HPOS rewired several assumptions about where and how data is stored.

---

## Security

### The sanitize-at-entry / escape-at-output contract

These are two separate operations at two different points. Mixing them up is the
root cause of most WordPress XSS and injection bugs.

**Sanitize at entry:** the moment untrusted data enters your code

```php
$title      = sanitize_text_field( $_POST['title'] ?? '' );
$count      = absint( $_GET['count'] ?? 0 );
$slug       = sanitize_title( $_POST['slug'] ?? '' );
$html_field = wp_kses_post( $_POST['content'] ?? '' );
$email      = sanitize_email( $_POST['email'] ?? '' );
$url        = esc_url_raw( $_POST['redirect_url'] ?? '' );
```

Pick the sanitizer that matches the expected data type. `sanitize_text_field()`
strips tags and extra whitespace, correct for plain text and too aggressive for
HTML. `wp_kses_post()` strips disallowed HTML tags and attributes, correct for
user-submitted rich text that will be stored in post content.

`esc_url_raw()` is for URLs that will be stored or compared. It does not add
HTML-attribute quoting. Use `esc_url()` for URLs in HTML attribute context.

**Escape at output:** the moment data leaves your code into HTML, JS, or SQL

```php
echo esc_html( $title );
echo esc_attr( $attribute_value );
echo esc_url( $link );
echo wp_kses( $html, $allowed_tags );
echo '<script>var data = ' . wp_json_encode( $array ) . ';</script>';
```

`esc_html()` converts `<`, `>`, `&`, `"`, `'` to HTML entities, safe for
text content between tags. `esc_attr()` does the same for text inside HTML
attribute values. `esc_url()` encodes a URL for use in `href`, `src`, or
`action` attributes.

Do not rely on sanitize functions to serve as escape functions. They operate on
storage format, not on output context.

### Nonces

A nonce is a one-time token tied to an action, user, and session. WordPress
nonces expire (default 24 hours, the full lifespan is 12–24 h with a tick
system) and are not true cryptographic nonces. They are keyed HMACs of
`$action + $uid + $tick`. Their purpose is CSRF prevention, not replay
prevention.

**Form nonces:**

```php
// Output (inside the form):
wp_nonce_field( 'save_my_settings', 'my_settings_nonce' );

// Verify (in the handler):
check_admin_referer( 'save_my_settings', 'my_settings_nonce' );
// check_admin_referer() calls wp_die() on failure, safe default.
```

**AJAX nonces:**

```php
// Localize nonce to JS:
wp_localize_script( 'my-script', 'myData', [
    'nonce' => wp_create_nonce( 'my_ajax_action' ),
    'ajaxurl' => admin_url( 'admin-ajax.php' ),
] );

// Verify in the AJAX handler:
add_action( 'wp_ajax_my_action', 'my_ajax_handler' );
add_action( 'wp_ajax_nopriv_my_action', 'my_ajax_handler' ); // if public

function my_ajax_handler(): void {
    check_ajax_referer( 'my_ajax_action', 'nonce' );
    current_user_can( 'edit_posts' ) || wp_send_json_error( 'Forbidden', 403 );
    // ... handler logic
    wp_send_json_success( $data );
}
```

Do not use `wp_verify_nonce()` in isolation without also checking capability.
Nonces confirm the request is intentional, not that the user is authorized to
perform the action.

### Capability checks

Always check the most specific capability available:

```php
// Too broad:
current_user_can( 'administrator' )         // checks role, not capability
current_user_can( 'manage_options' )        // admin-only, but unrelated to posts

// Appropriate:
current_user_can( 'edit_post', $post_id )   // checks ownership and role
current_user_can( 'publish_posts' )         // authorship-level check
current_user_can( 'manage_woocommerce' )    // WooCommerce-specific
```

Capability checks must precede any data modification. In REST API callbacks,
set `permission_callback` to a function that performs the check. Never
`'__return_true'` on routes that touch private data or trigger writes.

### Database queries

`$wpdb->prepare()` uses `%s`, `%d`, `%f` as placeholders and handles quoting:

```php
global $wpdb;

$results = $wpdb->get_results(
    $wpdb->prepare(
        "SELECT * FROM {$wpdb->posts} WHERE post_author = %d AND post_status = %s",
        $user_id,
        'publish'
    )
);
```

Do not use `%s` for integers. Pass the correct type to the placeholder.
`$wpdb->prepare()` in WordPress 5.3+ supports named placeholders (`%1$s`).

When querying custom tables, reference them through defined constants or
`$wpdb->prefix`: never hardcode `wp_` as the prefix.

### File and option storage

Store option values sanitized, retrieve them escaped:

```php
// Saving:
update_option( 'my_plugin_color', sanitize_hex_color( $raw ) );

// Reading for output:
echo esc_attr( get_option( 'my_plugin_color', '#ffffff' ) );
```

For user-uploaded files, validate MIME type server-side using
`wp_check_filetype_and_ext()`: do not rely on the `$_FILES['type']` field,
which is set by the browser and trivially spoofed.

---

## Performance

### The caching layer stack

WordPress has three distinct caching layers with different lifetimes:

1. **Object cache (in-memory, per-request):** `wp_cache_get()` / `wp_cache_set()` / `wp_cache_delete()`. In a default setup this is the non-persistent runtime cache (data lives for one request). When a persistent cache backend (Redis, Memcached) is installed via a `object-cache.php` drop-in, these calls become cross-request.

2. **Transients:** `set_transient()` / `get_transient()` / `delete_transient()`. Stored in `wp_options` by default; stored in the persistent cache when a backend is present (the `_transient_` key prefix is used). Transients have an expiry; they are suitable for expensive external API responses or aggregated query results.

3. **Page/fragment cache:** external to WordPress core (host-level caching, WP Super Cache, W3 Total Cache, or LiteSpeed Cache). These operate below WordPress and cannot be influenced by option or transient calls inside a request. They must be cleared explicitly when underlying data changes.

**Choosing between object cache and transients:**

Use the object cache (`wp_cache_*`) for data you need multiple times within a
single request. Use transients for data that is expensive to compute and safe
to serve slightly stale across requests.

```php
function my_get_expensive_data( int $id ): array {
    $cache_key = 'my_data_' . $id;
    $cached    = wp_cache_get( $cache_key, 'my_plugin' );

    if ( false !== $cached ) {
        return $cached;
    }

    $data = /* expensive computation or external call */;
    wp_cache_set( $cache_key, $data, 'my_plugin', HOUR_IN_SECONDS );
    return $data;
}
```

`wp_cache_get()` returns `false` on a miss. Guard against storing `false` as a
real value by using a sentinel, or rely on `wp_cache_set()` with `HOUR_IN_SECONDS`
expiry and simply re-computing on the next miss.

### WP_Query performance

`WP_Query` generates a full SQL query including a `SQL_CALC_FOUND_ROWS` clause
by default (for `$query->found_posts` pagination). On large tables this is
expensive. When pagination is not needed, set `'no_found_rows' => true`.

Other performance arguments:

```php
$query = new WP_Query( [
    'post_type'              => 'product',
    'post_status'            => 'publish',
    'posts_per_page'         => 20,
    'no_found_rows'          => true,  // skip count query
    'update_post_term_cache' => false, // skip term cache priming if not reading terms
    'update_post_meta_cache' => false, // skip meta cache priming if not reading meta
    'fields'                 => 'ids', // return IDs only if that is all you need
] );
```

`'fields' => 'ids'` returns an array of integers and skips building `WP_Post`
objects entirely, useful for checking existence or passing IDs to a secondary
query.

When querying by meta value, ensure `wp_postmeta` has an index on `meta_key`.
The default WordPress schema indexes `meta_key` and `meta_value` (prefix), but
compound queries on multiple meta keys can still be slow on large datasets.
Consider a custom table for high-cardinality relational data.

### Avoiding query multiplication in loops

The classic N+1 problem: loading a list of posts and then running a separate
query per post inside the loop.

```php
// Problematic: one query per post for the author name.
foreach ( $posts as $post ) {
    $author = get_user_by( 'id', $post->post_author ); // query per iteration
}

// Better: prime the cache first.
$author_ids = array_unique( wp_list_pluck( $posts, 'post_author' ) );
// WP_User_Query with these IDs loads all users in one query and primes
// the user cache so subsequent get_user_by() calls are cache hits.
$user_query = new WP_User_Query( [ 'include' => $author_ids ] );
```

WordPress's `update_post_caches()` and related priming functions do this for
standard post meta and terms. Use them when building custom queries.

### Asset loading

Load scripts and styles only on pages that need them. Check the `$hook_suffix`
argument passed to `admin_enqueue_scripts` callbacks:

```php
add_action( 'admin_enqueue_scripts', function( string $hook ) {
    if ( 'toplevel_page_my-plugin' !== $hook ) {
        return;
    }
    wp_enqueue_script( 'my-plugin-admin', plugin_dir_url( __FILE__ ) . 'js/admin.js', [ 'jquery' ], '1.0.0', true );
} );
```

On the frontend, use `wp_enqueue_scripts` with `is_singular()`, `is_archive()`,
or similar conditionals to restrict asset loading to relevant templates.

For JavaScript that needs WordPress-managed data, use `wp_localize_script()` or
the newer `wp_add_inline_script()` rather than printing a `<script>` block in a
template.

### Deferred and async script loading

In WordPress 6.3+, script loading strategy can be set via the `strategy`
argument in `wp_enqueue_script()`:

```php
wp_enqueue_script(
    'my-script',
    plugin_dir_url( __FILE__ ) . 'js/frontend.js',
    [],
    '1.0.0',
    [ 'strategy' => 'defer', 'in_footer' => true ]
);
```

`strategy` accepts `'defer'` or `'async'`. WordPress handles the dependency
chain automatically. If a deferred script depends on a non-deferred script,
WordPress will not set `defer` on the dependency.

This API stabilized in WordPress 6.3 and is available to rely on from that
version forward.

### Transient hygiene

Transients accumulate in `wp_options` when they are not given an expiry or
when autoload is not managed. Set expiry always. For site-wide transients in
multisite, use `set_site_transient()` / `get_site_transient()`. They store in
the network's `wp_sitemeta` rather than the current site's `wp_options`.

Delete transients explicitly when the underlying data changes rather than
waiting for expiry:

```php
// When a product is updated:
add_action( 'woocommerce_update_product', function( int $product_id ) {
    delete_transient( 'my_product_data_' . $product_id );
} );
```

### Database table prefixes in queries

Always use `$wpdb->posts`, `$wpdb->postmeta`, `$wpdb->options` etc. rather than
hardcoding `wp_posts`. On multisite, switched sites have different table
prefixes; `$wpdb` updates these properties when `switch_to_blog()` is called.
