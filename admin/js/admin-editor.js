(function( $ ) {
	'use strict';

	// Insert shortcode into TinyMCE
	$('#gradable-add-row-button').click(function(event) {
		event.preventDefault();

		var shortcode = '<p>[row cols_nr="1"]</p>';

		shortcode += '<p>[col size="12"]</p><p>' + gridable_editor_params.new_column_content + '</p><p>[/col]</p>';

		shortcode += '<p>[/row]</p><p></p><p></p>';

		// switchEditors.go( 'content', 'html' );
		wp.media.editor.insert( shortcode );

		// switchEditors.go( 'content', 'tmce' );
		// clearfix();
	});

	var clearfix = function (  ) {
		// if ( switchEditors && switchEditors.wpautop ) {
		// 	content = switchEditors.wpautop(content);
		// }
		// return content;

	};

})( jQuery );