<?php

defined( 'ABSPATH' ) || exit;

if ( ! class_exists( 'WP_REST_Controller' ) ) {
	return;
}

/**
 * REST API Actions controller class.
 *
 * Class ActionScheduler_Actions_Rest_Controller
 */
class ActionScheduler_Admin_Actions_Rest_Controller extends WP_REST_Controller {
	/**
	 * Endpoint namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'asa/v1';

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'actions';

	/**
	 * Rest controller instance.
	 *
	 * @var ActionScheduler_Actions_Rest_Controller
	  */
	private static $instance = NULL;

	/**
	 * Array of seconds for common time periods, like week or month, alongside an internationalised string representation, i.e. "Day" or "Days"
	 *
	 * @var array
	 */
	private static $time_periods;

	/**
	 * Create an instance.
	 */
	public static function factory() {
		if ( null === self::$instance ) {
			self::$instance = new ActionScheduler_Admin_Actions_Rest_Controller();
		}

		return self::$instance;
	}

	function __construct() {
		self::$time_periods = [
			[
				'seconds' => YEAR_IN_SECONDS,
				'names'   => _n_noop( '%s year', '%s years', 'action-scheduler-admin' ),
			],
			[
				'seconds' => MONTH_IN_SECONDS,
				'names'   => _n_noop( '%s month', '%s months', 'action-scheduler-admin' ),
			],
			[
				'seconds' => WEEK_IN_SECONDS,
				'names'   => _n_noop( '%s week', '%s weeks', 'action-scheduler-admin' ),
			],
			[
				'seconds' => DAY_IN_SECONDS,
				'names'   => _n_noop( '%s day', '%s days', 'action-scheduler-admin' ),
			],
			[
				'seconds' => HOUR_IN_SECONDS,
				'names'   => _n_noop( '%s hour', '%s hours', 'action-scheduler-admin' ),
			],
			[
				'seconds' => MINUTE_IN_SECONDS,
				'names'   => _n_noop( '%s minute', '%s minutes', 'action-scheduler-admin' ),
			],
			[
				'seconds' => 1,
				'names'   => _n_noop( '%s second', '%s seconds', 'action-scheduler-admin' ),
			],
		];
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ self::$instance, 'get_actions' ],
					'args'                => $this->get_collection_params(),
					'permission_callback' => [ $this, 'get_permissions_check' ]
				],
			]
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/run',
			[
				'args' => [
					'id' => [
						'description' => __( 'Unique identifier for the resource.', 'action-scheduler-admin' ),
						'type'        => 'integer',
					],
				],
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ self::$instance, 'run_action' ],
					'permission_callback' => [ self::$instance, 'get_permissions_check' ]
				],
				'schema' => [ $this, 'get_public_item_schema' ],
			]
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/cancel',
			[
				'args' => [
					'id' => [
						'description' => __( 'Unique identifier for the resource.', 'action-scheduler-admin' ),
						'type'        => 'integer',
					],
				],
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ self::$instance, 'cancel_action' ],
					'args'                => $this->get_collection_params(),
					'permission_callback' => [ self::$instance, 'get_permissions_check' ]
				],
				'schema' => [ $this, 'get_public_item_schema' ],
			]
		);
	}

	/**
	 * Check whether a given request has permission to access.
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_Error|boolean
	 */
	public function get_permissions_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error( 'action_scheduler_rest_cannot_view', __( 'Sorry, you cannot list resources.', 'action-scheduler-admin' ), array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}

	/**
	 * Maps query arguments from the REST request.
	 *
	 * @param  WP_REST_Request $request Request array.
	 * @return array
	 */
	protected function prepare_actions_query( $request ) {
		$offset = 0 < $request[ 'paged' ] ? $request[ 'paged' ] - 1 : 0;
		if ( $request[ 'per_page' ] ) {
			$offset *= $request[ 'per_page' ];
		}

		$args = [
			'offset'   => $offset,
			'per_page' => $request[ 'per_page' ],
			'group'    => $request[ 'group' ],
			'status'   => $request[ 'status' ],
			'orderby'  => strtolower( $request[ 'orderby' ] ),
			'order'    => strtolower( $request[ 'order' ] ),
			'search'   => $request['s'],
		];

		return $args;
	}

	/**
	 * Return a list of actions matching the query args. Scheduled date is date used for sorting.
	 *
	 * @return array Of WP_Error or WP_REST_Response.
	 */
	public function get_actions( $request ) {
		$store         = ActionScheduler::store();
		$status_labels = $store->get_status_labels();
		$args          = $this->prepare_actions_query( $request );
		$action_ids    = $store->query_actions( $args );
		$totals        = $store->action_counts();
		$data          = [];

		if ( isset( $totals['in-progress'] ) ) {
			$totals['inProgress'] = $totals['in-progress'];
			unset( $totals['in-progress'] );
		}

		$response      = [
			'pagination' => [
				'totalRows' => (int) $store->query_actions( $args, 'count' ),
				'perPage'   => (int) $args['per_page'],
				'offset'    => (int) $args['offset'],
			],
			'totals'     => $totals
		];

		try {
			$timezone = new DateTimeZone( get_option( 'timezone_string' ) );
		} catch ( Exception $e ) {
			$timezone = false;
		}

		foreach ( $action_ids as $action_id ) {
			$action = $store->fetch_action( $action_id );
			// Display schedule date in more human friendly WP configured time zone.
			$next   = $action->get_schedule()->next();
			if ( $next && $timezone ) {
				$next->setTimezone( $timezone );
				$schedule = new ActionScheduler_SimpleSchedule( $next );
			} else {
				$schedule = new ActionScheduler_NullSchedule();
			}

			$schedule_display = $this->get_schedule_display( $schedule );
			$parameters       = [];

			foreach ( $action->get_args() as $key => $value ) {
				if ( is_array( $value ) || is_object( $value ) ) {
					$value = wp_json_encode( $value );
				}

				$parameters[] = sprintf( '%s => %s', $key, $value );
			}

			try {
				$status = $store->get_status( $action_id );
			} catch ( Exception $e ) {
				$status = '';
			}

			$action_data = [
				'id'             => $action_id,
				'hook'           => $action->get_hook(),
				'group'          => $action->get_group(),
				'status'         => $this->get_status_display( $status ),
				'timestamp'      => $schedule_display['timestamp'],
				'scheduled'      => $schedule_display['date'],
				'schedule_delta' => $schedule_display['delta'],
				'parameters'     => $parameters,
				'recurrence'     => $this->get_recurrence( $action ),
			];

			$unique       = $next ? $next->getTimestamp() : sprintf( '%08d', count( $data ) );
			$key          = ( ! empty( $args[ 'orderby' ] ) ? $action_data[ $args[ 'orderby' ] ] . '_' : '' ) . $unique;
			if ( ! isset( $data[ $key ] ) ) {
				$data[ $key ] = $action_data;
			} else {
				$data[ $key . '-' . $action_id ] = $action_data;
			}
		}

		if ( 'DESC' === strtoupper( $request['order'] ) ) {
			krsort( $data );
		} else {
			ksort( $data );
		}

		// Reset the array keys to prevent downstream key sorting.
		$response['actions'] = array_values( $data );
		return rest_ensure_response( $response );
	}

	/**
	 * Run an action.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function run_action( $request ) {
		$store  = ActionScheduler::store();
		$runner = ActionScheduler::runner();

		if ( empty( $request['id'] ) ) {
			$response = [
				'message' => 'Not found',
				'status' => ''
			];
			return rest_ensure_response( $response );
		}

		try {
			$runner->process_action( $request['id'], 'REST API' );
			$response = [ 'message' => 'Success' ];
		} catch ( Exception $e ) {
			$response = [ 'message' => $e->getMessage() ];
		}
		$status = $store->get_status( $request['id'] );
		$response['status'] = $this->get_status_display( $status );

		return rest_ensure_response( $response );
	}

	/**
	 * Cancel an action.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function cancel_action( $request ) {
		$store = ActionScheduler::store();

		if ( empty( $request['id'] ) ) {
			$response = [
				'message' => 'Not found',
				'status' => ''
			];
			return rest_ensure_response( $response );
		}

		try {
			if ( ActionScheduler::store()->get_status( $request['id'] ) !== ActionScheduler_Store::STATUS_PENDING ) {
				$response = [ 'message' => 'Action was not canceled' ];
			} else {
				ActionScheduler::store()->cancel_action( $request['id'] );
				$response = [ 'message' => 'Success' ];
			}
		} catch ( Exception $e ) {
			$response = [ 'message' => $e->getMessage() ];
		}
		$status = $store->get_status( $request['id'] );
		$response['status'] = $this->get_status_display( $status );
		return rest_ensure_response( $response );
	}
	/**
	 * Convert an interval of seconds into a two part human friendly string.
	 *
	 * The WordPress human_time_diff() function only calculates the time difference to one degree, meaning
	 * even if an action is 1 day and 11 hours away, it will display "1 day". This function goes one step
	 * further to display two degrees of accuracy.
	 *
	 * Inspired by the Crontrol::interval() function by Edward Dale: https://wordpress.org/plugins/wp-crontrol/
	 *
	 * @param int $interval A interval in seconds.
	 * @param int $periods_to_include Depth of time periods to include, e.g. for an interval of 70, and $periods_to_include of 2, both minutes and seconds would be included. With a value of 1, only minutes would be included.
	 * @return string A human friendly string representation of the interval.
	 */
	private static function human_interval( $interval, $periods_to_include = 2 ) {

		if ( $interval <= 0 ) {
			return __( 'Now!', 'action-scheduler-admin' );
		}

		$output = '';

		for ( $time_period_index = 0, $periods_included = 0, $seconds_remaining = $interval; $time_period_index < count( self::$time_periods ) && $seconds_remaining > 0 && $periods_included < $periods_to_include; $time_period_index++ ) {

			$periods_in_interval = floor( $seconds_remaining / self::$time_periods[ $time_period_index ]['seconds'] );

			if ( $periods_in_interval > 0 ) {
				if ( ! empty( $output ) ) {
					$output .= ' ';
				}
				$output .= sprintf( _n( self::$time_periods[ $time_period_index ]['names'][0], self::$time_periods[ $time_period_index ]['names'][1], $periods_in_interval, 'action-scheduler-admin' ), $periods_in_interval );
				$seconds_remaining -= $periods_in_interval * self::$time_periods[ $time_period_index ]['seconds'];
				$periods_included++;
			}
		}

		return $output;
	}

	/**
	 * Lookup a status title using a status code.
	 *
	 * @param $status Status code.
	 * @return string
	 */
	protected function get_status_display( $status ) {
		$store         = ActionScheduler::store();
		$status_labels = $store->get_status_labels();

		return isset( $status_labels[ $status ] ) ? $status_labels[ $status ] : $status;
	}

	/**
	 * Returns the recurrence of an action or 'Non-repeating'. The output is human readable.
	 *
	 * @param ActionScheduler_Action $action
	 *
	 * @return string
	 */
	protected function get_recurrence( $action ) {
		$recurrence = $action->get_schedule();
		if ( $recurrence->is_recurring() ) {
			if ( method_exists( $recurrence, 'interval_in_seconds' ) ) {
				return sprintf( __( 'Every %s', 'action-scheduler-admin' ), self::human_interval( $recurrence->interval_in_seconds() ) );
			}

			if ( method_exists( $recurrence, 'get_recurrence' ) ) {
				return sprintf( __( 'Cron %s', 'action-scheduler-admin' ), $recurrence->get_recurrence() );
			}
		}

		return __( 'Non-repeating', 'action-scheduler-admin' );
	}

	/**
	 * Get the scheduled date in a human friendly format.
	 *
	 * @param ActionScheduler_Schedule $schedule
	 * @return array
	 */
	protected function get_schedule_display( ActionScheduler_Schedule $schedule ) {

		$schedule_display = [
			'timestamp' => '',
			'date'      => '',
			'delta'     => '',
		];

		if ( ! $schedule->next() ) {
			if ( is_a( $schedule, 'ActionScheduler_NullSchedule' ) ) {
				$schedule_display['date'] = 'async';
			}
			return $schedule_display;
		}

		$schedule_display['timestamp'] = $schedule->next()->getTimestamp();
		$schedule_display['date']      = $schedule->next()->format( 'Y-m-d H:i:sP' );

		if ( gmdate( 'U' ) > $schedule_display['timestamp'] ) {
			$schedule_display['delta'] = sprintf( __( '(%s ago)', 'action-scheduler-admin' ), self::human_interval( gmdate( 'U' ) - $schedule_display['timestamp'] ) );
		} else {
			$schedule_display['delta'] = sprintf( __( '(%s)', 'action-scheduler-admin' ), self::human_interval( $schedule_display['timestamp'] - gmdate( 'U' ) ) );
		}

		return $schedule_display;
	}

	/**
	 * Get the query params for collections.
	 *
	 * @return array
	 */
	public function get_collection_params() {
		$stati = array_keys( ActionScheduler::store()->get_status_labels() );
		$stati[] = '';

		$params = [
			'id' => [
				'type'              => 'integer',
				'default'           => 0,
				'sanitize_callback' => 'absint',
				'validate_callback' => 'rest_validate_request_arg',
				'minimum'           => 0,
			],
			'paged' => [
				'type'              => 'integer',
				'default'           => 0,
				'sanitize_callback' => 'absint',
				'validate_callback' => 'rest_validate_request_arg',
				'minimum'           => 0,
			],
			'per_page' => [
				'type'              => 'integer',
				'default'           => 100,
				'sanitize_callback' => 'absint',
				'validate_callback' => 'rest_validate_request_arg',
				'minimum'           => 0,
			],
			'group' => [
				'type'              => 'string',
				'default'           => '',
				'validate_callback' => 'rest_validate_request_arg',
			],
			'status' => [
				'type'              => 'string',
				'default'           => '',
				'enum'              => $stati,
				'validate_callback' => 'rest_validate_request_arg',
			],
			'orderby' => [
				'type'              => 'string',
				'default'           => 'scheduled',
				'enum'              => [
					'hook',
					'group',
					'scheduled',
					'recurrence',
				],
				'validate_callback' => 'rest_validate_request_arg',
			],
			'order' => [
				'type'              => 'string',
				'default'           => 'asc',
				'enum'              => [
					'asc',
					'desc'
				],
				'validate_callback' => 'rest_validate_request_arg',
			],
		];

		return $params;
	}

	/**
	 * Get the Action's schema, conforming to JSON Schema.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = [
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title' => 'scheduled_action',
			'type' => 'object',
			'properties' => [
				'id' => [
					'description' => __( 'Unique identifier for the resource.', 'action-scheduler-admin' ),
					'type' => 'integer',
					'context' => [ 'edit' ],
					'readonly' => true,
				],
			],
		];

		return $schema;
	}
}
