(function( $ ) {
	'use strict';

	// Insert shortcode into TinyMCE
	$('.gridable-insert-row-button').click(function(event) {
		event.preventDefault();
		/**
		 * Create one row shortcode with one column inside
		 */
		var column_content = wp.html.string( {
			tag: 'p',
			content: gridable_editor_params.new_column_content
		});

		var column = wp.html.string({
			tag: 'div',
			attrs: {
				class: "col gridable-mceItem grid__item",
				"data-sh-column-attr-size": "6",
				"data-mce-placeholder": "1",
				"contenteditable": "true"
			},
			content: column_content
		});

		var handle = wp.html.string({
			tag: 'div',
			attrs: {
				class: "gridable__handle"
			}
		})

		column += wp.html.string({
			tag: 'div',
			attrs: {
				class: "col gridable-mceItem grid__item",
				"data-sh-column-attr-size": "6",
				"data-mce-placeholder": "1",
				"contenteditable": "true"
			},
			content: handle + column_content
		});

		var row = wp.html.string({
			tag: 'div',
			attrs: {
				class: "row gridable-mceItem gridable gridable--grid grid",
				"data-sh-row-attr-cols_nr": "2",
				"data-gridable-row": "1",
				"data-mce-placeholder": "1",
				"contenteditable": "false"
			},
			content: column
		});

		/**
		 * Insert the new shortcode in the editor
		 */
		wp.media.editor.insert( row );

		function wpAutoP( content ) {
			if ( switchEditors && switchEditors.wpautop ) {
				content = switchEditors.wpautop(content);
			}
			return content;
		};

	});
})( jQuery );