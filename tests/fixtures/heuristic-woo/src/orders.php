<?php
// Custom order handling using HPOS-compatible API.
function get_my_order( int $order_id ) {
  return wc_get_order( $order_id );
}
