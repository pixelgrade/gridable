<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * This is the row template output
 *
 * Variables available:
 *
 * - $content is the content between the [row]$content[/row] tags –– if you want inner shortcodes to run, use do_shortcode
 *
 * - $cols_nr (int) The number of columns set by user as attribute in [row cols_nr="2"]
 *
 * - $classes (array) The CSS classes array result of the `gridable_row_class` filter, so we encourage you to use it
 *
 * - $class (string) The string representing the `class=""` attribute
 *
 * - $atts (array) All the shortcode attributes are stored in this array as key -> value
 *
 */

do_action( 'gridable_before_row_render' ); ?>
	<div class="<?php echo esc_attr( $class ); ?>" <?php echo wp_kses_data( $this->sanitize_attribute_fragment( apply_filters( 'gridable_row_attributes', '', $atts, $content ) ) ); ?>>
		<?php
		do_action( 'gridable_before_row_content_render' );

		$gridable_row_content = apply_filters( 'gridable_the_row_content', $content, $atts );

		if ( apply_filters( 'gridable_render_shortcodes_in_row', true, $content, $atts ) ) {
			echo wp_kses_post( do_shortcode( $gridable_row_content ) );
		} else {
			echo wp_kses_post( $gridable_row_content );
		}

		do_action( 'gridable_after_row_content_render' ); ?>
	</div>
<?php
do_action( 'gridable_after_row_render' );
