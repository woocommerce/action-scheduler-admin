/** @format */
/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button, Card, CheckboxControl } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { map } from 'lodash';

/**
 * WooCommerce dependencies
 */
import { Date, ReportFilters, TableCard, TablePlaceholder } from '@woocommerce/components';
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

//@todo: import './style.scss'; if necessary

class ActionsReport extends Component {

	constructor( props ) {
		super( props );
		this.state = {
			actions: null,
			loading: true,
			isBusy: true,
		};
		this.getHeadersContent = this.getHeadersContent.bind( this );
		this.getRowsContent = this.getRowsContent.bind( this );
		this.getCheckbox = this.getCheckbox.bind( this );
		this.getAllCheckbox = this.getAllCheckbox.bind( this );
		this.onCancel = this.onCancel.bind( this );
		this.onRun = this.onRun.bind( this );
		this.processAction = this.processAction.bind( this );
		this.selectedIndex = this.selectedIndex.bind( this );
		this.selectedAll = this.selectedAll.bind( this );
		this.selectRow = this.selectRow.bind( this );
		this.selectAllRows = this.selectAllRows.bind( this );
		this.setBusy = this.setBusy.bind( this );
		this.unsetBusy = this.unsetBusy.bind( this );
		this.updateActionStatus = this.updateActionStatus.bind( this );
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
				loading: false,
			} );
		} );
		this.unsetBusy();
	}

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

	unsetBusy() {
		this.setState( {
			isBusy: false,
		} );
	}

	processAction( actionId, action ) {
		this.updateActionStatus( actionId, 'Complete' );
	}

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
	onRun() {
		const { selectedRows } = this.state;
		const actionIds = [ ...selectedRows ];
		let actionId;

		if ( this.setBusy() ) {
			while ( actionIds.length > 0 ) {
				actionId = actionIds.shift();
				this.processAction( actionId, 'run' );
				this.setState( {
					selectedRows: actionIds,
				} );
			}
		}
		this.unsetBusy();
	}

	onCancel() {
		this.setBusy();
		//
		this.unsetBusy();
	}

	selectedIndex( i ) {
		const { selectedRows } = this.state;
		if ( ! selectedRows ) {
			return false;
		}

		return selectedRows.findIndex( ( id ) => id == i );
	}

	selectedAll() {
		const { enabledRows, selectedRows } = this.state;
		if ( ! enabledRows || ! selectedRows ) {
			return false;
		}
		return enabledRows.length > 0 && selectedRows.length == enabledRows.length;
	}

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

	selectAllRows() {
		const { enabledRows } = this.state;
		let newRows = this.selectedAll() ? [] : [ ...enabledRows ];
		this.setState( {
			selectedRows: newRows,
		} );
	}

	getCheckbox( i, enabled ) {
		const isChecked = this.selectedIndex( i ) >= 0;
		return {
			display: (
				<CheckboxControl
					onChange={ () => this.selectRow( i ) }
					disabled={ ! enabled }
					checked={ isChecked }
				/>
			),
			value: false,
		};
	}

	getAllCheckbox() {
		return {
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
		};

	}

	getHeadersContent() {
		return [
			this.getAllCheckbox(),
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
				summary={ null }
			/>
		);
	}

	render() {
		const { loading, actions } = this.state;
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
