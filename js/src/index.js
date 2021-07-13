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
 * Use the WooCommerce Admin reports list filter to add a report page.
 */
addFilter( 'woocommerce_admin_pages_list', 'scheduled-actions-report-filter', reports => {
  return [
    ...reports,
      {
        breadcrumbs: [
          '',
          wcSettings.woocommerceTranslation,
          __( 'Scheduled Actions', 'action-scheduler-admin' ),
        ],
        capability: 'manage_options',
        container: ActionsReport,
        navArgs: {
          id: 'woocommerce-scheduled-actions',
        },
        path: '/scheduled-actions',
        report: 'scheduled-actions',
        title: __( 'Scheduled Actions', 'action-scheduler-admin' ),
        wpOpenMenu: 'toplevel_page_woocommerce',
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
