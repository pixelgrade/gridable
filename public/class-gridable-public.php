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
 * @author     Pixelgrade <contact@pixelgrade.com>
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

	private $last_row_pos = 0;

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

		$atts = shortcode_atts( $atts, array(
			'cols_nr' => '',
		) );

		$cols_nr = 1;

		if ( ! empty( $atts['cols_nr'] ) ) {
			$cols_nr = (int) $atts['cols_nr'];
		}

		$classes = apply_filters( "gridable_row_class", array( "gridable", "gridable--row" ), $cols_nr, $atts, $content );

		$classes = array_map( 'esc_attr', $classes );

		$class = '';
		if ( ! empty( $classes ) ) {
			$class = 'class="' . join( ' ', array_unique( $classes ) ) . '"';
		}

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

		$size = 1;
		if ( ! empty( $atts['size'] ) ) {
			$size = (int) $atts['size'];
		}

		$size = apply_filters( "gridable_column_size", $size );

		$classes = apply_filters( "gridable_column_class", array( 'gridable--col', 'col-' . $size ), $size, $atts, $content );

		$classes = array_map( 'esc_attr', $classes );

		$class = '';
		if ( ! empty( $classes ) ) {
			$class = 'class="' . join( ' ', array_unique( $classes ) ) . '"';
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

	/**
	 * Register the stylesheets for the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles() {
		// @TODO Write documentation for this
		if ( ! apply_filters( 'gridable_load_public_style', '__return_true' ) ) {
			return;
		}

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

	/**
	 * This function  strips unclosed p tags at a beggining and at the end of a row
	 * @param $content
	 * @param $atts
	 *
	 * @return string
	 */
	function gridable_fix_lost_p_tags( $content, $atts ){
		$first_4_chars = substr($content, 0, 4);

		$last_3_chars = substr($content, -3, 4);

		if ( '</p>' === $first_4_chars ) {
			$content = substr($content, 5);
		}

		if ( '<p>' === $last_3_chars ) {
			$content = substr($content, 0, -4);
		}

		return $content;
	}

	function gridable_add_empty_column_class( $classes, $size, $atts, $content ){

		if ( empty( $content ) ) {
			$classes[] = 'empty_column';
		}

		return $classes;
	}

	/**
	 * Try to allow one level of nested rows
	 * @param $content
	 *
	 * @return mixed
	 */
	function parse_content_for_nested_rows( $content, $rec = false ){
		$rows_matches = array();

		preg_match_all( '#' . get_shortcode_regex( array('row') ) . '#ims' , $content, $rows_matches);

		/**
		 * Basically in the first group of matches are the plain row texts
		 * If a row contains another row, we should render it before.
		 */
		if ( ! empty( $rows_matches[0] ) ) {

			// iterate through each row and check if anyone has a nested row
			foreach ($rows_matches[0] as $key => $match ) {

				$row_pos = strpos( $rows_matches[0][$key], '[row cols_nr="', 5 );

				// if there is another row inside render it first
				if ( $row_pos !== false ) {
					// make a clone of the original row
					$temp_row = $match;
					// if this row has an inner row, let's render it and replace it in the clone row
					preg_match(  '#' . get_shortcode_regex( array('row') ) . '#', $match, $smatch);
					if ( substr_count( $smatch[0], '[row ' ) > 1 ) {
						$inner_rows = array();

						// right now the row form is [row] content [row]content[/row]
						// if we render the available rows we will have a nested-free row
						$remove_starting_row = '~\[' . $smatch[1] . $smatch[2] . $smatch[3] . '\]~';
						$temp_content = preg_replace( $remove_starting_row, '', $smatch[0], 1 );

						preg_match_all( '#' . get_shortcode_regex( array( 'row' ) ) . '#ms' , $temp_content, $inner_rows);

						// there may be more than one inner row, catch'em all
						foreach ($inner_rows[0] as $inner_row ) {
							$temp_row = str_replace( $inner_row, do_shortcode($inner_row), $temp_row );
						}
					}

					// now we have a [row] content <div class="row"></div>
					// the closing [/row] is definetly somewhere after
					$content = str_replace( $match, $temp_row, $content);
				} else if ( ! $rec ) {
					$content = $this->parse_content_for_nested_rows( $content, true );
				}
			}
		}

		return $content;
	}

	/**
	 * Register the JavaScript for the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {

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

		wp_enqueue_script( $this->gridable, plugin_dir_url( __FILE__ ) . 'js/gridable-scripts.js', array( 'jquery' ), $this->version, false );

	}

}

