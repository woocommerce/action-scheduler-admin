<?php
/**
Plugin Name: Action Scheduler Admin
Plugin URI: https://github.com/Prospress/action-scheduler-admin
Version: 0.1
Author: Prospress
Author URI: https://prospress.com/
Description: Scheduled Actions screen for the WooCommerce Admin Dashboard.

Text Domain: action-scheduler-admin

License: GNU General Public License v3.0
License URI: https://www.opensource.org/licenses/gpl-license.php

*/

/**
* Hook into the dashboarde initialization
*/
require_once( __DIR__ . '/classes/ActionScheduler_Admin.php' );
add_action( 'plugins_loaded', [ 'ActionScheduler_Admin', 'init' ] );
