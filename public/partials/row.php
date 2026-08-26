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
			$gridable_row_content = do_shortcode( $gridable_row_content );
		}

		/*
		 * Print the row content as it comes out of the shortcodes.
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
		if ( apply_filters( 'gridable_sanitize_rendered_content', false, 'row', $atts ) ) {
			$gridable_row_content = wp_kses_post( $gridable_row_content );
		}

		echo $gridable_row_content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Already-sanitized post content; see the note above.

		do_action( 'gridable_after_row_content_render' ); ?>
	</div>
<?php
do_action( 'gridable_after_row_render' );
