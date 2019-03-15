(function( $ ) {
	'use strict';

	// Insert shortcode into TinyMCE
	$( document ).on( 'click', '.gridable-insert-row-button', function(event) {
		event.preventDefault();
		/**
		 * Create one row shortcode with one column inside
		 */
		var column_content = wp.html.string( {
			tag: 'p',
			content: gridable_editor_params.new_column_content
		});

		var column = wp.html.string({
			tag: 'section',
			attrs: {
				class: "col gridable-mceItem grid__item",
				"data-sh-column-attr-size": "6",
				"data-mce-placeholder": "1",
				"contenteditable": "true"
			},
			content: column_content
		});

		column += wp.html.string({
			tag: 'section',
			attrs: {
				class: "col gridable-mceItem grid__item",
				"data-sh-column-attr-size": "6",
				"data-mce-placeholder": "1",
				"contenteditable": "true"
			},
			content: column_content
		});

		var row = wp.html.string({
			tag: 'section',
			attrs: {
				class: "row gridable-mceItem gridable gridable--grid grid",
				"data-sh-row-attr-cols_nr": "2",
				"data-gridable-row": "1",
				"data-mce-placeholder": "1",
				"contenteditable": "false"
			},
			content: column
		});

		function addRowShortcodeToText() {
            /**
             * Insert the new shortcode in the Text editor
             */
            var column_shortcode = '[col size="6"]\n\n' + gridable_editor_params.new_column_content + '\n\n[/col]';
            var row_shortcode = '[row cols_nr="2"]' + column_shortcode + column_shortcode + '[/row]';
            window.QTags.insertContent( row_shortcode );
        }

        if ( typeof tinyMCE.activeEditor !== "undefined" && tinyMCE.activeEditor ) {
            /**
			 * Insert the new shortcode in the editor
			 */

            if ( ! tinyMCE.activeEditor.hidden ) {
                tinyMCE.activeEditor.insertContent( row );
                tinyMCE.activeEditor.execCommand('gridableAddResizeHandlers');
            } else {
                addRowShortcodeToText();
            }
        } else {
            addRowShortcodeToText();
        }

		function wpAutoP( content ) {
			if ( switchEditors && switchEditors.wpautop ) {
				content = switchEditors.wpautop(content);
			}
			return content;
		}

	});
})( jQuery );