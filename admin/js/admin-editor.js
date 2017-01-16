(function( $ ) {
	'use strict';

	// Insert shortcode into TinyMCE
	$('#gradable-add-row-button').click(function(event) {
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
				"data-sh-col-attr-size": "6",
				"data-mce-placeholder": "1"
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
				"data-sh-col-attr-size": "6",
				"data-mce-placeholder": "1"
			},
			content: handle + column_content
		});

		var row = wp.html.string({
			tag: 'div',
			attrs: {
				class: "row gridable-mceItem gridable gridable--grid grid",
				"data-sh-row-attr-cols_nr": "2",
				"data-gridable-row": "1",
				"data-mce-placeholder": "1"
			},
			content: column
		});

		/**
		 * Insert the new shortcode in the editor
		 */
		wp.media.editor.insert( row );

		// if the new added row is the last in the editor we may have a problem, we cannot click out of this grid
		// for this case only we add a further P element just to have something to click

		var cursor_position = tinyMCE.activeEditor.selection.getNode();

		// get the last added row based on the last cursor position
		var last_added_row = tinyMCE.activeEditor.$(cursor_position).closest('.row.gridable-mceItem');

		// now if this row does not have an element after it, we need to add a ghost <p> so we can click on it
		if ( last_added_row[0].nextElementSibling === null ) {
			var bogus_node = tinyMCE.activeEditor.dom.create('p', {}, '<br data-mce-bogus="1">');
			last_added_row[0].parentNode.insertBefore(bogus_node, last_added_row[0].nextElementSibling);

		}

		function wpAutoP( content ) {
			if ( switchEditors && switchEditors.wpautop ) {
				content = switchEditors.wpautop(content);
			}
			return content;
		};

	});
})( jQuery );