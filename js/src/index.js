
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
 * Use the 'woocommerce-reports-list' filter to add a report page.
 */
addFilter( 'woocommerce_admin_reports_list', 'analytics/scheduled-actions', reports => {
  return [
    ...reports,
	  {
		  report: 'scheduled-actions',
		  title: __( 'Scheduled Actions', 'action-scheduler-admin' ),
		  component: ActionsReport
	  },
  ];
} );
