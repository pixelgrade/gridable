<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       http://example.com
 * @since      1.0.0
 *
 * @package    Gridable
 * @subpackage Gridable/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Gridable
 * @subpackage Gridable/admin
 * @author     Your Name <email@example.com>
 */
class Gridable_Admin {

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
	 * @param      string    $gridable       The name of this plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct( $gridable, $version ) {
		$this->gridable = $gridable;
		$this->version = $version;
	}

	function wp_print_grider_tinymce_templates() {
		$row_classes = array(
			'pixcode',
			'pixcode--grid',
			'grid'
		);
		$col_classes = array(
			'grid__item'
		); ?>
		<script type="text/html" id="tmpl-wpig-grider-row">
			<div class="{{data.classes}} <?php echo join( ' ', apply_filters( 'wpig_mce_sh_row_classes', $row_classes ) );?>" {{data.atts}} data-mce-resize="false" data-mce-placeholder="1">
				{{{data.content}}}
			</div>
		</script>

		<script type="text/html" id="tmpl-wpig-grider-col">
			<div class="{{data.classes}} <?php echo join( ' ', apply_filters( 'wpig_mce_sh_col_classes', $col_classes ) );?>" {{data.atts}} data-mce-resize="false" data-mce-placeholder="1">
				<p>{{{data.content}}}</p>
			</div>
		</script>
	<?php }


	function add_grider_tinymce_plugin( $plugin_array ) {

		$plugin_array['wpig_grider'] =  plugin_dir_url( __FILE__ ) . 'js/gridable.js';

		return $plugin_array;
	}

	function my_add_styles_admin() {
		global $current_screen;
		$type = $current_screen->post_type;

		if ( is_admin()) { ?>
			<script type="text/javascript">
				var gridable_sh_col_classes = JSON.parse( '<?php echo json_encode( apply_filters( 'wpig_sh_col_attr_size', array() ) ) ?>' );
			</script>
			<?php
		}
	}

//	/**
//	 * Register the stylesheets for the admin area.
//	 *
//	 * @since    1.0.0
//	 */
//	public function enqueue_styles() {
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
//		wp_enqueue_style( $this->gridable, plugin_dir_url( __FILE__ ) . 'css/gridable-admin.css', array(), $this->version, 'all' );
//
//	}
//
//	/**
//	 * Register the JavaScript for the admin area.
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
//		wp_enqueue_script( $this->gridable, plugin_dir_url( __FILE__ ) . 'js/gridable-admin.js', array( 'jquery' ), $this->version, false );
//
//	}
//
//
}
