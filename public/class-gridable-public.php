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

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 *
	 * @param      string $gridable The name of the plugin.
	 * @param      string $version The version of this plugin.
	 */
	public function __construct( $gridable, $version ) {
		$this->gridable = $gridable;
		$this->version  = $version;
	}

	/**
	 * Render the [row]
	 *
	 * This function allows themes to overwrite row templates
	 * in `theme_name/temaplates/gridable/row.php` (filtrable path)
	 *
	 * @param $atts
	 * @param $content
	 *
	 * @return string
	 */
	public function add_row_shortcode( $atts, $content ) {
		$tag = 'row';

		$atts = shortcode_atts( array(
			'cols_nr' => '',
			'spacing_top' => '',
			'spacing_bottom' => '',
			'spacing_gutter' => '',
			'bg-color' => ''
		), $atts );

		$cols_nr = 1;
		if ( ! empty( $atts['cols_nr'] ) ) {
			$cols_nr = (int) $atts['cols_nr'];
		}

		$spacing_top = 'large';
		if ( ! empty( $atts['spacing_top'] ) ) {
			$spacing_top = (int) $atts['spacing_top'];
		}

		$spacing_bottom = 'large';
		if ( ! empty( $atts['spacing_bottom'] ) ) {
			$spacing_bottom = (int) $atts['spacing_bottom'];
		}

		$spacing_gutter = 'medium';
		if ( ! empty( $atts['spacing_gutter'] ) ) {
			$spacing_gutter = (int) $atts['spacing_gutter'];
		}

		$bg_color = '#eef1f2';
		if ( ! empty( $atts['bg_color'] ) ) {
			$bg_color = (int) $atts['bg_color'];
		}

		$class = apply_filters( "gridable_sh_{$tag}_attr_size", "gridable gridable--row" );

		// get sh template
		$template = $this->get_localed_sh_templated( $tag );
		// load it
		ob_start();
		require $template;
		return ob_get_clean();
	}

	/**
	 * Render the [col]
	 *
	 * This function allows themes to overwrite col templates
	 * in `theme_name/temaplates/gridable/col.php` (filtrable path)
	 *
	 * @param $atts
	 * @param $content
	 *
	 * @return string
	 */
	public function add_column_shortcode( $atts, $content ) {
		$tag = 'col';

		$atts = shortcode_atts( array(
			'size' => '',
			'spacing_column' => ''
		), $atts );

		$size = 1;
		if ( ! empty( $atts['size'] ) ) {
			$size = (int) $atts['size'];
		}

		$spacing_column = 'none';
		if ( ! empty( $atts['spacing_column'] ) ) {
			$spacing_column = (int) $atts['spacing_column'];
		}

		$size = apply_filters( "gridable_sh_{$tag}_attr_size", $size );

		$classes = apply_filters( "gridable_sh_{$tag}_attr_size", array( 'gridable--col', 'hand-span-' . $size ), $size );

		if ( ! empty( $classes ) ) {
			$class = 'class="' . join( ' ', $classes) . '"';
		}

		// get sh template
		$template = $this->get_localed_sh_templated( $tag );
		// load it
		ob_start();
		require $template;
		return ob_get_clean();
	}

	/**
	 * This function will try to return the right template for a given tag
	 * If the template exists in theme it will have priority
	 * Else the plugin default from partials will be returned
	 * @param $tag
	 *
	 * @return bool|string
	 */
	function get_localed_sh_templated( $tag ) {

		if ( empty( $tag ) ) {
			return false;
		}

		/**
		 * Template localization between plugin and theme
		 */
		$theme_path = apply_filters( 'gridable_theme_templates_path_filter', "template-parts/gridable/", $tag );
		$theme_path = $theme_path . $tag . '.php';
		$located    = locate_template( $theme_path, false, false );
		if ( ! $located ) {
			$located =  dirname( __FILE__ ) . '/partials/' . $tag . '.php';
		}

		return $located;
	}

	function mce_sh_col_size_classes( $classes ) {

		$classes = array(
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
