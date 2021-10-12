/** @format */
/**
 * External dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { Button } from '@wordpress/components';
import GridIconSearch from 'gridicons/dist/search';

/**
 * WooCommerce dependencies
 */
import { TextControl } from '@woocommerce/components';

/**
 * Action Scheduler admin screen component
 */
class SearchControl extends Component {
    /**
     * Component constructor.
     *
     * @param props {object} Component properties.
     */
    constructor( props ) {
        super( props );

        this.onKeyPress = this.onKeyPress.bind( this );
    }

    /**
     * Render the search icon.
     */
    renderSearchIcon() {
        return (
            <GridIconSearch />
        );
    }

    /**
     * Handle text box Enter key keypress.
     *
     * @param event {Event} Keypress event object.
     */
    onKeyPress( event ) {
        const { onSearch } = this.props;
        if ( event.key == 'Enter' ) {
            onSearch();
        }
    }

    /**
     * React calls `render` when components props change.
     *
     * @returns {JSX.Element}
     */
    render() {
        const { isBusy, label, onChange, onSearch, placeholder, value } = this.props;

        return (
            <Fragment>
                <TextControl
                    key={ 'search-string' }
                    label={ label }
                    value={ value }
                    onChange={ onChange }
                    onKeyPress={ this.onKeyPress }
                    placeholder={ placeholder }
                />
                <Button
                    isBusy={ isBusy }
                    icon={ this.renderSearchIcon }
                    key={ 'search' }
                    onClick={ onSearch }
                />
            </Fragment>
        );
    }
}

export default SearchControl;
