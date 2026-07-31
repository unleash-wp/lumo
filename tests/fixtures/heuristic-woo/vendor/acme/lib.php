<?php
// Third-party library that references WC_Order, must be excluded from scan.
use WC_Order;

class AcmeAdapter {
  public function wrap( WC_Order $order ) {
    return $order;
  }
}
