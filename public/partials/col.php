<?php
/**
 * This is the col template output
 *
 * Variables available:
 *
 * - $content is the content between the [col]$content[/col] tags –– if you want inner shortcodes to run, use do_shortcode
 *
 * - $size (int) The size of the columnsset by user as attribute in [col size="6"]
 *
 * - $classes (array) The CSS classes array and the result of the `gridable_column_class` filter, so we encourage you to use it
 *
 * - $class (string) The string representing the `class=""` attribute
 *
 * - $atts (array) All the shortcode attributes are stored in this array as key -> value
 *
 */

do_action( 'gridable_before_column_render' ); ?>
	<div <?php echo $class ?> <?php echo apply_filters( 'gridable_column_attributes', '', $atts, $content ); ?>>
		<?php
		do_action( 'gridable_before_column_content_render', $atts );

		$column_content = apply_filters( 'gridable_the_column_content', $content, $atts );

		if ( apply_filters( 'gridable_render_shortcodes_in_column', true, $content, $atts ) ) {
			echo do_shortcode( $column_content );
		} else {
			echo $column_content;
		}

		do_action( 'gridable_after_column_content_render' ); ?>
	</div>
<?php
do_action( 'gridable_after_column_render' );