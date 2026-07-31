/**
 * The sample blobs `lumo demo` runs the catch over.
 *
 * Every one of them is the kind of code an assistant produces when asked for
 * an ordinary WordPress task. That is the point. They are held here as data,
 * and the demo runs them through the SAME engine a real scan uses, so the
 * demo can never claim a catch the product cannot make. If a rule stops
 * firing, the demo stops showing it, loudly, in a test.
 *
 * All four are covered by the free snapshot. Nothing here reaches for
 * WooCommerce or a premium plugin: a first run must show what Lumo Free
 * actually does, not what it would do behind a licence.
 */

export interface DemoSample {
  /** What someone asked an assistant for, sets the scene in one line. */
  prompt: string;
  /** The code that came back. */
  code: string;
}

export const DEMO_SAMPLES: DemoSample[] = [
  {
    prompt: 'Write a helper that loads a user row by id.',
    code: [
      '<?php',
      'function get_user_row( $user_id ) {',
      '    global $wpdb;',
      '    return $wpdb->get_results( "SELECT * FROM {$wpdb->users} WHERE ID = $user_id" );',
      '}',
    ].join('\n'),
  },
  {
    prompt: 'Only let admins see this settings page.',
    code: [
      '<?php',
      'function render_settings_page() {',
      "    if ( ! current_user_can( 'administrator' ) ) {",
      "        wp_die( 'Nope' );",
      '    }',
      '    echo do_settings_form();',
      '}',
    ].join('\n'),
  },
  {
    prompt: 'Add an AJAX endpoint that saves a setting.',
    code: [
      '<?php',
      "add_action( 'wp_ajax_save_setting', function () {",
      "    update_option( 'my_setting', $_POST['value'] );",
      "    wp_send_json_success();",
      '} );',
    ].join('\n'),
  },
  {
    prompt: 'After login, send the user back where they came from.',
    code: [
      '<?php',
      'function redirect_after_login() {',
      "    wp_redirect( $_GET['redirect_to'] );",
      '    exit;',
      '}',
    ].join('\n'),
  },
];
