/** @format */
/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Card, CardFooter } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { map } from 'lodash';

/**
 * WooCommerce dependencies
 */
import { Date, ReportFilters, TableCard, TablePlaceholder, TableSummary } from '@woocommerce/components';
import { getQuery, onQueryChange } from '@woocommerce/navigation';
import Currency from '@woocommerce/currency';

/**
 * Internal dependencies
 */
import { statusFilters } from './config';

/**
 * Set defaults
 */
const showDatePicker = false;
const DEFAULT_PER_PAGE = 100;

//@todo: import './style.scss'; if necessary

class ActionsReport extends Component {

	constructor( props ) {
		super( props );
		this.state = {
			actions: null,
			loading: true,
		};
		this.getHeadersContent = this.getHeadersContent.bind( this );
		this.getRowsContent = this.getRowsContent.bind( this );
		this.getSummary = this.getSummary.bind( this );
	}

	componentDidMount() {
		apiFetch.use( apiFetch.createNonceMiddleware( asaSettings.nonce ) );
		apiFetch.use( apiFetch.createRootURLMiddleware( asaSettings.api_root ) );

		this.fetchActionData( getQuery() );
	}

	componentDidUpdate( prevProps ) {
		const prevQuery = prevProps.query;
		const query = this.props.query;

		if (  query != prevQuery ) {
			if ( query.status !== prevQuery.status ) {
				query.orderby = 'scheduled';
				query.order = 'asc';
				query.per_page = prevQuery.per_page ? prevQuery.per_page : DEFAULT_PER_PAGE;
			}
			this.fetchActionData( query );
		}
	}

	fetchActionData( query ) {
		const actionsEndpoint = `asa/v1/actions`;

		var fullQuery = Object.assign( {
				orderby: 'scheduled',
				order: 'asc',
				status: 'pending',
			},
			query
		);

		if ( fullQuery.status == 'all' ) {
			fullQuery.status = '';
		}

		apiFetch( { path: addQueryArgs( actionsEndpoint, fullQuery ) } ).then( response => {
			this.setState( {
				actions: response.actions,
				pagination: response.pagination,
				totals: response.totals,
				loading: false,
			} );
		} );
	}

	getHeadersContent() {
		return [
			{
				label: __( 'Hook', 'action-scheduler-admin' ),
				key: 'hook',
				required: true,
				isLeftAligned: true,
				isSortable: true,
			},
			{
				label: __( 'Status', 'action-scheduler-admin' ),
				key: 'status',
				required: false,
				isLeftAligned: true,
				isSortable: false,
			},
			{
				label: __( 'Group', 'action-scheduler-admin' ),
				key: 'group',
				required: false,
				isLeftAligned: true,
				isSortable: true,
			},
			{
				label: __( 'Arguments', 'action-scheduler-admin' ),
				key: 'parameters',
				required: false,
				isLeftAligned: true,
				isSortable: false,
			},
			{
				label: __( 'Scheduled', 'action-scheduler-admin' ),
				key: 'scheduled',
				required: true,
				defaultSort: true,
				defaultOrder: 'asc',
				isLeftAligned: true,
				isSortable: true,
			},
			{
				label: __( 'Recurrence', 'action-scheduler-admin' ),
				key: 'recurrence',
				required: false,
				isLeftAligned: true,
				isSortable: true,
			},
		];
	}

	getSummary() {
		const { totals = {} } = this.state;
		const {
			complete = 0,
			pending = 0,
			inProgess = 0,
			canceled = 0,
			failed = 0,
		} = totals;
		return [
			{
				label: __('complete', 'action-scheduler-admin' ),
				value: complete,
			},
			{
				label: __('pending', 'action-scheduler-admin' ),
				value: pending,
			},
			{
				label: __('in-progress', 'action-scheduler-admin' ),
				value: inProgess,
			},
			{
				label: __('canceled', 'action-scheduler-admin' ),
				value: canceled,
			},
			{
				label: __('failed', 'action-scheduler-admin' ),
				value: failed,
			},
		];
	}

	getRowsContent() {
		const { actions } = this.state;

		return map( actions, row => {
			const {
				hook,
				group,
				status,
				parameters,
				timestamp,
				scheduled,
				schedule_delta,
				recurrence,
			} = row;
			const scheduledIsDate = scheduled && Number.isInteger( scheduled.substr( 0, 4 ) );
			return [
				{
					display: this.renderHook( hook ),
					value: hook,
				},
				{
					display: status,
					value: status,
				},
				{
					display: group,
					value: group,
				},
				{
					display: this.renderParameterList( parameters ),
					value: parameters.length,
				},
				{
					display: (
						<Fragment>
						{ scheduledIsDate ? <Date date={ scheduled } screenReaderFormat="F j, Y H:i:s" visibleFormat="Y-m-d H:i:s P" /> : scheduled }<br />
						{ schedule_delta }
						</Fragment>
					),
					value: timestamp,
				},
				{
					display: recurrence,
					value: recurrence,
				},
			];
		} );
	}

	renderParameter( parameter, i ) {
		return (
			<li key={i}>{ parameter }</li>
		);
	}

	renderParameterList( parameters ) {
		if ( ! parameters.length ) {
			return null;
		}

		var list = map( parameters, this.renderParameter );
		return (
			<Fragment>
			<ul>
				{list}
			</ul>
			</Fragment>
		);

	}

	renderHook( hook ) {
		if ( hook.length <= 30 ) {
			return hook;
		}

		var count = 0;
		var pieces = hook.split( '_' );
		for ( var i = 0; i < pieces.length; i++ ) {
			count += pieces[i].length + 1;

			if ( count >= 30 ) {
				pieces[i] = ' ' + pieces[i];
				count = 0;
			}
		}

		return pieces.join( '_' );
	}

	renderPlaceholder() {
		const headers = this.getHeadersContent();
		return (
			<Card
				title={ __( 'Scheduled Actions', 'action-scheduler-admin' ) }
				className="action-scheduler-admin-placeholder"
			>
				<TablePlaceholder caption={ __( 'Scheduled Actions', 'action-scheduler-admin' ) } headers={ headers } />
				<CardFooter justify="center">
					<TableSummary data={ this.getSummary() } />
				</CardFooter>
			</Card>
		);
	}

	renderTable() {
		const { query } = this.props;
		const { perPage, totalRows } = this.state.pagination;

		const rows = this.getRowsContent() || [];

		const headers = this.getHeadersContent();

		return (
			<TableCard
				title={ __( 'Scheduled Actions', 'action-scheduler-admin' ) }
				rows={ rows }
				totalRows={ totalRows }
				rowsPerPage={ perPage }
				headers={ headers }
				onQueryChange={ onQueryChange }
				query={ query }
				summary={ this.getSummary() }
			/>
		);
	}

	render() {
		const { loading } = this.state;
		const { path, query } = this.props;
		const currency = new Currency();

		return (
			<Fragment>
				<ReportFilters
					currency={ currency }
					filters={ statusFilters }
					path={ path }
					query={ query }
					showDatePicker={ showDatePicker }
				/>
				{ ! loading ? this.renderTable() : this.renderPlaceholder() }
			</Fragment>
		);
	}
};

export default ActionsReport;
