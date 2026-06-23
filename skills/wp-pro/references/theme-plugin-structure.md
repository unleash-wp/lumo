# WordPress Theme and Plugin Structure — Stable Reference

File layout and architectural conventions have been stable since WordPress 3.x.
The patterns here will not rot. The one area to verify through Lumo is anything
touching Gutenberg, block themes (FSE), or theme.json — those move faster and
belong in `frontier.md`.

---

## Plugin architecture

### The main plugin file

Every plugin needs a single file in the plugin's root directory that carries the
standard plugin header comment. WordPress reads this header to populate the
Plugins admin screen and to determine which file to activate and deactivate.

```php
<?php
/**
 * Plugin Name:       My Plugin
 * Plugin URI:        https://example.com/my-plugin
 * Description:       A short description of what this plugin does.
 * Version:           1.0.0
 * Requires at least: 6.3
 * Requires PHP:      8.1
 * Author:            Your Name
 * Author URI:        https://example.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       my-plugin
 * Domain Path:       /languages
 */

defined( 'ABSPATH' ) || exit;
```

The `defined( 'ABSPATH' ) || exit;` guard prevents direct file execution outside
of WordPress. Put it at the top of every PHP file in the plugin, not just the
main file.

### File layout

```
my-plugin/
├── my-plugin.php          # main file with plugin header
├── uninstall.php          # runs on plugin deletion (not deactivation)
├── readme.txt             # WordPress.org-compatible readme
├── includes/
│   ├── class-my-plugin.php
│   ├── class-my-admin.php
│   └── functions.php
├── admin/
│   ├── class-my-admin-page.php
│   └── views/
│       └── settings-page.php
├── public/
│   ├── js/
│   └── css/
└── languages/
    └── my-plugin.pot
```

No enforced convention mandates this exact layout. The WP Coding Standards team
recommends separating admin from public code and using a class-per-file
convention with `class-` prefixed filenames in kebab-case. What matters most
is that every class file includes the `ABSPATH` guard and that the main file
does not `require` files from outside the plugin directory.

### Activation, deactivation, and uninstall hooks

```php
register_activation_hook( __FILE__, 'my_plugin_activate' );
register_deactivation_hook( __FILE__, 'my_plugin_deactivate' );

function my_plugin_activate(): void {
    // Create custom tables, set default options, flush rewrite rules.
    flush_rewrite_rules();
}

function my_plugin_deactivate(): void {
    // Clean up scheduled events. Do NOT delete data here — use uninstall.php.
    wp_clear_scheduled_hook( 'my_plugin_cron_event' );
}
```

**`uninstall.php`** runs when the plugin is deleted from the Plugins screen.
WordPress calls this file directly (not through activation hooks), so it must
include its own `ABSPATH` check and verify `WP_UNINSTALL_PLUGIN` is defined:

```php
<?php
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'my_plugin_settings' );
// Drop custom tables if the plugin created them.
```

Never delete user data in `deactivation`. Deactivation is temporary; uninstall
is permanent.

### Autoloading

For anything more than a single-file plugin, use a PSR-4 autoloader via
Composer. The alternative is a manual `spl_autoload_register()` — reasonable
but more maintenance burden.

```json
{
    "autoload": {
        "psr-4": {
            "MyPlugin\\": "includes/"
        }
    }
}
```

Require the Composer autoloader at the top of the main plugin file after the
`ABSPATH` guard:

```php
require_once plugin_dir_path( __FILE__ ) . 'vendor/autoload.php';
```

Vendor files must not be committed to the WordPress.org SVN repository. Use
`composer install --no-dev` in the build step and include `vendor/` in the
zip distributed to WordPress.org.

### Options and settings storage

Use the Options API for plugin settings. Group related settings into a single
serialized option rather than storing one option per setting — reduces
`wp_options` row count and autoload overhead.

```php
$defaults = [
    'color'   => '#ffffff',
    'enabled' => false,
    'limit'   => 10,
];

// First activation:
add_option( 'my_plugin_settings', $defaults );

// Reading (always provide defaults in case the option is absent):
$settings = wp_parse_args( get_option( 'my_plugin_settings', [] ), $defaults );

// Writing:
update_option( 'my_plugin_settings', $validated_settings );
```

`add_option()` will not overwrite an existing value — safe to call on
activation. `update_option()` creates if absent, updates if present.

Mark options as non-autoloaded when they are large or infrequently accessed:

```php
update_option( 'my_large_cache_option', $data, false );
// Third argument: $autoload = false skips loading on every page load.
```

---

## Theme architecture (classic themes)

### Template hierarchy

WordPress determines which template file to load by walking the template
hierarchy. The order, from most specific to least specific, for the most common
cases:

**Single post:** `single-{post_type}-{slug}.php` → `single-{post_type}.php` →
`single.php` → `singular.php` → `index.php`

