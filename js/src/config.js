/** @format */
/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Define the properties for the action status drop down filter.
 *
 * @type {{param: string, defaultValue: string, label: string, filters: [{label: string, value: string}, ..., null], staticParams: string[], showFilters: (function(): boolean)}}
 */
const statusConfig = {
	label: __( 'Scheduled Action Status', 'action-scheduler-admin' ),
	staticParams: [ 'order', 'orderby' ],
	param: 'status',
	defaultValue: 'pending',
	showFilters: () => true,
	filters: [
		{ label: __( 'All', 'action-scheduler-admin' ), value: 'all' },
		{ label: __( 'Pending', 'action-scheduler-admin' ), value: 'pending' },
		{ label: __( 'Completed', 'action-scheduler-admin' ), value: 'complete' },
		{ label: __( 'In Progress', 'action-scheduler-admin' ), value: 'in-progress' },
		{ label: __( 'Failed', 'action-scheduler-admin' ), value: 'failed' },
		{ label: __( 'Canceled', 'action-scheduler-admin' ), value: 'canceled' },
	],
};

export const statusFilters = [ statusConfig ];
