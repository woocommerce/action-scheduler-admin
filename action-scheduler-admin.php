<?php
/**
Plugin Name: Action Scheduler Admin
Plugin URI: https://github.com/woocommerce/action-scheduler-admin
Version: 0.1.1
Author: Automattic
Author URI: https://woocommerce.com/
Description: Scheduled Actions screen for the WooCommerce Admin Dashboard.

Text Domain: action-scheduler-admin
Domain Path: /languages
Requires at least: 5.8
Requires PHP: 7.0

WC requires at least: 5.6.0
WC tested up to: 5.8.0

License: GNU General Public License v3.0
License URI: https://www.opensource.org/licenses/gpl-license.php

*/

/**
* Hook into the dashboard initialization
*/
require_once( __DIR__ . '/classes/ActionScheduler_Admin.php' );
add_action( 'plugins_loaded', [ 'ActionScheduler_Admin', 'init' ] );
