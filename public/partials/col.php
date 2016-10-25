<?php
/**
 * This is the col template output
 * $content is the content between the [col]$content[/col] tags
 * $size is the number of columns set by user as attribute in [col size="12"]
 */?>
<div <?php echo $class; ?>>
	<?php echo do_shortcode( $content ); ?>
</div>