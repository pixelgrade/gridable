(function( $ ) {
	'use strict';

	// Insert shortcode into TinyMCE
	$('#gradable-add-row-button').click(function(event) {
		event.preventDefault();

		var shortcode = '<p>[row cols_nr="1"]</p>';

		shortcode += '<p>[col size="12"]</p><p>Our dining atmosphere is casual and comfortable.</p><p>[/col]</p>';

		shortcode += '<p>[/row]</p>';

		console.log(shortcode);
		shortcode = wpAutoP( shortcode );
		console.log(shortcode);
		wp.media.editor.insert( shortcode );
	});

	var wpAutoP = function ( content ) {
		if ( switchEditors && switchEditors.wpautop ) {
			content = switchEditors.wpautop(content);
		}
		return content;
	};

})( jQuery );