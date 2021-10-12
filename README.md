# action-scheduler-admin
Action Scheduler screen for the WooCommerce Admin interface

---

## Prerequisites

- [PHP 5.6 or greater](https://www.php.net/manual/en/appendices.php)
- [WordPress 5.0 or greater](https://wordpress.org/download/)
- [WooCommerce 3.5.0 or greater](https://wordpress.org/plugins/woocommerce/)
- [WooCommerce Admin 0.11.0 or greater](https://wordpress.org/plugins/woocommerce-admin/)

## Development

After cloning the repo, install dependencies with `npm install`. Now you can build the files using one of these commands:

 - `npm run clean` : Clean the `/dist/` folder where the React app lives
 - `npm run build` : Build a production version
 - `npm run start` : Build a development version, watch files for changes
 - `npm run prebuild` : Check for outdated dependencies and update those found

There are also some helper scripts:

 - `npm run lint:js` : Run eslint over the javascript files
 - `npm run lint` : Run eslint over the javascript *AND* phpcs over the PHP files
 - `npm run i18n` : A multi-step process, used to create a pot file from both the JS and PHP gettext calls. First it runs `i18n:js`, which creates a temporary `.pot` file from the JS files. Next it runs `i18n:php`, which converts that `.pot` file to a PHP file. Lastly, it runs `i18n:pot`, which creates the final `.pot` file from all the PHP files in the plugin (including the generated one with the JS strings).
