<?php
/**
 * This is the row template output
 *
 * Variables available:
 *
 * - $content is the content between the [row]$content[/row] tags –– if you want inner shortcodes to run, use do_shortcode
 *
 * - $cols_nr (int) The number of columns set by user as attribute in [row cols_nr="2"]
 *
 * - $class (string) The CSS class result of the `gridable_sh_row_classes` filter, so we encourage you to use it
 *
 * - $atts (array) All the shortcode attributes are stored in this array as key -> value
 *
 */

do_action( 'gridable_before_row_render' ); ?>
	<div class="<?php echo $class ?>" <?php echo apply_filters( 'gridable_row_attributes', '', $atts, $content ); ?>>
		<?php
		do_action( 'gridable_before_row_content_render' );

		$row_content = apply_filters( 'gridable_the_row_content', $content, $atts );

		if ( apply_filters( 'gridable_render_shortcodes_in_row', true, $content, $atts ) ) {
			echo do_shortcode( $row_content );
		} else {
			echo $row_content;
		}

		do_action( 'gridable_after_row_content_render' ); ?>
	</div>
<?php
do_action( 'gridable_after_row_render' );