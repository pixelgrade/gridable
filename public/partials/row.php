<?php
/**
 * This is the row template output
 * $content is the content between the [row]$content[/row] tags
 * $$cols_nr is the number of columns set by user as attribute in [row cols_nr="2"]
 * @todo make the cols_nr work
 */?>
<div class="gridable gridable--row">
	<?php echo do_shortcode( $content ); ?>
</div>