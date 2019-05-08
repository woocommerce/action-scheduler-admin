/** @format */
/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Component, Fragment } from '@wordpress/element';
import { map } from 'lodash';

/**
 * WooCommerce dependencies
 */
import { Card, EmptyContent, ReportFilters, TableCard, TablePlaceholder } from '@woocommerce/components';
import { getQuery, onQueryChange, stringifyQuery } from '@woocommerce/navigation';

/**
 * Internal dependencies
 */
import { statusFilters } from './config';
const showDatePicker = false;

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

		apiFetch( { path: actionsEndpoint + stringifyQuery( fullQuery ) } ).then( actions => {
			this.setState( {
				actions: actions,
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
				isSortable: true,
			},
			{
				label: __( 'Status', 'action-scheduler-admin' ),
				key: 'status',
				required: false,
				isSortable: false,
			},
			{
				label: __( 'Group', 'action-scheduler-admin' ),
				key: 'group',
				required: false,
				isSortable: true,
			},
			{
				label: __( 'Arguments', 'action-scheduler-admin' ),
				key: 'parameters',
				required: false,
				isSortable: false,
			},
			{
				label: __( 'Scheduled', 'action-scheduler-admin' ),
				key: 'scheduled',
				required: true,
				defaultSort: true,
				defaultOrder: 'asc',
				isSortable: true,
			},
			{
				label: __( 'Recurrence', 'action-scheduler-admin' ),
				key: 'recurrence',
				required: false,
				isSortable: true,
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
						{ scheduled }<br />
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

	onQueryChange( changeType ) {
		// noop
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
			</Card>
		);
	}

	renderTable() {
		const { path, query } = this.props;

		const rows = this.getRowsContent() || [];

		const headers = this.getHeadersContent();

		return (
			<TableCard
				title={ __( 'Scheduled Actions', 'action-scheduler-admin' ) }
				rows={ rows }
				totalRows={ rows.length }
				rowsPerPage={ 100 }
				headers={ headers }
				onQueryChange={ onQueryChange }
				onSort={ onQueryChange }
				query={ query }
				summary={ null }
			/>
		);
	}

	render() {
		const { loading, actions } = this.state;
		const { path, query } = this.props;

		// if we aren't loading, and there are no labels
		// show an EmptyContent message
		if ( ! loading && ! actions.length ) {
			return (
				<Fragment>
					<ReportFilters
						filters={ statusFilters }
						path={ path }
						query={ query }
						showDatePicker={ showDatePicker }
					/>
					<EmptyContent
						title={ __( 'No results were found.', 'action-scheduler-admin' ) }
						message={ __( 'Choose a different Action Status.', 'action-scheduler-admin' ) }
						actionLabel=""
						actionURL="#"
					/>
				</Fragment>
			);
		}

		return (
			<Fragment>
				<ReportFilters
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
