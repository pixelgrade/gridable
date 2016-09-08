(function () {
	tinymce.PluginManager.add('wpig_grider', function ( editor, url ) {

		function replaceShortcodes( content ) {

			var new_content = wp.shortcode.replace('row', content, function ( args ) {

				var atts = get_attrs_string(args),
					rowSh = wp.template("wpig-grider-row");

				return rowSh({
					content: wpAutoP(args.content),
					classes: 'row mceItem',
					atts: atts
				});
			});

			new_content = wp.shortcode.replace('col', new_content, function ( args ) {

				var atts = get_attrs_string(args),
					colSh = wp.template("wpig-grider-col"),
					col_size = get_col_size(args.attrs.named.size);

				return colSh({
					content: wpAutoP(args.content),
					classes: 'col mceItem ' + col_size,
					atts: atts
				});
			});

			return new_content;
		}

		function restoreShortcodes( content ) {

			if ( typeof( window.QTags ) !== 'undefined' ) {
				window.QTags.closeAllTags( 'content' );
			}

			var div = document.createElement('div');

			div.innerHTML = content;

			// first restore back the row shortcodes
			var rows = div.querySelectorAll('.row.mceItem'),
				to_replaceR = '';

			for ( var indexR = 0; indexR < rows.length; indexR++ ) {

				var row_atts = '';

				if ( typeof rows[indexR].getAttribute('data-sh-attr-cols_nr') !== "null" ) {
					row_atts += ' cols_nr="' + rows[indexR].getAttribute('data-sh-attr-cols_nr') + '"';
				}

				to_replaceR = '[row' + row_atts + ']' + rows[indexR].innerHTML + '[/row]';

				content = content.replace(rows[indexR].outerHTML, to_replaceR);
			}

			var cols = div.querySelectorAll('.col.mceItem'),
				to_replaceC = '';

			for ( var indexC = 0; indexC < cols.length; indexC++ ) {

				var col_atts = '';

				if ( typeof cols[indexC].getAttribute('data-sh-attr-size') !== "null" ) {
					col_atts += ' size="' + cols[indexC].getAttribute('data-sh-attr-size') + '"';
				}

				to_replaceC = '[col' + col_atts + ']' + cols[indexC].innerHTML + '[/col]';

				content = content.replace(cols[indexC].outerHTML, to_replaceC);
			}

			return content;
		}

		editor.on('BeforeSetContent', function ( event ) {

			event.content = removeAutoP(event.content);

			event.content = replaceShortcodes(event.content);

			event.content = wpAutoP(event.content);

			// this.setContent( replaceShortcodes(event.content).replace(/\n/ig,"<br>"), { format:'text' });
			// this.save( { no_events: true } );
		});

		editor.on('PostProcess', function ( event ) {
			if ( event.content ) {
				event.content = restoreShortcodes(event.content);
			}
		});

		// editor.on( 'SetContent', function( e ) {
		// 	console.group('Event: SetContent');
		// 	console.debug(e);
		// 	console.groupEnd('Event: SetContent');
		// });

		//helper functions

		/**
		 * First get all the attributes and save them from cols_nr="4" into `data-attr-sh-cols_nr="4"`
		 *
		 * @param atts
		 * @returns {string}
		 */
		function get_attrs_string( atts ) {
			var atts_string = '';
			if ( typeof atts.attrs.named !== "undefined" && Object.keys(atts.attrs.named).length > 0 ) {
				Object.keys(atts.attrs.named).forEach(function ( key, index ) {
					atts_string += 'data-sh-attr-' + key + '=' + atts.attrs.named[key] + '';
				});
			}

			return atts_string;
		}

		function get_col_class( atts ) {

			if ( typeof atts.attrs.named !== "undefined" && Object.keys(atts.attrs.named).length > 0 ) {
				Object.keys(atts.attrs.named).forEach(function ( key, index ) {
					atts_string += 'data-sh-attr-' + key + '=' + atts.attrs.named[key] + '';
				});
			}

			return atts_string;
		}

		function get_col_size( $size ) {
			if ( typeof gridable_sh_col_classes === "undefined" ) {
				return null;
			}

			if ( typeof gridable_sh_col_classes[ $size ] === "undefined" ) {
				return null;
			}

			return gridable_sh_col_classes[ $size ];
		}


		var wpAutoP = function ( content ) {
			if ( switchEditors && switchEditors.wpautop ) {
				content = switchEditors.wpautop(content);
			}

			return content;
		};

		/**
		 * Strip 'p' and 'br' tags, replace with line breaks.
		 *
		 * Reverses the effect of the WP editor autop functionality.
		 *
		 * @param {string} content Content with `<p>` and `<br>` tags inserted
		 * @return {string}
		 */
		var removeAutoP = function ( content ) {
			if ( switchEditors && switchEditors.pre_wpautop ) {
				content = switchEditors.pre_wpautop(content);
			}

			return content;
		};

	});
})();