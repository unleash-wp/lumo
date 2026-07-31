# WordPress Hooks and Filters: Stable Reference

The hook system is WordPress's entire extension surface. Understanding it at the
implementation level, not just the API level, prevents a wide class of bugs
that show up only under specific load conditions or plugin combinations.

---

## How `$wp_filter` works

WordPress maintains a single global `$wp_filter` array keyed by hook name. Each
entry is a `WP_Hook` object introduced in WordPress 4.7. Before 4.7 the storage
was a plain array; today `WP_Hook` handles priority sorting, nested hook calls
(hooks firing inside hook callbacks), and `current_filter()` tracking.

Each registered callback is stored under its priority bucket:

```php
$wp_filter['save_post'][10][0] = [
    'function'      => $callback,
    'accepted_args' => 2,
];
```

When `do_action( 'save_post', $post_id, $post )` fires, `WP_Hook::do_action()`
iterates the priority buckets in ascending numeric order and passes the
arguments to each callback.

Understanding this matters in two practical situations:

1. **Removing a callback**: `remove_action()` requires the same hook name,
   callable reference, and priority used in `add_action()`. Anonymous functions
   cannot be removed; closures should be assigned to a variable or a class
   property before registration.

2. **Nested hook calls**: A callback firing inside `do_action()` can safely call
   `add_action()` on the same hook. `WP_Hook` handles re-entrance without
   infinite loops. It does not, however, retroactively add the new callback to
   the currently executing iteration.

---

## Priority model

Priorities are integers. Lower runs earlier. The default is `10`.

- `1`: runs very early; useful for setup that must precede the main handler
- `10`: the default; most callbacks land here
- `20`: runs after the default bucket; useful for reactions that depend on the main handler having run
- `PHP_INT_MAX`: last possible slot; used by WordPress core for cleanup and shutdown routines

Priority is not a global ordering across all hooks. It only sorts callbacks
registered on the same hook name.

**Removing a callback added at a non-default priority:**

```php
// Both priority arguments must match.
add_action( 'init', 'my_function', 5 );
remove_action( 'init', 'my_function', 5 );
```

If you omit the priority from `remove_action()` it defaults to `10` and the
removal silently does nothing.

---

## Actions vs. filters

- `do_action()` fires an action. Callbacks registered with `add_action()` run as
  side effects. Return values are ignored.
- `apply_filters()` fires a filter. Callbacks registered with `add_filter()` each
  receive the current value, can modify it, and must return it. The final return
  value replaces the original.

A filter that does not return anything returns `null`, which replaces the value
with `null`. This is one of the more common silent bugs in WordPress development.

---

## Request lifecycle: hooks by phase

A standard frontend request fires hooks roughly in this order. Times are
relative, not absolute. Plugin code can fire hooks out of this sequence.

### Very early (before `init`)

| Hook | When | Common use |
|------|------|-----------|
| `muplugins_loaded` | After mu-plugins load | Early bootstrapping that must precede plugins |
| `plugins_loaded` | After all active plugins load | Checking for plugin dependencies, loading translations |
| `setup_theme` | Before the active theme loads | Rarely used directly |
| `after_setup_theme` | After functions.php runs | `add_theme_support()`, registering menus/sidebars |

### Core initialization

| Hook | When | Common use |
|------|------|-----------|
| `init` | Core is ready, user is authenticated | Registering post types, taxonomies, rewrite rules, REST routes |
| `wp_loaded` | After `init`, after all registrations | Finalized registrations; safe point for any global setup |

### Query and template selection

| Hook | When | Common use |
|------|------|-----------|
| `parse_request` | After the request URL is parsed | Modifying query variables before the query runs |
| `pre_get_posts` | Before `WP_Query::get_posts()` runs | Modifying queries (check `is_main_query()` to avoid touching secondary queries) |
| `wp` | After the main query runs | Any logic that needs the queried object |
| `template_redirect` | Before the template file is chosen | Redirects, 404 handling, custom template routing |
| `template_include` | Filter on the resolved template path | Overriding the template file that will load |

### Head and body

| Hook | When | Common use |
|------|------|-----------|
| `wp_head` | Inside `<head>` | Output from `wp_print_scripts()`, meta tags; prefer enqueueing over direct output here |
| `wp_body_open` | Immediately after `<body>` opens (requires theme support) | Skip links, accessibility landmarks |
| `loop_start` / `loop_end` | Around `the_loop` | Wrapping output around the post loop |
| `the_content` | Filter applied to post content on output | Content modification: strip tags, add wrappers, append content |
| `wp_footer` | Before `</body>` | Scripts, tracking pixels (prefer `wp_enqueue_script` with `$in_footer = true`) |

