/** @format */
/**
 * External dependencies
 */
import { Component } from '@wordpress/element';
import GridIconSearch from 'gridicons/dist/search';
import PropTypes from 'prop-types';

/**
 * WooCommerce dependencies
 */
import { TextControl } from '@woocommerce/components';
import {__} from "@wordpress/i18n";

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
        /**
         * Bind the handlers to this instance of the component.
         */
        this.onKeyPress = this.onKeyPress.bind( this );
        this.onChange = this.onChange.bind( this );
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
     * Handle HTML Input element onChange event.
     *
     * @param event {Event} Keypress event object.
     */
    onChange( event ) {
        const { onChange } = this.props;
        onChange( event.target.value );
    }
    /**
     * React calls `render` when components props change.
     * This control uses HTML Elements with CSS classes to achieve consistent styling with WooCommerce Admin.
     *
     * @returns {JSX.Element}
     */
    render() {
        const { isBusy, label, onSearch, placeholder, value } = this.props;

        return (
            <div
                className={ 'woocommerce-select-control woocommerce-search' }
            >
                <div
                    className={ 'woocommerce-select-control__control components-base-control' }
                >
                    <GridIconSearch
                        className={ 'woocommerce-select-control__control-icon' }
                        key={ 'search' }
                        onClick={ !isBusy ? onSearch : null }
                    />
                    <div
                        className={ 'components-base-control__field' }
                    >
                        <input
                            className={ 'woocommerce-select-control__control-input' }
                            key={ 'search-string' }
                            label={ label }
                            value={ value }
                            onChange={ this.onChange }
                            onKeyPress={ this.onKeyPress }
                            placeholder={ placeholder }
                        />
                    </div>
                </div>
            </div>
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
    placeholder: PropTypes.string,
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

SearchControl.defaultProps = {
    label: __( 'Search', 'action-scheduler-admin' ),
    placeholder: '',
};

export default SearchControl;
