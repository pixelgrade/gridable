(function () {
	/**
	 * A TinyMCE plugin which handles the rendering of grid shortcodes
	 */
	tinymce.PluginManager.add('gridable', function ( editor, url ) {

		if ( typeof  gridable_params === "undefined" ) {
			return false;
		}

		var toolbar,
			l10n = gridable_params.l10n;

		// the bix X button that removes the entre row shortcode
		editor.addButton('gridable_row_remove', {
			tooltip: l10n.remove_row,
			icon: 'dashicon dashicons-no',
			onclick: function ( event ) {
				// first get the current selected node and search for his "row" parent
				var node = editor.selection.getNode(),
					wrap = editor.$(node).closest('.row.gridable-mceItem');

				// now if there is a parent row, also remove the surrounding <p> tags
				if ( wrap ) {
					if ( wrap.nextSibling ) {
						editor.selection.select(wrap.nextSibling);
					} else if ( wrap.previousSibling ) {
						editor.selection.select(wrap.previousSibling);
					} else {
						editor.selection.select(wrap.parentNode);
					}

					editor.selection.collapse(true);
					editor.dom.remove(wrap);
				} else {
					editor.dom.remove(node);
				}
			}
		});

		// @TODO the edit row button should open a modal with row attributes options
		editor.addButton('gridable_edit_row', {
			tooltip: l10n.edit_row,
			icon: 'dashicon dashicons-edit',
			onclick: function ( i ) {
				var node = editor.selection.getNode(),
					wrap = editor.$(node).parents('.row.gridable-mceItem');
			}
		});

		/**
		 * The Add Column button comes with a few rules:
		 *
		 * * A row suppports only 6 columns
		 * * When adding a new column take the space from the biggest one
		 *
		 */
		editor.addButton('gridable_add_col', {
			tooltip: l10n.add_column,
			icon: 'dashicon dashicons-welcome-add-page',
			onclick: function ( event ) {
				var node = editor.selection.getNode(),
					wrap = editor.$(node).closest('.row.gridable-mceItem'),
					columns = wrap.find('.col.gridable-mceItem'),
					new_size = 0;

				if ( columns.length > 0 ) {
					columns.each(function ( i, el ) {
						var current_size = editor.$(el).attr('data-sh-col-attr-size');

						if ( current_size > 2 ) {
							editor.$(el).attr('data-sh-col-attr-size', current_size - 2);
							new_size += 2;
						}
					});
				}

				if ( new_size === 0 ) {
					new_size = 12; // asta e
				}

				/**
				 * Create a new html template with the new column and append it to the current editing row
				 */
				var tmp = getColTemplate({
					attrs: {named: {size: new_size.toString()}},
					size: new_size.toString(),
					content: l10n.new_column_content
				});

				node = editor.dom.create('DIV', {}, tmp);

				wrap[0].appendChild(node.children[0]);
			}
		});

		/**
		 * Create the toolbar with the controls for row
		 */
		editor.on('wptoolbar', function ( args ) {
			if ( args.element.parentElement.nodeName === 'DIV' && args.element.parentElement.className.indexOf('gridable-mceItem') !== -1 ) {

				var parent = editor.$(args.element).parents('.row.gridable-mceItem');

				if ( typeof parent[0] === "undefined" ) {
					return false;
				}

				args.toolbar = toolbar;
				args.selection = parent[0];
			}
		});

		/**
		 * Assign buttons for our toolbar
		 */
		editor.once('preinit', function () {
			if ( editor.wp && editor.wp._createToolbar ) {
				toolbar = editor.wp._createToolbar([
					'gridable_add_col',
					// 'gridable_edit_row',
					'gridable_row_remove'
				]);
			}
		});

		/**
		 * While pressing enter in editor the cursor should not be allowd the leave the coulmn
		 */
		editor.on('keydown', function ( evt ) {

			// Inserts a BR element if the forced_root_block option is set to false or empty string
			function insertBr( ev ) {
				editor.execCommand("InsertLineBreak", false, ev);
			}

			if ( evt.keyCode == 13 ) {

				var dom = editor.dom, selection = editor.selection, settings = editor.settings;

				var rng = selection.getRng(true);

				var container = rng.startContainer;

				// Find parent block and setup empty block paddings
				var parentBlock = dom.getParent(container, dom.isBlock);
				var containerBlock = parentBlock ? dom.getParent(parentBlock.parentNode, dom.isBlock) : null;

				// Handle enter in column item
				if ( typeof parentBlock!== "null"
					&& dom.isEmpty(parentBlock)
					&& containerBlock !== null
					&& typeof containerBlock.tagName !== "undefined"
					&& "DIV" === containerBlock.tagName
					&& containerBlock.className === "col gridable-mceItem grid__item" ) {
					insertBr(evt);
					evt.preventDefault();
					return false;
				}
			}
		});

		/**
		 * This function turns the grid shortcodes into HTML
		 *
		 * [row][/row] will turn into <div class="row"></div>
		 *
		 * @param content
		 * @returns {*}
		 */
		function replaceShortcodes( content ) {

			//console.group('replace');

			// first we need to strip grid shortcodes from p's
			content = remove_p_around_shortcodes( content );

			var new_content = wp.shortcode.replace('row', content, function ( args ) {
				var row = getRowTemplate(args);
				return row;
			});

			 new_content = wp.shortcode.replace('col', new_content, function ( args ) {
				var col = getColTemplate(args);
				return col;
			});

			// console.groupEnd('replace');
			return new_content;
		}

		/**
		 * This function must restore the shortcodes from the rendering state
		 *
		 * Since we are handling html we rather create a DOM element and use its innerHTML as parsing method
		 *
		 * <div class="row"></div> will turn into [row][/row]
		 *
		 * @param content
		 * @returns {*|string}
		 */
		function restoreShortcodes( content ) {

			console.group('restore');

			var brElm =  wp.html.string({ tag: 'br'});
			// hold all the content inside a div.innerHTML this way we keep it safe
			var div = document.createElement('div');
			div.innerHTML = content;

			var cols = div.querySelectorAll('.col.gridable-mceItem'),
				to_replaceC = '';

			for ( var indexC = 0; indexC < cols.length; indexC++ ) {

				var to_replaceC = wp.shortcode.string({
					tag: 'col',
					attrs: {size: cols[indexC].getAttribute('data-sh-col-attr-size')},
					content: brElm + cols[indexC].innerHTML
				});

				div.innerHTML = div.innerHTML.replace(cols[indexC].outerHTML, to_replaceC);
			}

			// first restore back the row shortcodes
			var rows = div.querySelectorAll('.row.gridable-mceItem'),
				to_replaceR = '';

			for ( var indexR = 0; indexR < rows.length; indexR++ ) {

				// this is the shortcode representation of the row
				var to_replaceR = wp.shortcode.string({
					tag: 'row',
					attrs: {cols_nr: rows[indexR].getAttribute('data-sh-row-attr-cols_nr')},
					content: rows[indexR].innerHTML
				});

				div.innerHTML = div.innerHTML.replace(rows[indexR].outerHTML, to_replaceR);
			}
			// console.debug( div.innerHTML );

			console.groupEnd('restore');
			return div.innerHTML;
		}

		editor.on('BeforeSetContent', function ( event ) {
			event.content = replaceShortcodes(event.content);
		});

		editor.on('PostProcess', function ( event ) {
			if ( event.content ) {
				event.content = restoreShortcodes(event.content);
			}
		});

		/** === Helper functions ==== **/

		/**
		 * Try to keep our shortcodes clear of wraping P tags
		 * This is very important since a [row] shortcode will turn into a <div class="row">
		 *     In this case there is now way we can have a <p>[row]</p> turned into <p><div class="row"></p>
		 *     The world will end then.
		 *
		 * @param content
		 * @returns {*}
		 */
		var remove_p_around_shortcodes = function ( content ) {
			/** Starting shortcodes **/
			content = content.replace( /<p>\[+row (.*)\]<\/p>/gmi, '[row $1]');
			content = content.replace( /<p>\[+col (.*)\]<\/p>/gmi, '[col $1]');

			content = content.replace( /<p>\[+row (.*)\]/gmi, '[row $1]');
			content = content.replace( /<p>\[+col (.*)\]/gmi, '[col $1]');

			// you cannot start a column with a closing </p>
			content = content.replace( /\[+row (.*)\]<\/p>/gmi, '[row $1]');
			content = content.replace( /\[+col (.*)\]<\/p>/gmi, '[col $1]');

			/** Ending shortcodes **/
			content = content.replace( /<p>\[\/+row\]<\/p>/gmi, '[/row]');
			content = content.replace( /<p>\[\/+col\]<\/p>/gmi, '[/col]');

			content = content.replace( /\[\/+row\]<\/p>/gmi, '[/row]');
			content = content.replace( /\[\/+col\]<\/p>/gmi, '[/col]');

			content = content.replace( /<p>\[\/+row\]/gmi, '[/row]');
			content = content.replace( /<p>\[\/+col\]/gmi, '[/col]');

			return content;
		};

		/**
		 * Returns the html template of a [row] with `cols_nr` attribute
		 *
		 * @param args
		 * @returns {*}
		 */
		function getRowTemplate( args ) {
			var rowSh = wp.template("gridable-grider-row"),
				atts = get_attrs_string('row', args);

			return rowSh({
				content: args.content, //wpAutoP(args.content),
				classes: 'row gridable-mceItem',
				atts: atts
			});
		}

		/**
		 * Returns the html template of a [col] with `size` attribute
		 *
		 * @param args
		 * @returns {*}
		 */
		function getColTemplate( args ) {
			var atts = get_attrs_string('col', args),
				colSh = wp.template("gridable-grider-col");

			return colSh({
				content: args.content,
				classes: 'col gridable-mceItem ',
				atts: atts
			});
		}

		/**
		 * First get all the attributes and save them from cols_nr="4" into `data-attr-sh-cols_nr="4"`
		 *
		 * @param tag
		 * @param atts
		 * @returns {string}
		 */
		function get_attrs_string( tag, atts ) {
			var atts_string = '';

			if ( typeof atts.attrs.named !== "undefined" && Object.keys(atts.attrs.named).length > 0 ) {
				Object.keys(atts.attrs.named).forEach(function ( key, index ) {
					atts_string += 'data-sh-' + tag + '-attr-' + key + '=' + atts.attrs.named[key] + '';
				});
			}

			return atts_string;
		}

		/**
		 * Avoid this
		 *
		 * @param content
		 * @returns {*}
		 */
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

		/**
		 * For the moment just switch editors and they will take care
		 */
		var clearfix = function () {
			// if ( switchEditors && switchEditors.wpautop ) {
			// 	content = switchEditors.wpautop(content);
			// }
			// return content;

			switchEditors.go('content', 'html');
			switchEditors.go('content', 'tmce');
		};
	});
})();