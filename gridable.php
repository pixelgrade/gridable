<?php
/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://pixelgrade.com
 * @since             1.0.0
 * @package           Gridable
 *
 * @wordpress-plugin
 * Plugin Name:       Gridable
 * Plugin URI:        https://pixelgrade.com/
 * Description:       The Missed Grid Content Editor
 * Version:           0.5.0
 * Author:            PixelGrade
 * Author URI:        https://pixelgrade.com/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       gridable
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-gridable-activator.php
 */
function activate_gridable() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-gridable-activator.php';
	Gridable_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-gridable-deactivator.php
 */
function deactivate_gridable() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-gridable-deactivator.php';
	Gridable_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_gridable' );
register_deactivation_hook( __FILE__, 'deactivate_gridable' );

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
function run_gridable() {
	global $gridable_plugin;
	$gridable_plugin = new Gridable();
	$gridable_plugin->run();

}
run_gridable();
