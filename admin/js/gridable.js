(function () {
	/**
	 * A TinyMCE plugin which handles the rendering of grid shortcodes
	 * Docs to consider:
	 * Manager: https://www.tinymce.com/docs/api/tinymce/tinymce.editormanager
	 * Events: https://www.tinymce.com/docs/api/tinymce/tinymce.editor/#events
	 */
	tinymce.PluginManager.add('gridable', function ( editor, url ) {
		var toolbar,
			l10n = gridable_params.l10n,
			debug = true

		// The bix X button that removes the entire row shortcode
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
			var column = editor.dom.$(args.element).closest('div.row.gridable-mceItem');
			if ( column.length > 0 ) {
				args.toolbar = toolbar;
				args.selection = column[0];
			}
		});

		/**
		 * Assign buttons for our toolbar
		 * When the editor is initialized, we need to bind the resize events for every resize handler that may appear
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
		 * Whenever the cursor changes it's position the parent may be a grid column, then we need to add handlers
		 */
		editor.on('NodeChange', function ( event ) {
			if ( 'html' === window.getUserSetting('editor') ) {
				return;
			}
			var wrap = editor.dom.$(event.element).closest('.row.gridable-mceItem');
			// if the parent is a column: Add resize handlers
			if ( wrap.length > 0 ) {
				editor.execCommand('gridableAddResize');
			} else { // remove the resize handlers
				editor.execCommand('gridableRemoveResize');
			}
		});

		editor.on('keydown', function ( evt ) {
			if ( 'html' === window.getUserSetting('editor') ) {
				return;
			}

			/**
			 * While pressing enter in editor the cursor should not be allowed the leave the column
			 */
			if ( evt.keyCode == 13 ) { // if Enter is pressed
				var dom = editor.dom,
					selection = editor.selection,
					settings = editor.settings,
					rng = selection.getRng(true),
					container = rng.startContainer,
					parentBlock = dom.getParent(container, dom.isBlock), // Find parent block and setup empty block paddings
					containerBlock = parentBlock ? dom.getParent(parentBlock.parentNode, dom.isBlock) : null;

				// Handle enter in column item
				if ( typeof parentBlock !== "null"
					&& dom.isEmpty(parentBlock)
					&& containerBlock !== null
					&& typeof containerBlock.tagName !== "undefined"
					&& "DIV" === containerBlock.tagName
					&& containerBlock.className.indexOf("col gridable-mceItem") !== -1 ) {
					editor.execCommand("InsertLineBreak", false, evt);
					evt.preventDefault();
					return false;
				}
			}
		});

		/**
		 * Event triggered when the content is set
		 * Here we replace the shortcodes like [row] with <div class="row">
		 */
		editor.on('SetContent', function ( event ) {
			// console.group('GetContent');
			if ( !event.content || 'raw' === event.format || 'savecontent' === event.type || event.selection === true ) {
				return;
			}

			editor.execCommand('gridableRender');
			// console.groupEnd('GetContent');
		});

		/**
		 * When the content is saved we need en ensure that we don't forget resize handlers and rendered shortcodes
		 */
		editor.on('SaveContent', function ( event ) {
			// we must ensure we don't forget any handlers in front-end
			event.content = event.content.replace('/<div class="gridable__handle"></div>/', '');
		});

		/**
		 * After we save the content ensure that the shortcodes are rendered back
		 */

		editor.on('PreProcess', function ( event ) {
			if ( 'html' === window.getUserSetting('editor') ) {
				return;
			}

			editor.execCommand('gridableRestore');
		});

		/**
		 * This function turns the grid shortcodes into HTML
		 *
		 * [row][/row] will turn into <div class="row"></div>
		 *
		 * @param content
		 * @returns {*}
		 */
		editor.addCommand('gridableRender', function () {
			// console.group('gridableRender');
			var content = this.dom.doc.body.innerHTML;

			if ( typeof content === "undefined" ) {
				return;
			}
			// first we need to strip grid shortcodes from p's
			content = remove_p_around_shortcodes( content );
			// same for cols
			content = maybe_replace_columns(content);

			// now replace row shortcodes with their HTML if there are any
			content = maybe_replace_rows(content);

			// event.content = content;
			this.dom.doc.body.innerHTML = content;
			// console.groupEnd('gridableRender');
		});

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
		editor.addCommand('gridableRestore', function () {
			// console.group('gridableRestore');

			// hold all the content inside a HTML element.This way we keep it safe
			// var content_process = this.dom.create('DIV', {}, event.content);
			var content_process = this.dom.doc.body,
				restore_needed = false;

			if ( content_process.className.indexOf('gridable--resize-handlers-on') !== -1 ) {
				editor.execCommand('gridableRemoveResize');
			}

			content_process.innerHTML = content_process.innerHTML.replace(/(<p>&nbsp;<\/p>)/gi, '<br />');

			// get all the columns inside the editor
			var columns = content_process.querySelectorAll('.col.gridable-mceItem'),
				columnReplacement = '';

			for ( var columnIndex = 0; columnIndex < columns.length; columnIndex++ ) {
				// create a new shortcode string like [col size="6"]
				var columnReplacement = wp.shortcode.string({
					tag: 'col',
					attrs: {size: columns[columnIndex].getAttribute('data-sh-col-attr-size')},
					content: columns[columnIndex].innerHTML
				});

				// now replace the column html with the [col] shortcode
				content_process.innerHTML = content_process.innerHTML.replace(columns[columnIndex].outerHTML, columnReplacement);
				restore_needed = true;
			}

			// first restore back the row shortcodes
			var rows = content_process.querySelectorAll('.row.gridable-mceItem'),
				rowReplacement = '';

			for ( var rowIndex = 0; rowIndex < rows.length; rowIndex++ ) {
				// this is the shortcode representation of the row
				var rowReplacement = wp.shortcode.string({
					tag: 'row',
					attrs: {cols_nr: rows[rowIndex].getAttribute('data-sh-row-attr-cols_nr')},
					content: rows[rowIndex].innerHTML
				});

				// replace the row html with the shortcode
				content_process.innerHTML = content_process.innerHTML.replace(rows[rowIndex].outerHTML, rowReplacement);
				restore_needed = true;
			}

			if ( restore_needed ) {
				// @TODO find a better way to save the restored content without rendering it
				// this.setContent(content_process.innerHTML, { no_events: true});
				content_process = this.dom.doc.body.innerHTML = content_process.innerHTML;
			}
			// console.groupEnd('gridableRestore');
		});

		/**
		 * Function to add Column Resize Handlers and bound events
		 */
		editor.addCommand('gridableAddResize', function () {
			var $body = this.dom.doc.body;
			// if the handlers are already here we quit
			if ( $body.className.indexOf('gridable--resize-handlers-on') !== -1 ) {
				return;
			}

			var $columns = editor.dom.$('.col.gridable-mceItem'),
				handle = wp.html.string({
					tag: 'div',
					attrs: {
						class: "gridable__handle"
						// unselectable: "true"
					}
				});

			if ( $columns.length > 0 ) {
				$columns.each(function ( i, col ) {
					var current_handler = editor.$(this).children('.gridable__handle');

					if ( current_handler.length < 1 ) {
						editor.$(col).append(handle);
					}
				});
				$body.classList.add('gridable--resize-handlers-on');
			}

			var handlers = editor.dom.$('.gridable__handle');

			handlers.on('mousedown', function ( e ) {
				console.log('handler mouse down');
				e.preventDefault();
			});

			handlers.on('mousemove', function ( e ) {
				console.log('handler mousemove');
				e.preventDefault();
			});

			handlers.on('mouseup mouseleave', function ( e ) {
				console.log('handler mouse out');
			});
		});

		editor.addCommand('gridableRemoveResize', function () {
			var $body = this.dom.doc.body,
				resize_handlers = this.dom.$('.gridable__handle');

			if ( resize_handlers.length < 1 ) {
				return;
			}

			this.dom.remove(resize_handlers);
			$body.classList.remove('gridable--resize-handlers-on');
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

			// This catches anything like <p>[row] [col]</p> or <p>[row]</p>
			content = content.replace(/<p[^>]*>\s*(\[\s*row[^\]]*\])\s*(\[\s*col[^\]]*\])?\s*<\s*\/p\s*>/gmi, '$1$2');

			// This catches anything like <p>[row] [col] some text </p> or <p>[row] some text</p> and replaces it with [row][col]<p>some text</p> or [row]<p>some text</p>
			content = content.replace(/<p[^>]*>\s*(\[\s*row[^\]]*\])\s*(\[\s*col[^\]]*\])?(.*?)<\s*\/p\s*>/gmi, '$1$2<p>$3</p>');

			// This catches anything like <p>[col] some text </p> and replaces it with [col]<p> some text</p>
			content = content.replace(/<p[^>]*>\s*(\[\s*col[^\]]*\])(.*?)<\s*\/p\s*>/gmi, '$1<p>$2</p>');

			/** Ending shortcodes or Ending and Opening **/

			// This catches anything like <p>[/col] [/row]<p> or <p>[/col</p> or <p>[/row]</p>
			content = content.replace(/<p[^>]*>\s*(\[\s*\/col[^\]]*\])?\s*(\[\s*\/row[^\]]*\])?\s*<\s*\/p\s*>/gmi, '$1$2');

			// This catches anything like <p>[/col] [col]<p>
			content = content.replace(/<p[^>]*>\s*(\[\s*\/col[^\]]*\])\s*(\[\s*col[^\]]*\])\s*<\s*\/p\s*>/gmi, '$1$2');

			// This catches anything like <p>[/col] [col] some text<p> and replaces it with [/col][col]<p>some text</p>
			content = content.replace(/<p[^>]*>\s*(\[\s*\/col[^\]]*\])\s*(\[\s*col[^\]]*\])(.*?)<\s*\/p\s*>/gmi, '$1$2<p>$3</p>');

			// This catches anything like <p>[/row] [row]<p>
			content = content.replace(/<p[^>]*>\s*(\[\s*\/row[^\]]*\])\s*(\[\s*row[^\]]*\])\s*<\s*\/p\s*>/gmi, '$1$2');

			// This catches anything like <p>[/row] [row] some text<p> and replaces it with [/row] [row]<p>some text</p>
			content = content.replace(/<p[^>]*>\s*(\[\s*\/row[^\]]*\])\s*(\[\s*row[^\]]*\])(.*?)<\s*\/p\s*>/gmi, '$1$2');

			// This is a fail safe in case there is a stranded </p>
			// This catches anything like [row]</p> or [row] [col]</p>
			content = content.replace(/(\[\s*row[^\]]*\])\s*(\[\s*col[^\]]*\])?\s*<\s*\/p\s*>/gmi, '$1$2');
			// This catches anything like [col]</p>
			content = content.replace(/(\[\s*col[^\]]*\])\s*<\s*\/p\s*>/gmi, '$1');

			return content;
		};

		/**
		 * Render [row] shortcodes
		 * @param content
		 * @returns {*}
		 */
		function maybe_replace_rows( content ) {
			var next = wp.shortcode.next('row', content);

			if ( typeof next !== "undefined" ) {

				var row = getRowTemplate({
					tag: "row",
					content: next.shortcode.content,
					attrs: next.shortcode.attrs
				});

				var new_content = content.replace(next.content, row);

				// for recursivity, try again
				new_content = maybe_replace_rows(new_content);

				return new_content;
			}
			return content;
		}

		/**
		 * Render columns shortcodes
		 * @param content
		 * @returns {*}
		 */
		function maybe_replace_columns( content ) {

			//content = remove_p_around_shortcodes(content);

			var next = wp.shortcode.next('col', content);

			if ( typeof next !== "undefined" ) {

				// get the HTML template of a column
				var col = getColTemplate({
					tag: "col",
					content: next.shortcode.content,
					attrs: next.shortcode.attrs
				});

				var new_content = content.replace(next.content, col);

				// in case of inner columns, try again
				new_content = maybe_replace_columns(new_content);

				return new_content;
			}

			return content;
		}

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
		function wpAutoP( content ) {
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
		function removeAutoP( content ) {
			if ( switchEditors && switchEditors.pre_wpautop ) {
				content = switchEditors.pre_wpautop(content);
			}
			return content;
		};

		/** Development functions, they can be removed in production **/

		/**
		 * For the moment just switch editors and they will take care
		 */
		var clearfix = function () {
			switchEditors.go('content', 'html');
			switchEditors.go('content', 'tmce');
		};
	});
})();