### Admin request lifecycle (condensed)

| Hook | When | Common use |
|------|------|-----------|
| `admin_init` | Early in wp-admin, after `init` | Admin-only registration, settings API init, capability checks for admin pages |
| `admin_menu` | Menus registered | Adding menu pages with `add_menu_page()`, `add_submenu_page()` |
| `admin_enqueue_scripts` | Scripts and styles for admin | Enqueueing admin assets; check the `$hook_suffix` argument to target specific pages |
| `admin_notices` | Above admin page content | Displaying dismissible admin notices |
| `save_post` | After a post is saved via the editor | Saving custom meta, triggering side effects; always nonce-check and `current_user_can()` before acting |

---

## Key content and data filters

These filters touch output that goes directly to users. They are among the most
commonly misused.

| Filter | Applied to | Note |
|--------|-----------|------|
| `the_content` | Post content, escaped HTML | Do not output raw `$_GET`/`$_POST` values in a callback; the content is already through `wp_kses_post()` |
| `the_title` | Post title, plain text context | Context-dependent escaping: `esc_html()` in most uses, `esc_attr()` inside HTML attributes |
| `widget_title` | Widget title, plain text | Same context rules as `the_title` |
| `option_<name>` | Return value of `get_option( '<name>' )` | Sanitize on save, not on read |
| `wp_nav_menu_items` | Rendered menu HTML | Receives full HTML string; treat it as trusted markup unless you have injected user input |

---

## The Settings API hook sequence

The Settings API (for options pages) uses a specific hook sequence that is worth
knowing explicitly to avoid double-registration bugs:

```php
add_action( 'admin_init', function() {
    register_setting( 'my_group', 'my_option', [
        'sanitize_callback' => 'sanitize_text_field',
        'default'           => '',
    ] );

    add_settings_section( 'my_section', 'Section Title', '__return_false', 'my-page' );

    add_settings_field(
        'my_field',
        'Field Label',
        'my_field_callback',
        'my-page',
        'my_section'
    );
} );
```

`register_setting()` must be called on `admin_init`. The `sanitize_callback`
runs on option save, not on read. Sanitize on write, escape on output.

---

## WooCommerce hooks (stable surface)

WooCommerce is built on the same `$wp_filter` system. These hooks have been
stable across the modern WooCommerce versions (7.x through 9.x at the time of
writing):

| Hook | Type | Use |
|------|------|-----|
| `woocommerce_init` | action | WooCommerce is ready; safe to call WC functions |
| `woocommerce_loaded` | action | Full WC bootstrap complete; later than `woocommerce_init` |
| `woocommerce_product_query` | action | Modify product archive queries; receives the `WP_Query` object |
| `woocommerce_before_add_to_cart_button` | action | Add content before the add-to-cart button on single product pages |
| `woocommerce_cart_calculate_fees` | action | Add fees to the cart; receives the `WC_Cart` instance |
| `woocommerce_payment_complete` | action | Fires after a payment is marked complete; receives `$order_id` |
| `woocommerce_order_status_changed` | action | Order status transitions; receives `( $order_id, $old_status, $new_status, $order )` |
| `woocommerce_product_get_price` | filter | Modify the price returned by `$product->get_price()` |
| `woocommerce_add_to_cart_validation` | filter | Return `false` to block add-to-cart; use for stock/availability checks |

For order-data patterns (HPOS vs. legacy `get_post_meta`), always route through
`lumo_check_code`. That is the fastest-moving area of WooCommerce and the one
most likely to differ from what any static reference says.

---

## Practical patterns

**Late-binding for plugin dependencies**

Check for another plugin's classes or functions inside a `plugins_loaded`
callback, not at file load time:

```php
add_action( 'plugins_loaded', function() {
    if ( ! class_exists( 'WooCommerce' ) ) {
        return;
    }
    // Safe to reference WC classes here.
} );
```

**Removing a class method hook**

```php
// Adding:
$instance = new My_Plugin();
add_action( 'init', [ $instance, 'register_post_types' ] );

// Removing (must hold the same instance reference):
remove_action( 'init', [ $instance, 'register_post_types' ] );
```

Static methods use `[ 'My_Plugin', 'static_method' ]` or `'My_Plugin::static_method'`. Both forms work, but they are not interchangeable in `remove_action()`.

**Conditional hook output for custom post types**

```php
add_action( 'pre_get_posts', function( WP_Query $query ) {
    if ( $query->is_main_query() && $query->is_post_type_archive( 'product' ) ) {
        $query->set( 'posts_per_page', 24 );
    }
} );
```

Always guard with `is_main_query()` to avoid modifying widget or secondary loops.