**Category archive:** `category-{slug}.php` → `category-{id}.php` →
`category.php` → `archive.php` → `index.php`

**Custom post type archive:** `archive-{post_type}.php` → `archive.php` → `index.php`

**Search results:** `search.php` → `index.php`

**404:** `404.php` → `index.php`

The full hierarchy is documented at developer.wordpress.org/themes/. The
`template_include` filter lets a plugin override the resolved template path
programmatically.

### `functions.php` responsibilities

`functions.php` runs on every request (including AJAX, REST, and cron). Keep it
lean. It should register support declarations, load required files, and hook
callbacks — not implement business logic inline.

```php
// Correct: delegate to files, not inline implementation.
require_once get_template_directory() . '/inc/setup.php';
require_once get_template_directory() . '/inc/enqueue.php';
require_once get_template_directory() . '/inc/custom-post-types.php';
```

Theme support declarations belong in `after_setup_theme`, not at file root:

```php
add_action( 'after_setup_theme', function() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', [ 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'script', 'style' ] );
    register_nav_menus( [ 'primary' => __( 'Primary Menu', 'my-theme' ) ] );
} );
```

### Child themes

A child theme overrides parent theme files by providing the same file at the
same relative path. `functions.php` in a child theme is loaded in addition to
the parent's — it is not a replacement.

The child theme's `style.css` must declare the `Template` header:

```css
/*
 * Theme Name: My Child Theme
 * Template:   parent-theme-slug
 */
```

Enqueue the parent stylesheet explicitly from `functions.php`:

```php
add_action( 'wp_enqueue_scripts', function() {
    wp_enqueue_style(
        'parent-style',
        get_template_directory_uri() . '/style.css'
    );
} );
```

Do not `@import` the parent stylesheet from the child `style.css` — it creates
an extra HTTP request and bypasses the dependency system.

### Template tags and the Loop

Template tags (`the_title()`, `the_content()`, `the_permalink()`) are wrapper
functions that echo or return data from the current post in the Loop. They must
be called inside the Loop or after `setup_postdata()`.

```php
if ( have_posts() ) :
    while ( have_posts() ) : the_post();
        the_title( '<h2>', '</h2>' );
        the_excerpt();
    endwhile;
endif;
```

Outside the Loop, use `get_the_title( $post_id )` (returns, does not echo) and
pass the post object or ID explicitly.

### `get_template_part()`

```php
get_template_part( 'template-parts/content', get_post_type() );
// Loads template-parts/content-{post_type}.php, falls back to template-parts/content.php.
```

Pass data to template parts through the third argument (WordPress 5.5+):

```php
get_template_part( 'template-parts/card', null, [ 'show_meta' => true ] );
// In the template part, retrieve with: $args['show_meta']
```

---

## Multisite considerations

On a WordPress Multisite network, plugins can be network-activated (affecting
all sites) or site-activated (affecting one site). The plugin code does not
change — the difference is which `wp_options` table receives the settings and
which site's database tables the plugin operates on.

Key differences to account for:

- `get_option()` reads from the current site. `get_site_option()` reads from
  the network (stored in `wp_sitemeta`). Use the appropriate API based on
  whether a setting is per-site or network-wide.
- Custom tables created on activation with `dbDelta()` are created per-site
  unless you explicitly iterate over sites or use network-activation hooks.
- `switch_to_blog( $blog_id )` / `restore_current_blog()` lets code operate on
  a specific site's data. `$wpdb` updates its table references automatically
  after a switch.
- User capabilities on multisite have an extra layer: a user can be a
  Subscriber on one site and an Administrator on another. `current_user_can()`
  checks against the currently switched blog.

---

## Custom post types and taxonomies

Register on `init`. Registering at file root or during another hook phase breaks
rewrite rule flushing and causes subtle conflicts on multisite.

```php
add_action( 'init', function() {
    register_post_type( 'book', [
        'labels'       => [
            'name'          => __( 'Books', 'my-plugin' ),
            'singular_name' => __( 'Book', 'my-plugin' ),
        ],
        'public'       => true,
        'has_archive'  => true,
        'show_in_rest' => true,  // Required for Gutenberg editing support.
        'supports'     => [ 'title', 'editor', 'thumbnail', 'excerpt' ],
        'rewrite'      => [ 'slug' => 'books' ],
    ] );
} );
```

`'show_in_rest' => true` is required for the post type to be editable in the
block editor. Without it, the classic editor is forced regardless of site
settings.

Flush rewrite rules after registering new post types or taxonomies — but only
on plugin activation, not on every request:

```php
register_activation_hook( __FILE__, function() {
    // Register the post type first, then flush.
    register_book_post_type();
    flush_rewrite_rules();
} );
```

Calling `flush_rewrite_rules()` on `init` on every request is a significant
performance hit — it regenerates the rewrite rule set and writes it to the
database every page load.
