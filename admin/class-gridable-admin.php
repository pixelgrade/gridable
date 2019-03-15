<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://pixelgrade.com
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
 * @author     Pixelgrade <contact@pixelgrade.com>
 */
class Gridable_Admin {

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
	 * @param      string $gridable The name of this plugin.
	 * @param      string $version The version of this plugin.
	 */
	public function __construct( $gridable, $version ) {
		$this->gridable = $gridable;
		$this->version  = $version;
	}

	public function add_media_button( $editor_id ) {
		// Setup the icon - currently using a dashicon
		$icon = '<span class="wp-media-buttons-icon dashicons dashicons-layout" style="font-size:16px;margin-top:-2px;"></span>';

		printf( '<a href="#" class="button gridable-insert-row-button" id="%s" data-editor="%s" title="%s">%s %s</a>',
			'gridable-add-row-button-' . $editor_id,
			esc_attr( $editor_id ),
			esc_attr__( 'Add Row', 'gridable' ),
			$icon,
			esc_html__( 'Add Row', 'gridable' )
		);

		/**
		 * Enqueue the editor script only when there is an editor on page.
		 * We ditch `admin_enqueue_scripts` intentionally since the editor can appear on non-edit pages like theme options
		 */
		wp_register_script( 'select2', plugin_dir_url( __FILE__ ) . 'js/select2.min.js', array( 'jquery' ), $this->version );

		wp_enqueue_script( 'gridable-add-row-button', plugin_dir_url( __FILE__ ) . 'js/add-row-button.js', array(
			'jquery',
			'wp-color-picker',
			'select2',
		), $this->version, true );

		wp_register_style( 'select2', plugin_dir_url( __FILE__ ) . 'css/select2.css', array(), $this->version );

		wp_enqueue_style( 'gridable-admin-style', plugin_dir_url( __FILE__ ) . 'css/admin-style.css', array(
			'wp-color-picker',
			'select2',
		), $this->version, false );

		wp_localize_script( 'gridable-add-row-button', 'gridable_editor_params', array(
			'new_column_content' => esc_html__( 'Content', 'gridable' ),
		) );

		wp_localize_script( 'gridable-add-row-button', 'gridable_row_options', apply_filters( 'gridable_row_options', array(
			'cols_nr' => array(
				'default' => 2,
			),
		) ) );

		wp_localize_script( 'gridable-add-row-button', 'gridable_column_options', apply_filters( 'gridable_column_options', array(
			'size' => array(
				'default' => 6,
			),
		) ) );

		global $editor_styles;
		if ( ! empty( $editor_styles ) && is_array( $editor_styles ) ) {
			$editor_styles = array_merge( $editor_styles, array(
				plugin_dir_url( __FILE__ ) . 'css/editor-style.css',
			) );
		} else {
			$editor_styles = array(
				plugin_dir_url( __FILE__ ) . 'css/editor-style.css',
			);
		}
	}

	public function print_tinymce_templates() {
		$row_classes = array(
			'gridable',
			'gridable--grid',
			'grid'
		);
		$col_classes = array(
			'grid__item'
		); ?>
<script type="text/html" id="tmpl-gridable-grider-row"><section contenteditable="false" class="{{data.classes}} <?php echo join( ' ', apply_filters( 'gridable_mce_sh_row_classes', $row_classes ) ); ?>" {{{data.atts}}} data-gridable-row="1" data-mce-resize="false" data-mce-placeholder="1">{{{data.content}}}</section></script>
<script type="text/html" id="tmpl-gridable-grider-col"><section unselectable="true" contenteditable="true" class="{{data.classes}} <?php echo join( ' ', apply_filters( 'gridable_mce_sh_col_classes', $col_classes ) ); ?>" {{{data.atts}}} data-mce-resize="false" data-mce-placeholder="1">{{{data.content}}}</section></script>
	<?php
		do_action( 'gridable_print_row_options_templates' );
		do_action( 'gridable_print_column_options_templates' );
	}

	public function add_tinymce_plugin( $plugin_array ) {
		$plugin_array['gridable'] = plugin_dir_url( __FILE__ ) . 'js/gridable.js';

		return $plugin_array;
	}

	public function change_tinymce_settings( $settings ) {
		if ( ! empty( $settings['tinymce'] ) ) {
			if ( ! is_array( $settings['tinymce'] ) ) {
				$settings['tinymce'] = array();
			}
			// We need to disable keeping the scroll position when switching between Visual and Text mode
			// due to the fact that this functionality relies on some inline spans that get autop'd
			// and result in certain cases in &nbsp; characters. Making a solid Regex for this is very tricky.
			$settings['tinymce']['wp_keep_scroll_position'] = false;
		}

		return $settings;
	}

	public function styles_scripts() { ?>
		<script type="text/javascript">
            var gridable_params = {
                l10n: JSON.parse('<?php echo json_encode( apply_filters( 'gridable_editor_l10n_labels', array(
					'remove_row'         => esc_html__( 'Remove Row', 'gridable' ),
					'remove_column'      => esc_html__( 'Remove Column', 'gridable' ),
					'edit_row'           => esc_html__( 'Edit Row Options', 'gridable' ),
					'edit_column'        => esc_html__( 'Edit Column Options', 'gridable' ),
					'add_column'         => esc_html__( 'Add Column', 'gridable' ),
					'new_column_content' => esc_html__( 'Content', 'gridable' ),
					'column'             => esc_html__( 'Column', 'gridable' ),
					'row'                => esc_html__( 'Row', 'gridable' ),
				) ) ) ?>')
            };
		</script>
		<?php
	}
}
