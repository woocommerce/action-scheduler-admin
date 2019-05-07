/** @format */
/**
 * External dependencies
 */
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const { get } = require( 'lodash' );
const path = require( 'path' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const { DefinePlugin } = require( 'webpack' );
const WebpackRTLPlugin = require( 'webpack-rtl-plugin' );

/**
 * WordPress dependencies
 */
const CustomTemplatedPathPlugin = require( '@wordpress/custom-templated-path-webpack-plugin' );

const NODE_ENV = process.env.NODE_ENV || 'development';

const externals = {
  '@wordpress/api-fetch': { this: [ 'wp', 'apiFetch' ] },
  '@wordpress/blocks': { this: [ 'wp', 'blocks' ] },
  '@wordpress/components': { this: [ 'wp', 'components' ] },
  '@wordpress/compose': { this: [ 'wp', 'compose' ] },
  '@wordpress/data': { this: [ 'wp', 'data' ] },
  '@wordpress/editor': { this: [ 'wp', 'editor' ] },
  '@wordpress/element': { this: [ 'wp', 'element' ] },
  '@wordpress/hooks': { this: [ 'wp', 'hooks' ] },
  '@wordpress/html-entities': { this: [ 'wp', 'htmlEntities' ] },
  '@wordpress/i18n': { this: [ 'wp', 'i18n' ] },
  '@wordpress/keycodes': { this: [ 'wp', 'keycodes' ] },
  '@woocommerce/components': { this: [ 'wc', 'components' ] },
  '@woocommerce/navigation': { this: [ 'wc', 'navigation' ] },
  tinymce: 'tinymce',
  lodash: 'lodash',
  moment: 'moment',
  react: 'React',
  'react-dom': 'ReactDOM',
};

const webpackConfig = {
  mode: NODE_ENV,
  entry: {
    plugin: './js/src/index.js',
  },
  output: {
    filename: './dist/index.js',
    path: __dirname,
    library: [ 'wc', '[modulename]' ],
    libraryTarget: 'this',
  },
  externals,
  module: {
    rules: [
      {
        parser: {
          amd: false,
        },
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.js?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [ '@babel/preset-env', { loose: true, modules: 'commonjs' } ],
            ],
            plugins: [ 'transform-es2015-template-literals' ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [ '.json', '.js', '.jsx' ],
    modules: [
      'node_modules',
    ],
    alias: {
      'gutenberg-components': path.resolve( __dirname, 'node_modules/@wordpress/components/src' ),
    },
  },
};

if ( webpackConfig.mode !== 'production' ) {
  webpackConfig.devtool = process.env.SOURCEMAP || 'source-map';
}

module.exports = webpackConfig;
