<?php

/**
 * The public-facing functionality of the plugin.
 *
 * @link       https://pixelgrade.com
 * @since      1.0.0
 *
 * @package    Gridable
 * @subpackage Gridable/public
 */

/**
 * The public-facing functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Gridable
 * @subpackage Gridable/public
 * @author     PixelGrade <contact@pixelgrade.com>
 */
class Gridable_Public {

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $gridable    The ID of this plugin.
	 */
	private $gridable;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 * @param      string    $gridable       The name of the plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct( $gridable, $version ) {

		$this->gridable = $gridable;
		$this->version = $version;
	}

	public function add_row_shortcode( $atts, $content ) {
		ob_start(); ?>
		<div class="gridable gridable--row">
			<?php echo do_shortcode( $content ); ?>
		</div>
		<?php
		return ob_get_clean();
	}

	public function add_column_shortcode( $atts, $content ) {

		$size = 1;

		if ( ! empty( $atts['size'] ) ) {
			$size =  $atts['size'];
		}

		ob_start();
		$size = apply_filters('gridable_sh_col_attr_size', $size); ?>
		<div class="gridable--col  hand-span-<?php echo $size; ?>">
			<?php echo do_shortcode( $content ); ?>
		</div>
		<?php
		return ob_get_clean();
	}

	function mce_sh_col_size_classes( $classes ){

		$classes =  array(
			1  => 'lap-one-twelfth',
			2  => 'lap-two-twelfths',
			3  => 'lap-three-twelfths',
			4  => 'lap-four-twelfths',
			5  => 'lap-five-twelfths',
			6  => 'lap-six-twelfths',
			7  => 'lap-seven-twelfths',
			8  => 'lap-eight-twelfths',
			9  => 'lap-nine-twelfths',
			10 => 'lap-ten-twelfths',
			11 => 'lap-eleven-twelfths',
			12 => 'lap-one-whole',
		);

		return $classes;
	}

	/**
	 * Register the stylesheets for the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles() {

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Gridable_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Gridable_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		wp_enqueue_style( $this->gridable, plugin_dir_url( __FILE__ ) . 'css/gridable-style.css', array(), $this->version, 'all' );

	}
//
//	/**
//	 * Register the JavaScript for the public-facing side of the site.
//	 *
//	 * @since    1.0.0
//	 */
//	public function enqueue_scripts() {
//
//		/**
//		 * This function is provided for demonstration purposes only.
//		 *
//		 * An instance of this class should be passed to the run() function
//		 * defined in Gridable_Loader as all of the hooks are defined
//		 * in that particular class.
//		 *
//		 * The Gridable_Loader will then create the relationship
//		 * between the defined hooks and the functions defined in this
//		 * class.
//		 */
//
//		wp_enqueue_script( $this->gridable, plugin_dir_url( __FILE__ ) . 'js/gridable-public.js', array( 'jquery' ), $this->version, false );
//
//	}

}
