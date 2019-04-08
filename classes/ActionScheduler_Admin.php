<?php

/**
 * Class ActionScheduler_Admin
 */
class ActionScheduler_Admin {
	/** @var ActionScheduler_Admin */
	private static $instance = NULL;

	/**
	 * Create an instance.
	 */
	public static function factory() {
		if ( null === self::$instance ) {
			self::$instance = new ActionScheduler_Admin();
		}

		return self::$instance;
	}
	/**
	 * Initialize the plugin.
	 */
	public static function init() {
		add_action( 'admin_menu', [ self::factory(), 'register_pages' ], 12 );
		add_action( 'rest_api_init', [ self::factory(), 'register_api_endpoints' ] );
	}

	/**
	 * Register the dashboard page with WooCommerce Admin.
	 */
	public function register_pages() {
		if ( function_exists( 'wc_admin_register_page' ) ) {
			wc_admin_register_page(
				array(
					'title'  => __( 'Scheduled Actions', 'action-scheduler-admin' ),
					'parent' => '/analytics/revenue',
					'path'   => '/analytics/scheduled-actions',
				)
			);
		}
	}

	/**
	 * Register REST API end points.
	 */
	public function register_api_endpoints() {
error_log( __DIR__ );
		if ( class_exists( 'WC_REST_CRUD_Controller' ) ) {
			require_once( __DIR__ . '/ActionScheduler_Admin_Actions_Rest_Controller.php' );
			ActionScheduler_Admin_Actions_Rest_Controller::factory()->register_routes();
		}
	}
}