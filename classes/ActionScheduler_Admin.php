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
		add_action( 'init', [ self::factory(), 'register_scripts' ] );
		add_action( 'admin_enqueue_scripts', [ self::factory(), 'enqueue_scripts' ] );
		add_filter( 'woocommerce_admin_report_menu_items', [ self::factory(), 'add_pages' ], 20 );
		add_action( 'rest_api_init', [ self::factory(), 'register_api_endpoints' ] );
	}

	/**
	 * Add the dashboard page with WooCommerce Admin.
	 *
	 * @param array $report_pages List of registered report pages
	 *
	 * @return array
	 */
	public function add_pages( $report_pages ) {
		$report_pages[] = array(
			'id'     => 'woocommerce-analytics-scheduled-actions',
			'title'  => __( 'Scheduled Actions', 'action-scheduler-admin' ),
			'parent' => 'woocommerce-analytics',
			'path'   => '/analytics/scheduled-actions',
		);

		return $report_pages;
	}

	/**
	 * Register REST API end points.
	 */
	public function register_api_endpoints() {
		if ( class_exists( 'WC_REST_CRUD_Controller' ) ) {
			require_once( __DIR__ . '/ActionScheduler_Admin_Actions_Rest_Controller.php' );
			ActionScheduler_Admin_Actions_Rest_Controller::factory()->register_routes();
		}
	}
	/**
	 * Register the JS.
	 */
	function register_scripts() {
		wp_register_script(
			'scheduled-actions-admin',
			plugins_url( '/dist/index.js', __DIR__ ),
			[ 'wp-hooks', 'wp-element', 'wp-i18n', 'wc-components', 'wc-navigation' ],
			filemtime( dirname( __DIR__ ) . '/dist/index.js' ),
			true
		);

		wp_add_inline_script(
			'scheduled-actions-admin',
			sprintf(
				'var asaSettings = { "api_root": "%s", "nonce": "%s" };',
				esc_url_raw( get_rest_url() ),
				( wp_installing() && ! is_multisite() ) ? '' : wp_create_nonce( 'wp_rest' )
			),
			'after'
		);
	}
	/**
	 * Enqueue the scripts.
	 */
	function enqueue_scripts() {
		if ( is_callable( [ 'WC_Admin_Loader',  'is_admin_page' ] ) && WC_Admin_Loader::is_admin_page() ) {
			wp_enqueue_script( 'scheduled-actions-admin' );
			wp_enqueue_script( WC_ADMIN_APP );
		}
	}
}
