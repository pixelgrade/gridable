<?php
/**
 * Plugin Name:       Gridable
 * Plugin URI:        https://pixelgrade.com/
 * Description:       A simple and intuitive tool for organizing your content into columns and rows.
 * Version:           1.2.10
 * Author:            Pixelgrade
 * Author URI:        https://pixelgrade.com/
 * License:           GPL-2.0-or-later
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       gridable
 * Domain Path:       /languages
 * Requires at least: 5.9.0
 * Tested up to: 7.0
 * Requires PHP: 7.4
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-gridable-activator.php
 */
function gridable_activate() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-gridable-activator.php';
	Gridable_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-gridable-deactivator.php
 */
function gridable_deactivate() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-gridable-deactivator.php';
	Gridable_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'gridable_activate' );
register_deactivation_hook( __FILE__, 'gridable_deactivate' );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-gridable.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function gridable_run() {
	global $gridable_plugin;
	$gridable_plugin = new Gridable( '1.2.10' );
	$gridable_plugin->run();

}
gridable_run();
