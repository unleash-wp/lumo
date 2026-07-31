<?php
// Signal only inside vendor/, must be excluded from heuristic scan.
use WC_Order;

class VendorAdapter {
  public function wrap( WC_Order $order ) {
    return $order;
  }
}
