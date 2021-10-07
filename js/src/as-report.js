/** @format */
/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button, Card, CardFooter, CheckboxControl } from '@wordpress/components';
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
const actionsEndpoint = `asa/v1/actions`;
const showDatePicker = false;
const DEFAULT_PER_PAGE = 100;

/**
 * Action Scheduler admin screen component
 */
class ActionsReport extends Component {
	/**
	 * Component constructor.
	 *
	 * @param props {object} Component properties.
	 */
	constructor( props ) {
		super( props );
		this.state = {
			actions: null,
			loading: true,
			isBusy: false,
		};
		/**
		 * Bind the handlers to this instance of the component.
		 */
		this.getHeadersContent = this.getHeadersContent.bind( this );
		this.getRowsContent = this.getRowsContent.bind( this );
		this.getSummary = this.getSummary.bind( this );
		this.getCheckbox = this.getCheckbox.bind( this );
		this.onCancel = this.onCancel.bind( this );
		this.onRun = this.onRun.bind( this );
		this.processAction = this.processAction.bind( this );
		this.processSelectedActions = this.processSelectedActions.bind( this );
		this.selectedIndex = this.selectedIndex.bind( this );
		this.selectedAll = this.selectedAll.bind( this );
		this.selectRow = this.selectRow.bind( this );
		this.selectAllRows = this.selectAllRows.bind( this );
		this.setBusy = this.setBusy.bind( this );
		this.unsetBusy = this.unsetBusy.bind( this );
		this.updateActionStatus = this.updateActionStatus.bind( this );
	}

	/**
	 * React runs `componentDidMount` if it exists when a component has been loaded in the client browser.
	 */
	componentDidMount() {
		apiFetch.use( apiFetch.createNonceMiddleware( asaSettings.nonce ) );
		apiFetch.use( apiFetch.createRootURLMiddleware( asaSettings.api_root ) );

		this.fetchActionData( getQuery() );
	}

	/**
	 * React runs `componentDidUpdate` when the app has changes in properties.
	 *
	 * @param prevProps {object} Properties prior to the change.
	 */
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

	/**
	 * Retrieve action data from the REST API endpoint.
	 *
	 * @param query {object} Query object parameters as named key => value pairs.
	 */
	fetchActionData( query ) {
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

		if ( ! this.setBusy() ) {
			return;
		}

		apiFetch( { path: addQueryArgs( actionsEndpoint, fullQuery ) } ).then( response => {
			var enabledRows = map( response.actions, action => {
				if ( action.status == 'Pending' ) {
					return action.id;
				} else {
					return null;
				}
			} ).filter( id => id != null );
			this.setState( {
				enabledRows,
				selectedRows: [],
				actions: response.actions,
				pagination: response.pagination,
				totals: response.totals,
				loading: false,
			} );
		} );
		this.unsetBusy();
	}

	/**
	 * Set the busy state flag indicating there is an api call in progress.
	 *
	 * @returns {boolean} Flag indicating whether it is safe to call the api.
	 */
	setBusy() {
		const { isBusy } = this.state;
		if ( isBusy ) {
			return false;
		}
		this.setState( {
			isBusy: true,
		} );
		return true;
	}

	/**
	 * Clear the busy state flag indicating there isn't an api call in progress.
	 */
	unsetBusy() {
		this.setState( {
			isBusy: false,
		} );
	}

	/**
	 * Call the API to process or cancel an action.
	 *
	 * @param actionId {number} Id of the action.
	 * @param action   {string} Action to perform (process|cancel).
	 */
	processAction( actionId, action ) {
		apiFetch( {
			path: `${actionsEndpoint}/${actionId}/${action}`,
			method: 'POST',
			data: { id: actionId },
		} ).then( response => {
			if ( response.status.length > 0 ) {
				this.selectRow( actionId );
				this.updateActionStatus( actionId, response.status );
			}
		} );
	}

	/**
	 * Determine list of selected actions to process. Process those actions.
	 *
	 * @param action {string} Action to perform (process|cancel).
	 */
	processSelectedActions( action ) {
		const { enabledRows, selectedRows } = this.state;
		const actionIds = [ ...selectedRows ];
		let remainingRows = [ ...enabledRows ];
		let actionId;

		if ( this.setBusy() ) {
			while ( actionIds.length > 0 ) {
				actionId = actionIds.shift();
				this.processAction( actionId, action );
				remainingRows = remainingRows.filter( id => id != actionId );
			}
			this.setState( {
				enabledRows: remainingRows,
			} );
		}
		this.unsetBusy();
	}

	/**
	 * Update an actions status in the report table.
	 *
	 * @param actionId {number} The ID of the action.
	 * @param status   {string} The new status of the action.
	 */
	updateActionStatus( actionId, status ) {
		const { actions } = this.state;

		const updatedActions = map( actions, action => {
			if ( action.id == actionId ) {
				action.status = status;
			}
			return action;
		} );
		this.setState( {
			actions: updatedActions,
		} );
	}

	/**
	 * Run button click handler.
	 */
	onRun() {
		this.processSelectedActions( 'run' );
	}

