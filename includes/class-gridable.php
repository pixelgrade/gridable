<?php

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://pixelgrade.com
 * @since      1.0.0
 *
 * @package    Gridable
 * @subpackage Gridable/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    Gridable
 * @subpackage Gridable/includes
 * @author     Pixelgrade <contact@pixelgrade.com>
 */
class Gridable {

	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      Gridable_Loader $loader Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string $gridable The string used to uniquely identify this plugin.
	 */
	protected $gridable;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string $version The current version of the plugin.
	 */
	protected $version;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @param string $version The current plugin version.
	 *
	 * @since    1.0.0
	 */
	public function __construct( $version = '1.0.0' ) {

		$this->gridable = 'gridable';
		$this->version  = $version;

		$this->load_dependencies();
		$this->set_locale();

		// We need to define the admin hooks (and their conditions) later to allow the theme to have its say (like in the case of the Classic Editor bundled with Pixelgrade Care).
		add_action( 'after_setup_theme', array( $this, 'define_admin_hooks' ), 3 );
		$this->define_public_hooks();

	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Include the following files that make up the plugin:
	 *
	 * - Gridable_Loader. Orchestrates the hooks of the plugin.
	 * - Gridable_i18n. Defines internationalization functionality.
	 * - Gridable_Admin. Defines all hooks for the admin area.
	 * - Gridable_Public. Defines all hooks for the public side of the site.
	 *
	 * Create an instance of the loader which will be used to register the hooks
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function load_dependencies() {

		/**
		 * The class responsible for orchestrating the actions and filters of the
		 * core plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-gridable-loader.php';

		/**
		 * The class responsible for defining internationalization functionality
		 * of the plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-gridable-i18n.php';

		/**
		 * The class responsible for defining all actions that occur in the admin area.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/class-gridable-admin.php';

		/**
		 * The class responsible for defining all actions that occur in the public-facing
		 * side of the site.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'public/class-gridable-public.php';

		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/addons/attributes.php';

		$this->loader = new Gridable_Loader();

	}

	/**
	 * Check if Gutenberg is active.
	 * Must be used not earlier than plugins_loaded action fired.
	 *
	 * @return bool
	 */
	protected function is_gutenberg_active() {
		// Gutenberg plugin is installed and activated.
		$gutenberg = ! ( false === has_filter( 'replace_editor', 'gutenberg_init' ) );

		// Block editor since 5.0.
		$block_editor = version_compare( $GLOBALS['wp_version'], '5.0-beta', '>' );

		if ( ! $gutenberg && ! $block_editor ) {
			return false;
		}

		if ( $this->is_classic_editor_plugin_active() ) {
			$editor_option = get_option( 'classic-editor-replace' );
			$block_editor_active = array( 'no-replace', 'block' );

			return in_array( $editor_option, $block_editor_active, true );
		}

		return true;
	}

	/**
	 * Check if Classic Editor plugin is active.
	 *
	 * @return bool
	 */
	protected function is_classic_editor_plugin_active() {
		if ( class_exists( 'Classic_Editor') && method_exists('Classic_Editor', 'init_actions' ) ) {
			return true;
		}

		if ( ! function_exists( 'is_plugin_active' ) ) {
			include_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		if ( is_plugin_active( 'classic-editor/classic-editor.php' ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Define the locale for this plugin for internationalization.
	 *
	 * Uses the Gridable_i18n class in order to set the domain and to register the hook
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	protected function set_locale() {

		$plugin_i18n = new Gridable_i18n();

		$this->loader->add_action( 'plugins_loaded', $plugin_i18n, 'load_plugin_textdomain' );

	}

	/**
	 * Register all of the hooks related to the admin area functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	public function define_admin_hooks() {

		$plugin_admin = new Gridable_Admin( $this->get_gridable(), $this->get_version() );

		add_action( 'media_buttons', array( $plugin_admin, 'add_media_button' ), 15 );

		// Check if Gutenberg is active and if we are in the Editor screen
		if ( ! $this->is_gutenberg_active() && is_admin() ) {
			add_filter( 'mce_external_plugins', array( $plugin_admin, 'add_tinymce_plugin' ) );
		}

		add_filter( 'wp_editor_settings', array( $plugin_admin, 'change_tinymce_settings' ) );
		add_action( 'admin_footer', array( $plugin_admin, 'print_tinymce_templates' ) );

		// also inside the wp-editor we cannot localize parameters, so we simply output the javascript code
		add_action( 'admin_head', array( $plugin_admin, 'styles_scripts' ) );

		if ( apply_filters( 'gridable_support_for_customizer', true ) && ! wp_doing_ajax() ) {
			// This is needed for wp-editors added in customizer
			add_action( 'customize_controls_print_footer_scripts', array( $plugin_admin, 'styles_scripts' ) );
			add_action( 'customize_controls_print_footer_scripts', array( $plugin_admin, 'print_tinymce_templates' ) );
		}
	}

	/**
	 * Register all of the hooks related to the public-facing functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	protected function define_public_hooks() {

		$plugin_public = new Gridable_Public( $this->get_gridable(), $this->get_version() );

		add_action( 'wp_enqueue_scripts', array( $plugin_public, 'enqueue_styles' ) );
		add_action( 'wp_enqueue_scripts', array( $plugin_public, 'enqueue_scripts' ) );
		add_shortcode( 'row', array( $plugin_public, 'add_row_shortcode' ) );
		add_shortcode( 'col', array( $plugin_public, 'add_column_shortcode' ) );

		add_filter( 'the_content', array( $plugin_public, 'parse_content_for_nested_rows' ), 9 );

		// clear lost p tags in front-end
		if ( ! is_admin() ) {
			add_filter( 'gridable_the_column_content', array( $plugin_public, 'gridable_fix_lost_p_tags' ), 10, 2 );

			if ( true === apply_filters( 'gridable_add_empty_column_class', true ) ) {
				add_filter( 'gridable_column_class', array(
					$plugin_public,
					'gridable_add_empty_column_class',
				), 10, 4 );
			}

		}
	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 *
	 * @since    1.0.0
	 */
	public function run() {
		$this->loader->run();
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @return    string    The name of the plugin.
	 * @since     1.0.0
	 */
	public function get_gridable() {
		return $this->gridable;
	}

	/**
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @return    Gridable_Loader    Orchestrates the hooks of the plugin.
	 * @since     1.0.0
	 */
	public function get_loader() {
		return $this->loader;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @return    string    The version number of the plugin.
	 * @since     1.0.0
	 */
	public function get_version() {
		return $this->version;
	}

}
