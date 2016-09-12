(function () {
	tinymce.PluginManager.add('wpig_grider', function ( editor, url ) {
		var toolbar;

		editor.addButton( 'gridable_row_remove', {
			tooltip: 'Remove Row',
			icon: 'dashicon dashicons-no',
			onclick: function( event ) {
				var node = editor.selection.getNode(),
					wrap = editor.$( node ).parents( '.row.gridable-mceItem');

				if ( wrap ) {
					if ( wrap.nextSibling ) {
						editor.selection.select( wrap.nextSibling );
					} else if ( wrap.previousSibling ) {
						editor.selection.select( wrap.previousSibling );
					} else {
						editor.selection.select( wrap.parentNode );
					}

					editor.selection.collapse( true );
					editor.dom.remove( wrap );
				} else {
					editor.dom.remove( node );
				}

				editor.nodeChanged();
				editor.undoManager.add();

			}
		} );

		editor.addButton( 'gridable_edit_row', {
			tooltip: 'Edit Row',
			icon: 'dashicon dashicons-edit',
			onclick: function( i ) {
				var node = editor.selection.getNode(),
					wrap = editor.$( node ).parents( '.row.gridable-mceItem');

				editor.nodeChanged();
				editor.undoManager.add();
			}
		} );

		editor.addButton( 'gridable_add_col', {
			tooltip: 'Add Column',
			icon: 'dashicon dashicons-welcome-add-page',
			onclick: function( event ) {
				var node = editor.selection.getNode(),
					wrap = editor.$( node ).parents( '.row.gridable-mceItem');

				var columns = wrap.find( '.col.gridable-mceItem' );

				var new_size = 0;

				if ( columns.length > 0 ) {
					columns.each(function ( i, el ) {
						var current_size = editor.$(el).attr('data-sh-attr-size');

						if ( current_size > 2 ) {
							editor.$(el).attr('data-sh-attr-size', current_size - 2);
							new_size += 2;
						}

						// @TODO cmon be smart
						var current_class = get_col_size( current_size );

						var new_class = get_col_size(new_size);

						el.className = el.className.replace( current_class, new_class );

					});
				}

				if ( new_size === 0 ) {
					new_size = 12; // asta e
				}

				var tmp = getColTemplate({ attrs: { named: { size: new_size.toString() }}, size: new_size.toString(), content: "<p>The new column</p>" } );

				node =editor.dom.create('DIV', {},tmp);

				wrap[0].appendChild( node.children[0] );

				editor.nodeChanged();
				editor.undoManager.add();
				switchEditors.go( 'content', 'html' );
				switchEditors.go( 'content', 'tmce' );
			}
		} );

		editor.once( 'preinit', function() {
			if ( editor.wp && editor.wp._createToolbar ) {
				toolbar = editor.wp._createToolbar( [
					'gridable_add_col',
					'gridable_edit_row',
					'gridable_row_remove'
				] );
			}
		} );

		editor.on( 'wptoolbar', function( args ) {
			if ( args.element.parentElement.nodeName === 'DIV' && args.element.parentElement.className.indexOf( 'gridable-mceItem' ) !== -1 ) {

				var parent = editor.$( args.element ).parents( '.row.gridable-mceItem');

				if ( typeof parent[0] === "undefined" ) {
					return false;
				}

				args.toolbar = toolbar;
				args.selection = parent[0];
			}
		} );


		function replaceShortcodes( content ) {

			var new_content = wp.shortcode.replace('row', content, function ( args ) {
				return getRowTemplate( args );
			});

			new_content = wp.shortcode.replace('col', new_content, function ( args ) {
				return getColTemplate( args );
			});

			return new_content;
		}

		function getRowTemplate( args ) {
			var rowSh = wp.template("wpig-grider-row"),
				atts = get_attrs_string(args);

			return rowSh({
				content: wpAutoP(args.content),
				classes: 'row mceItem gridable-mceItem',
				atts: atts
			});
		}

		function getColTemplate( args ) {
			var atts = get_attrs_string(args),
				colSh = wp.template("wpig-grider-col"),
				col_size = get_col_size(args.size || args.attrs.named.size);

			return colSh({
				content: wpAutoP(args.content),
				classes: 'col mceItem  gridable-mceItem ' + col_size,
				atts: atts
			});
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

				to_replaceR = '<p>[row' + row_atts + ']</p>' + rows[indexR].innerHTML + '<p>[/row]</p>';

				content = content.replace(rows[indexR].outerHTML, to_replaceR);
			}

			var cols = div.querySelectorAll('.col.mceItem'),
				to_replaceC = '';

			for ( var indexC = 0; indexC < cols.length; indexC++ ) {

				var col_atts = '';

				if ( typeof cols[indexC].getAttribute('data-sh-attr-size') !== "null" ) {
					col_atts += ' size="' + cols[indexC].getAttribute('data-sh-attr-size') + '"';
				}

				to_replaceC = '<p>[col' + col_atts + ']</p><p>' + cols[indexC].innerHTML + '</p><p>[/col]</p>';

				content = content.replace(cols[indexC].outerHTML, to_replaceC);
			}

			return content;
		}

		editor.on('BeforeSetContent', function ( event ) {

			event.content = removeAutoP(event.content);

			event.content = replaceShortcodes(event.content);

			event.content = wpAutoP(event.content);
		});

		editor.on('PostProcess', function ( event ) {
			if ( event.content ) {
				event.content = restoreShortcodes(event.content);
			}
		});

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