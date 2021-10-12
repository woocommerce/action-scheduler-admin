/** @format */
/**
 * External dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { Button } from '@wordpress/components';
import GridIconSearch from 'gridicons/dist/search';
import PropTypes from 'prop-types';

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

SearchControl.propTypes = {
    /**
     * If this property is added, a label will be generated using label property as the content.
     */
    label: PropTypes.string,
    /**
     * If this property is added, it will be used as the search text box placeholder.
     */
    label: PropTypes.string,
    /**
     * The current value of the input.
     */
    value: PropTypes.string.isRequired,
    /**
     * A function that receives the value of the text input.
     */
    onChange: PropTypes.func.isRequired,
    /**
     * A function that handles the search icon click event.
     */
    onSearch: PropTypes.func.isRequired,
};

export default SearchControl;