	/**
	 * Cancel button click handler.
	 */
	onCancel() {
		this.processSelectedActions( 'cancel' );
	}

	/**
	 * Determine whether an action is currently selected.
	 *
	 * @param i {number} Action ID.
	 * @returns {boolean}
	 */
	selectedIndex( i ) {
		const { selectedRows } = this.state;
		if ( ! selectedRows ) {
			return false;
		}

		return selectedRows.findIndex( ( id ) => id == i );
	}

	/**
	 * Determine whether all actions are currently selected.
	 *
	 * @returns {boolean}
	 */
	selectedAll() {
		const { enabledRows, selectedRows } = this.state;
		if ( ! enabledRows || ! selectedRows ) {
			return false;
		}
		return enabledRows.length > 0 && selectedRows.length == enabledRows.length;
	}

	/**
	 * Toggle the selection of a row.
	 *
	 * @param i {number} Action ID.
	 */
	selectRow( i ) {
		const { selectedRows } = this.state;
		const found = this.selectedIndex( i );
		let newRows = [];

		if ( found >= 0 ) {
			newRows = [
				...selectedRows.slice( 0, found ),
				...selectedRows.slice( found + 1 ),
			];
		} else {
			newRows = [
				...selectedRows,
				i,
			];
		}
		newRows.sort();

		this.setState( {
			selectedRows: newRows,
		} );
	}

	/**
	 * Select all rows. Or unselect all rows when all rows are currently selected.
	 */
	selectAllRows() {
		const { enabledRows } = this.state;
		let newRows = this.selectedAll() ? [] : [ ...enabledRows ];
		this.setState( {
			selectedRows: newRows,
		} );
	}

	/**
	 * Get the checkbox control for an action row.
	 *
	 * @param i       {number} Action ID.
	 * @param enabled {boolean} Whether the checkbox should be enabled.
	 * @returns {{display: JSX.Element, value: boolean}}
	 */
	getCheckbox( i, enabled ) {
		const isChecked = this.selectedIndex( i ) >= 0;
		return {
			display: (
				<CheckboxControl
					onChange={ () => this.selectRow( i ) }
					disabled={ ! enabled }
					checked={ enabled && isChecked }
				/>
			),
			value: false,
		};
	}

	/**
	 * Get the table header row.
	 *
	 * @returns {[{Object}]} Object array of header cell properties.
	 */
	getHeadersContent() {
		return [
			{
				cellClassName: 'is-checkbox-column',
				key: 'compare',
				label: (
					<CheckboxControl
						onChange={ this.selectAllRows }
						aria-label={ __( 'Select All' ) }
						checked={ this.selectedAll() }
					/>
				),
				required: true,
			},
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

	/**
	 * Get the summary row for the table footer.
	 *
	 * @returns {[{label: string, value: number}]} Object array of summary values.
	 */
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

	/**
	 * Get a table row for an individual action.
	 *
	 * @returns {[[{Object}]]} A table of rows of action properties.
	 */
	getRowsContent() {
		const { actions } = this.state;

		return map( actions, row => {
			const {
				id,
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
			const isPending = status == 'Pending';
			return [
				this.getCheckbox( id, isPending ),
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

	/**
	 * Render an action's parameter list as an unordered list.
	 *
	 * @param parameters {[mixed]} Action parameter array.
	 * @returns {JSX.Element|null}
	 */
	renderParameterList( parameters ) {
		if ( ! parameters.length ) {
			return null;
		}

		var list = map( parameters, ( parameter, i ) => {
			return (
				<li key={i}>{ parameter }</li>
			);
		} );

		return (
			<Fragment>
			<ul>
				{list}
			</ul>
			</Fragment>
		);

	}

	/**
	 * Render the hook parameter. Use multiple lines for longer hook names.
	 *
	 * @param hook {string} Hook name.
	 * @returns {string}
	 */
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

	/**
	 * Render a placeholder screen while waiting for data.
	 *
	 * @returns {JSX.Element}
	 */
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

	/**
	 * Render the action table.
	 *
	 * @returns {JSX.Element}
	 */
	renderTable() {
		const { query } = this.props;
		const { perPage, totalRows } = this.state.pagination;
		const { isBusy, selectedRows } = this.state;

		const rows = this.getRowsContent() || [];
		const buttonsEnabled = ! isBusy && selectedRows && selectedRows.length;
		const headers = this.getHeadersContent();

		return (
			<TableCard
				actions ={ [
					(
						<Button
							key={ 'run' }
							className={ 'is-primary' }
							text={ __( 'Run Selected', 'action-scheduler-admin' ) }
							onClick={ this.onRun }
							disabled={ ! buttonsEnabled }
							variant={ 'primary' }
						/>
					),
					(
						<Button
							key={ 'cancel' }
							className={ 'is-secondary' }
							text={ __( 'Cancel Selected', 'action-scheduler-admin' ) }
							onClick={ this.onCancel }
							disabled={ ! buttonsEnabled }
							variant={ 'secondary' }
						/>
					),
				] }
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

	/**
	 * React calls `render` when components props change.
	 *
	 * @returns {JSX.Element}
	 */
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
}

export default ActionsReport;
