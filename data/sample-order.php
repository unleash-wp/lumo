<?php
// SAMPLE — Lumo teaching snippet, NOT your code.
//
// This file demonstrates the HPOS-unsafe pattern: reading order data through
// WordPress post-meta functions. Under WooCommerce High-Performance Order
// Storage (default since WooCommerce 8.2) these calls return stale data or
// write to a table no longer used for orders.

function get_order_email_unsafe( int $order_id ): string {
    // WRONG — queries wp_postmeta; stale or empty when HPOS is active.
    return (string) get_post_meta( $order_id, '_billing_email', true );
}

function update_order_plan_unsafe( int $order_id, string $plan ): void {
    // WRONG — writes to wp_postmeta; invisible to WooCommerce HPOS tables.
    update_post_meta( $order_id, '_subscription_plan', $plan );
}

function get_recent_orders_unsafe(): array {
    // WRONG — querying shop_order via get_posts hits wp_posts, not HPOS order tables.
    return get_posts( array(
        'post_type'      => 'shop_order',
        'posts_per_page' => 10,
        'post_status'    => 'wc-completed',
    ) );
}
