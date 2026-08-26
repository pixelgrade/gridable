<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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
	<div class="<?php echo esc_attr( $class ); ?>" <?php echo wp_kses_data( $this->sanitize_attribute_fragment( apply_filters( 'gridable_column_attributes', '', $atts, $content ) ) ); ?>>
		<?php
		do_action( 'gridable_before_column_content_render', $atts );

		$gridable_column_content = apply_filters( 'gridable_the_column_content', $content, $atts );

		if ( apply_filters( 'gridable_render_shortcodes_in_column', true, $content, $atts ) ) {
			$gridable_column_content = do_shortcode( $gridable_column_content );
		}

		/*
		 * Print the column content as it comes out of the shortcodes.
		 *
		 * This is post content that WordPress already sanitized on save (wp_filter_post_kses runs
		 * for every user without the `unfiltered_html` capability) and that we are printing inside
		 * `the_content`. Running wp_kses_post() over the *rendered* result strips elements themes
		 * legitimately emit -- `<style>`, `<iframe>`, `<svg>`, `<form>` -- and because kses keeps the
		 * inner text of a stripped tag, a theme's inline gallery CSS ends up rendered as visible page
		 * text. See https://github.com/pixelgrade/gridable/issues/119.
		 *
		 * Sites that want the extra pass can opt back in through the filter below.
		 */
		if ( apply_filters( 'gridable_sanitize_rendered_content', false, 'col', $atts ) ) {
			$gridable_column_content = wp_kses_post( $gridable_column_content );
		}

		echo $gridable_column_content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Already-sanitized post content; see the note above.

		do_action( 'gridable_after_column_content_render' ); ?>
	</div>
<?php
do_action( 'gridable_after_column_render' );
