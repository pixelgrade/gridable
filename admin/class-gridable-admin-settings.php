<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Gridable
 * @subpackage Gridable/admin
 * @author     Pixelgrade <contact@pixelgrade.com>
 */
class Gridable_Admin_Page {

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string $gridable The ID of this plugin.
	 */
	private $gridable;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string $version The current version of this plugin.
	 */
	private $version;

	private $options;

	private $config;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 *
	 * @param      string $gridable The name of this plugin.
	 * @param      string $version The version of this plugin.
	 */
	public function __construct( $gridable, $version ) {
		$this->gridable = $gridable;
		$this->version  = $version;

		$this->config = array(

			'tab1' => array(
				'label' => 'Tab title',
				'fields' => array(
					'texter' => array(
						'label' => 'Example',
						'type' => 'text',
						'default' => 'whaaadasa sad as das'
					),

					'textera' => array(
						'label' => 'Text area Example',
						'type' => 'textarea',
						'default' => 'whaaadasa sad as das'
					),

					'editor' => array(
						'label' => 'Example',
						'type' => 'editor',
						'default' => 'whaaadasa sad as das'
					)
				)
			),

			'tab2' => array(
				'label' => 'Second tab title',
				'fields' => array(
					'toogler' => array(
						'label' => 'Checkbox Example',
						'type' => 'checkbox',
						'default' => 'whaaadasa sad as das'
					),

					'select' => array(
						'label' => 'Select Example',
						'type' => 'select',
						'default' => 'whaaadasa sad as das'
					),

					'radio' => array(
						'label' => 'Example',
						'type' => 'radio',
						'default' => 'whaaadasa sad as das'
					),
				)
			)
		);
	}

	// Register a settings page
	function add_admin_menu() {
		$admin_page = add_submenu_page( 'options-general.php', 'Gridable', 'Gridable', 'manage_options', 'gridable', array(
			$this,
			'gridable_options_page'
		) );
	}

	function gridable_options_page() {
		$state = $this->get_option( 'state' ); ?>
		<div class="wrap">
			<div class="gridable-wrapper">
				<h1 class="title"><?php esc_html_e('Gridable', 'gridable') ?></h1>
				<div id="admin_options_dashboard"></div>
			</div>
		</div>
		<?php
	}

	function settings_init() {
		register_setting( 'gridable', 'gridable_settings' );

		add_settings_section(
			'gridable_section',
			esc_html__( 'Gridable description', 'gridable' ),
			null,
			'gridable'
		);
	}


	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles() {
		if ( $this->is_admin_options_dashboard() ) {
			wp_enqueue_style( 'gridable-dashboard', plugin_dir_url( __FILE__ ) . 'css/gridable-admin-page.css', array(), $this->version, 'all' );
		}
	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {
		if ( $this->is_admin_options_dashboard() ) {

			wp_enqueue_style( 'galanogrotesquealt', 'http://pxgcdn.com/fonts/galanogrotesquealt/stylesheet.css' );
			wp_enqueue_style( 'galanoclassic', 'http://pxgcdn.com/fonts/galanoclassic/stylesheet.css' );

			wp_enqueue_script( 'gridable-dashboard', plugin_dir_url( __FILE__ ) . 'js/admin-page.js', array(
				'jquery',
				'wp-util'
			), $this->version, true );

			$this->localize_js_data( 'gridable-dashboard' );
		}
	}


	function localize_js_data( $key ) {
		$state = $this->get_option( 'state' );

		$localized_data = array(
			'login_required'     => apply_filters( 'gridable_login_required', 'true' ),
			'state'              => $state,
			'wp_rest'            => array(
				'root'                  => esc_url_raw( rest_url() ),
				'nonce'                 => wp_create_nonce( 'wp_rest' ),
				'gridable_nonce' => wp_create_nonce( 'gridable_rest' )
			),
			'customizer_url'     => admin_url( 'customize.php' ),
			'config' => $this->config,
			'options' => $this->options
		);

		wp_localize_script( $key, 'gridable', $localized_data );
	}

	
	function add_rest_routes_api() {
		//The Following registers an api route with multiple parameters.
		register_rest_route( 'gridable/v1', '/react_state', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'rest_get_state' ),
			'permission_callback' => array( $this, 'permission_nonce_callback' )
		) );

		register_rest_route( 'gridable/v1', '/react_state', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'rest_set_state' ),
			'permission_callback' => array( $this, 'permission_nonce_callback' )
		) );
	}

	function permission_nonce_callback() {
		$nonce = '';

		if ( isset( $_REQUEST['gridable_nonce'] ) ) {
			$nonce = $_REQUEST['gridable_nonce'];
		} elseif ( isset( $_POST['gridable_nonce'] ) ) {
			$nonce = $_POST['gridable_nonce'];
		}

		return wp_verify_nonce( $nonce, 'gridable_rest' );
	}

	function rest_get_state() {
		$state = $this->get_option( 'state' );
		wp_send_json_success( $state );
	}

	function rest_set_state() {
		if ( empty( $_POST['state'] ) || ! is_array( $_POST['state'] ) ) {
			wp_send_json_error( esc_html__( 'Wrong state param', 'gridable' ) );
		}

		$this->options['state'] = $_POST['state'];
		$this->save_options();
		wp_send_json_success( $this->options['state'] );
	}

	/**
	 * Helpers
	 **/
	function is_admin_options_dashboard() {
		if ( ! empty( $_GET['page'] ) && 'gridable' === $_GET['page'] ) {
			return true;
		}

		return false;
	}

	function set_options() {
		$this->options = get_option( 'gridable_options' );
	}

	function save_options() {
		update_option( 'gridable_options', $this->options );
	}

	function get_options() {
		if ( empty( $this->options ) ) {
			$this->set_options();
		}

		return $this->options;
	}

	function get_option( $option, $default = null ) {
		$options = $this->get_options();

		if ( ! empty( $options[ $option ] ) ) {
			return $options[ $option ];
		}

		if ( $default !== null ) {
			return $default;
		}

		return null;
	}
}
