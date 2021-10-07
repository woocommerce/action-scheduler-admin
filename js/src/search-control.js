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
    }

    /**
     * Render the search icon
     */
    renderSearchIcon() {
        return (
            <GridIconSearch />
        );
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
                    onChange = { onChange }
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
