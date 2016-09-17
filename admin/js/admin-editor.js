(function( $ ) {
	'use strict';

	// Insert shortcode into TinyMCE
	$('#gradable-add-row-button').click(function(event) {
		event.preventDefault();

		var shortcode = '<p>[row cols_nr="1"]</p>';

		shortcode += '<p>[col size="12"]</p><p>' + gridable_editor_params.new_column_content + '</p><p>[/col]</p>';

		shortcode += '<p>[/row]</p><p></p><p></p>';

		wp.media.editor.insert( shortcode );

		clearfix();
	});

	var clearfix = function (  ) {
		// if ( switchEditors && switchEditors.wpautop ) {
		// 	content = switchEditors.wpautop(content);
		// }
		// return content;


		switchEditors.go( 'content', 'html' );
		switchEditors.go( 'content', 'tmce' );
	};

})( jQuery );