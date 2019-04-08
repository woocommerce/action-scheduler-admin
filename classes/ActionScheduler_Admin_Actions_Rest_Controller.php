<?php

defined( 'ABSPATH' ) || exit;

if ( ! class_exists( 'WC_REST_CRUD_Controller' ) ) {
	return;
}

/**
 * REST API Actions controller class.
 *
 * Class ActionScheduler_Actions_Rest_Controller
 */
class ActionScheduler_Admin_Actions_Rest_Controller extends WC_REST_CRUD_Controller {
	/**
	 * Endpoint namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'wc/v4';

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'reports/scheduled-actions';

	/**
	 * Rest controller instance.
	 *
	 * @var ActionScheduler_Actions_Rest_Controller
	  */
	private static $instance = NULL;

	/**
	 * Create an instance.
	 */
	public static function factory() {
		if ( null === self::$instance ) {
			self::$instance = new ActionScheduler_Admin_Actions_Rest_Controller();
		}

		return self::$instance;
	}

	/**
	 * Register routes.
	 *
	 */
	public function register_routes() {
		register_rest_route( $this->namespace, '/' . $this->rest_base, array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_actions' ),
			),
		) );
	}

	/**
	 * Return a list of actions matching the query args
	 *
	 * @return array Of WP_Error or WP_REST_Response.
	 */
	public function get_actions( $request ) {
		return rest_ensure_response( [] );
	}

}