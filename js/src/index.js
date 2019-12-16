/** @format */
/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ActionsReport from './as-report';

/**
 * Use the 'woocommerce_admin_reports_list' filter to add a report page.
 */
addFilter( 'woocommerce_admin_reports_list', 'scheduled-actions-report-filter', reports => {
  return [
    ...reports,
	  {
		  report: 'scheduled-actions',
		  title: __( 'Scheduled Actions', 'action-scheduler-admin' ),
		  component: ActionsReport
	  },
  ];
} );

/**
 * Use the 'woocommerce_admin_time_excluded_screens' filter to remove date parameters from the query string.
 */
addFilter( 'woocommerce_admin_time_excluded_screens', 'scheduled-actions-date-filter', pages => {
  return [
    ...pages,
	'scheduled-actions'
  ];
} );
