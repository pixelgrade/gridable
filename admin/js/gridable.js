(function ($, exports) {

	$(document).ready(function () {

		/**
		 * A TinyMCE plugin which handles the rendering of grid shortcodes
		 * Docs to consider:
		 * Manager: https://www.tinymce.com/docs/api/tinymce/tinymce.editormanager
		 * Events: https://www.tinymce.com/docs/api/tinymce/tinymce.editor/#events
		 */
		tinymce.PluginManager.add('gridable', function (editor, url) {
			var toolbar,
				l10n = gridable_params.l10n,
				gridable_resizing = false,
				xStart,
				xLast,
				xEnd,
				nextWidth,
				prevWidth,
				gridStyle,
				gridWidth,
				colWidth,
				debug = true,
				$next,
				$prev;

			// The bix X button that removes the entire row shortcode
			editor.addButton('gridable_row_remove', {
				tooltip: l10n.remove_row,
				icon: 'dashicon dashicons-no',
				onclick: function (event) {
					// first get the current selected node and search for his "row" parent
					var node = editor.selection.getNode(),
						wrap = editor.$(node).closest('.row.gridable-mceItem');

					// now if there is a parent row, also remove the surrounding <p> tags
					if (wrap) {
						if (wrap.nextSibling) {
							editor.selection.select(wrap.nextSibling);
						} else if (wrap.previousSibling) {
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

			/**
			 * The Add Column button comes with a few rules:
			 *
			 * * A row suppports only 6 columns
			 * * When adding a new column take the space from the biggest one
			 *
			 */
			editor.addButton('gridable_add_col', {
				tooltip: l10n.add_column,
				icon: 'dashicon dashicons-plus',
				onclick: function (event) {
					var node = editor.selection.getNode(),
						wrap = editor.$(node).closest('.row.gridable-mceItem'),
						columns = wrap.find('.col.gridable-mceItem'),
						new_size = 0;

					if (columns.length > 0) {
						columns.each(function (i, el) {
							var current_size = editor.$(el).attr('data-sh-column-attr-size');

							if ( current_size > 2 ) {
								editor.$(el).attr('data-sh-column-attr-size', current_size - 2);
								new_size += 2;
								return false;
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
						atts: {size: new_size.toString()},
						size: new_size.toString(),
						content: '<p>' + l10n.new_column_content + '</p>'
					});

					node = editor.dom.create('DIV', {}, tmp);

					wrap[0].appendChild(node.children[0]);
				}
			});

			editor.addButton('gridable_remove_col', {
				tooltip: l10n.remove_column,
				icon: 'dashicon dashicons-minus',
				onclick: function (event) {
					var node = editor.selection.getNode(),
						column = editor.$(node).closest('.col.gridable-mceItem');

					// if (window.confirm('Are you sure you want to remove this column?')) {
						var column_size = editor.$(column).attr('data-sh-column-attr-size');

						if (column[0].previousElementSibling !== null) {
							increase_column_size_with(column_size, column[0].previousElementSibling);
						} else if (column[0].nextElementSibling !== null) {
							increase_column_size_with(column_size, column[0].nextElementSibling);
						} else {
							editor.$(node).closest('.row.gridable-mceItem').remove();
						}
						column.remove();
					// }
				}
			});

			editor.addButton('gridable_row_options', {
				tooltip: l10n.edit_row,
				icon: 'dashicon dashicons-edit',
				onclick: function (event) {

					var node = editor.selection.getNode(),
						row = editor.$(node).closest('.row.gridable-mceItem');

					GridableOptionsModal.open('row', editor, row[0]);
				}
			});

			editor.addButton('gridable_col_options', {
				tooltip: l10n.edit_column,
				icon: 'dashicon dashicons-edit',
				onclick: function (event) {

					var node = editor.selection.getNode(),
						column = editor.$(node).closest('.col.gridable-mceItem');

					GridableOptionsModal.open('column', editor, column[0]);
				}
			});

			editor.addButton('gridable_col_label', {
				text: l10n.column + ':',
				disabled: true,
				role: 'separator'
			});

			editor.addButton('gridable_row_label', {
				text: l10n.row + ':',
				disabled: true,
				role: 'separator'
			});

			/**
			 * Create the toolbar with the controls for row
			 */
			editor.on('wptoolbar', function (args) {
				var selected_row = editor.dom.$(args.element).parents('.row.gridable-mceItem');

				// if a row is focused we display the toolbar and add a CSS class
				if ( selected_row.length > 0 && ( ['P', 'h1', 'H2', 'H3', 'H4', 'H5', 'STRONG', 'SPAN', 'DIV', 'FONT', 'BR'].indexOf(args.element.tagName) !== -1 || args.element.className.indexOf('gridable-mceItem') !== -1 ) ) {
				// if ( selected_row.length > 0 ) {
					args.toolbar = toolbar;
					args.selection = selected_row[0];
					selected_row.addClass('is-focused');
				} else { // we need to ensure that the focused class is removed
					var $rows = editor.dom.$('.row.gridable-mceItem.is-focused');
					if ($rows.length > 0) {
						$rows = $rows.removeClass('is-focused');
					}
				}
			});

			/**
			 * Assign buttons for our toolbar
			 * When the editor is initialized, we need to bind the resize events for every resize handler that may appear
			 */
			editor.once('preinit', function () {
				if (editor.wp && editor.wp._createToolbar) {

					// the fist two options must be the add / remove columns
					var toolbar_buttons = [
						'gridable_col_label',
						'gridable_add_col',
						'gridable_remove_col',
					];

					if ( typeof gridable_column_options !== 'undefined' && Object.keys( gridable_column_options ).length > 1 )  {
						toolbar_buttons.push( 'gridable_col_options' );
					}

					toolbar_buttons.push('|');

					toolbar_buttons.push('gridable_row_label');

					if ( typeof gridable_row_options !== 'undefined' && Object.keys( gridable_row_options ).length > 1 )  {
						// just a separator
						toolbar_buttons.push( 'gridable_row_options' );
					}

					// the remove row button must be the last
					toolbar_buttons.push('gridable_row_remove');

					toolbar = editor.wp._createToolbar( toolbar_buttons );
				}
			});

			/**
			 * Whenever the cursor changes it's position the parent may be a grid column, then we need to add handlers
			 */
			editor.on('NodeChange', function (event) {

				if ('html' === window.getUserSetting('editor')) {
					return;
				}

				// the cursor is not allowed inside the resize handler. in this case it will be moved in the next column
				if ( event.element.className === 'gridable__handle' ) {
					var next_col = editor.dom.$(event.element).closest('.col.gridable-mceItem');
					if ( next_col[0].getElementsByTagName('p').length > 0 ) {
						editor.selection.select( next_col[0].getElementsByTagName('p')[0], true );
					} else {
						editor.selection.select( next_col[0], true );
					}
					editor.selection.collapse(false);
				}

				var wrap = editor.dom.$(event.element).parents('.row.gridable-mceItem');

				// if the parent is a column: Add resize handlers
				if (wrap.length > 0) {
					addResize(wrap);
				}
			});

			editor.on('keydown', function (evt) {
				if ('html' === window.getUserSetting('editor')) {
					return;
				}

				/**
				 * While pressing enter in editor the cursor should not be allowed the leave the column
				 */
				if (evt.keyCode == 13) { // if Enter is pressed
					var dom = editor.dom,
						selection = editor.selection,
						settings = editor.settings,
						rng = selection.getRng(true),
						container = rng.startContainer,
						parentBlock = dom.getParent(container, dom.isBlock), // Find parent block and setup empty block paddings
						containerBlock = parentBlock ? dom.getParent(parentBlock.parentNode, dom.isBlock) : null;

					// Handle enter in column item
					if (typeof parentBlock !== "null"
						&& dom.isEmpty(parentBlock)
						&& containerBlock !== null
						&& typeof containerBlock.tagName !== "undefined"
						&& "DIV" === containerBlock.tagName
						&& containerBlock.className.indexOf("col gridable-mceItem") !== -1) {
						editor.execCommand("InsertLineBreak", false, evt);
						evt.preventDefault();
						return false;
					}
				}
			});

			/**
			 * Event triggered when the content is set
			 * Here we replace the shortcodes like [row] with <section class="row">
			 */
			editor.on('SetContent', function (event) {
				// console.group('GetContent');
				if (!event.content || 'raw' === event.format || 'savecontent' === event.type || event.selection === true) {
					return;
				}

				editor.execCommand('gridableRender');
				// console.groupEnd('GetContent');
			});

			/**
			 * When the content is saved we need en ensure that we don't forget resize handlers and rendered shortcodes
			 */
			editor.on('SaveContent', function (event) {
				// we must ensure we don't forget any handlers in front-end
				event.content = event.content.replace(/<div class=\"gridable__handle\"><\/div>/gm, '');
			});

			/**
			 * After we save the content ensure that the shortcodes are rendered back
			 */
			editor.on('PreProcess', function (event) {
				if ('html' === window.getUserSetting('editor')) {
					return false;
				} else if ( editor.editorCommands.hasCustomCommand('gridableRestore' ) && event.save === true ) {
					editor.editorCommands.execCommand('gridableRestore');
				}
			});

			/**
			 * This function turns the grid shortcodes into HTML
			 *
			 * [row][/row] will turn into <section class="row"></section>
			 *
			 * @param content
			 * @returns {*}
			 */
			editor.addCommand('gridableRender', function () {

				var $save_btn = jQuery('#publishing-action .button');
				$save_btn.attr('disabled', 'disabled');

				// console.group('gridableRender');
				var content = this.dom.doc.body.innerHTML;

				if (typeof content === "undefined") {
					return;
				}
				// first we need to strip grid shortcodes from p's
				content = remove_p_around_shortcodes(content);

				// same for cols
				content = maybe_replace_columns(content);

				// now replace row shortcodes with their HTML if there are any
				content = maybe_replace_rows(content);

				// event.content = content;
				this.dom.doc.body.innerHTML = content;
				// console.groupEnd('gridableRender');

				$save_btn.removeAttr('disabled');
			});

			/**
			 * This function must restore the shortcodes from the rendering state
			 *
			 * Since we are handling html we rather create a DOM element and use its innerHTML as parsing method
			 *
			 * <section class="row"></section> will turn into [row][/row]
			 *
			 * @param content
			 * @returns {*|string}
			 */
			editor.addCommand('gridableRestore', function () {

				var $save_btn = jQuery('#publishing-action .button');
				$save_btn.attr('disabled', 'disabled');

				// console.group('gridableRestore');

				// hold all the content inside a HTML element.This way we keep it safe
				// var content_process = this.dom.create('DIV', {}, event.content);
				var content_process = this.dom.doc.body,
					restore_needed = false;

				if (content_process.className.indexOf('gridable--resize-handlers-on') !== -1) {
					editor.execCommand('gridableRemoveResize');
				}

				content_process.innerHTML = content_process.innerHTML.replace(/(<p>&nbsp;<\/p>)/gi, '<br />');

				// get all the columns inside the editor
				var columns = content_process.querySelectorAll('.col.gridable-mceItem'),
					columnReplacement = '';

				for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
					// create a new shortcode string like [col size="6"]
					var columnReplacement = wp.shortcode.string({
						tag: 'col',
						// attrs: {size: columns[columnIndex].getAttribute('data-sh-column-attr-size')},
						attrs: get_valid_column_attrs(columns[columnIndex]),
						content: columns[columnIndex].innerHTML.trim()
					});

					// now replace the column html with the [col] shortcode
					content_process.innerHTML = content_process.innerHTML.replace(columns[columnIndex].outerHTML, columnReplacement);
					restore_needed = true;
				}

				// first restore back the row shortcodes
				var rows = content_process.querySelectorAll('.row.gridable-mceItem'),
					rowReplacement = '';

				for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
					// this is the shortcode representation of the row
					var rowReplacement = wp.shortcode.string({
						tag: 'row',
						attrs: get_valid_row_attrs(rows[rowIndex]),
						content: rows[rowIndex].innerHTML.trim()
					});

					// replace the row html with the shortcode
					content_process.innerHTML = content_process.innerHTML.replace(rows[rowIndex].outerHTML, rowReplacement);
					restore_needed = true;
				}

				if (restore_needed) {
					// @TODO find a better way to save the restored content without rendering it
					// this.setContent(content_process.innerHTML, { no_events: true});
					content_process = this.dom.doc.body.innerHTML = content_process.innerHTML;
					// console.debug( content_process );
				}
				// console.groupEnd('gridableRestore');

				$save_btn.removeAttr('disabled');
			});


			function get_valid_row_attrs(el) {
				var to_return = {};

				var needle = 'data-sh-row-attr-';

				Array.prototype.slice.call(el.attributes).forEach(function (item) {
					var attr_name = item.name.replace(needle, '');

					if (item.name.indexOf(needle) !== -1 && attr_name in gridable_row_options) {

						if (item.value !== '') {
							to_return[attr_name] = item.value;
						} else if (typeof gridable_row_options[attr_name].default !== 'undefined') {
							to_return[attr_name] = gridable_row_options[attr_name].default;
						}
					}
				});

				return to_return;
			}


			function get_valid_column_attrs(el) {

				var to_return = {};
				var needle = 'data-sh-column-attr-';

				Array.prototype.slice.call(el.attributes).forEach(function (item) {

					var attr_name = item.name.replace(needle, '');

					if (item.name.indexOf(needle) !== -1 && attr_name in gridable_column_options) {

						if (item.value !== '') {
							to_return[attr_name] = item.value;
						} else if (typeof gridable_column_options[attr_name].default !== 'undefined') {
							to_return[attr_name] = gridable_column_options[attr_name].default;
						}
					}
				});

				return to_return;
			}


			/**
			 * Function to add Column Resize Handlers and bound events
			 */
			function addResize($grid) {
				if (typeof $grid.attr('data-gridable-bound') !== "undefined") {
					return;
				}
				;

				$grid.attr('data-gridable-bound', true).addClass('has-handlers');

				$grid.on('mousedown .gridable__handle', onMouseDown);
				$grid.on('mousemove', onMouseMove);
				$grid.on('mouseup mouseleave', onMouseUp);
			};

			editor.addCommand('gridableRemoveResize', function () {

				var $grids = editor.dom.$('.gridable');

				editor.dom.$.each($grids, function (i, grid) {
					var $grid = editor.dom.$(grid);

					if (typeof $grid.attr('data-gridable-bound') == "undefined") {
						return;
					}

					$grid.removeAttr('data-gridable-bound');

					$grid.off('mousedown .gridable__handle', onMouseDown);
					$grid.off('mousemove', onMouseMove);
					$grid.off('mouseup mouseleave', onMouseUp);
				});
			});

			function getGridStyle(grid) {
				var gridStyle = getComputedStyle(grid),
					gridWidth = grid.clientWidth - parseFloat(gridStyle.paddingLeft) - parseFloat(gridStyle.paddingRight),
					colWidth = gridWidth / 12;

				return {
					gridStyle: gridStyle,
					gridWidth: gridWidth,
					colWidth: colWidth
				}
			}

			function onMouseDown(e) {
				// console.log('handler mouse down');
				xStart = e.clientX;
				xLast = xStart;

				if (typeof e.target.className !== "undefined" && e.target.className.indexOf('gridable__handle') !== -1) {
					e.preventDefault();
					e.stopImmediatePropagation();
					var grid = e.target.closest('.grid'),
						$grid = editor.$(grid);

					var gstyle = getGridStyle(grid);

					gridStyle = gstyle.gridStyle;
					gridWidth = gstyle.gridWidth;
					colWidth = gstyle.colWidth;

					$grid.addClass('grabbing');

					$next = editor.dom.$(e.target).parent();
					$prev = $next.prev('.col');

					gridable_resizing = true;
					updateLoop();

					var width = parseInt($next[0].offsetWidth, 10),
						colNo = Math.round(width / colWidth);
				}
			}

			function onMouseMove(e) {

				if (gridable_resizing) {
					// console.log('handler mousemove');
					e.preventDefault();
					e.stopImmediatePropagation();
					xLast = e.clientX;
					return false;
				}
			};

			function onMouseUp(e) {
				// console.log('handler mouse out');

				var grid = editor.dom.$(e.target).closest('.grid'),
					$grid = editor.dom.$(grid);

				$grid.removeClass('grabbing');

				xEnd = e.clientX;
				gridable_resizing = false;
			};

			function updateLoop() {

				if (!gridable_resizing || !xLast || !xStart) {
					return false;
				}

				if ($next.length && $prev.length && typeof xStart !== "unedfined") {

					if (xLast - xStart >= colWidth / 2) {
						var nextSpan = parseInt($next[0].getAttribute('data-sh-column-attr-size'), 10),
							prevSpan = parseInt($prev[0].getAttribute('data-sh-column-attr-size'), 10);

						if (nextSpan != 1) {
							$next[0].setAttribute('data-sh-column-attr-size', nextSpan - 1);
							$prev[0].setAttribute('data-sh-column-attr-size', prevSpan + 1);

							xStart += 1 * colWidth;
						}
					} else if (xStart - xLast >= colWidth / 2) {
						var nextSpan = parseInt($next[0].getAttribute('data-sh-column-attr-size'), 10),
							prevSpan = parseInt($prev[0].getAttribute('data-sh-column-attr-size'), 10);

						if (prevSpan != 1) {
							$next[0].setAttribute('data-sh-column-attr-size', nextSpan + 1);
							$prev[0].setAttribute('data-sh-column-attr-size', prevSpan - 1);

							xStart -= 1 * colWidth;
						}
					}
				}

				requestAnimationFrame(updateLoop);
			}

			/** === Helper functions ==== **/

			/**
			 * Try to keep our shortcodes clear of wraping P tags
			 * This is very important since a [row] shortcode will turn into a <section class="row">
			 *     In this case there is now way we can have a <p>[row]</p> turned into <p><section class="row"></p>
			 *     The world will end then.
			 *
			 * @param content
			 * @returns {*}
			 */
			var remove_p_around_shortcodes = function (content) {
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

				// avoid casses like <p>[/col], you can never start a paragraf when you are just closing a column
				content = content.replace( /<p[^>]*>\s*(\[\s*\/col[^\]]*\])/gmi, '$1');
				return content;
			};

			/**
			 * Incresease the column size based on a given number
			 * @TODO maybe decrese the number of columns since we already know that 1 column will be deleted
			 * @param column_size
			 * @param node
			 */
			function increase_column_size_with(column_size, node) {
				var current_size = editor.$(node).attr('data-sh-column-attr-size');

				editor.$(node).attr('data-sh-column-attr-size', (parseInt(current_size) + parseInt(column_size)));
			}

			/**
			 * Render [row] shortcodes
			 * @param content
			 * @returns {*}
			 */
			function maybe_replace_rows(content) {
				var next = wp.shortcode.next('row', content);

				if (typeof next !== "undefined") {
					var template_attrs = {
						tag: "row",
						content: next.shortcode.content,
						atts: next.shortcode.attrs.named
					};

					if ( typeof next.shortcode.attrs.named.bg_color !== "undefined" ) {
						template_attrs.atts.style = "background-color:" +  next.shortcode.attrs.named.bg_color + ';';
					}

					var row = getRowTemplate(template_attrs);

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
			function maybe_replace_columns(content) {

				//content = remove_p_around_shortcodes(content);

				var next = wp.shortcode.next('col', content);

				if (typeof next !== "undefined") {

					var template_attrs = {
						tag: "col",
						content: next.shortcode.content,
						atts: next.shortcode.attrs.named
					};

					if ( typeof next.shortcode.attrs.named.bg_color !== "undefined" ) {
						template_attrs.atts.style = "background-color:" +  next.shortcode.attrs.named.bg_color + ';';
					}

					// get the HTML template of a column
					var col = getColTemplate(template_attrs);

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
			function getRowTemplate(args) {
				var rowSh = wp.template("gridable-grider-row"),
					atts = get_attrs_string('row', args.atts);
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
			function getColTemplate(args) {
				var atts = get_attrs_string('column', args.atts),
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
			function get_attrs_string(tag, atts) {
				var atts_string = '';

				if (typeof atts !== "undefined" && Object.keys(atts).length > 0) {
					Object.keys(atts).forEach(function (key, index) {
						if ( key === "style") {
							atts_string += key + '="' + atts[key]  + '" ';
						} else {
							atts_string += ' data-sh-' + tag + '-attr-' + key + '="' + atts[key]  + '" ';
						}
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
			function wpAutoP(content) {
				if (switchEditors && switchEditors.wpautop) {
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
			function removeAutoP(content) {
				if (switchEditors && switchEditors.pre_wpautop) {
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

			/**
			 * WordPress modal logic
			 */
			var GridableOptionsModal = (function () {

				var postMediaFrame = wp.media.view.MediaFrame.Post;

				var MediaController = wp.media.controller.State.extend({

					initialize: function (opts) {
						this.props = new Backbone.Model(opts.sh_atts);
						this.props.on('change:action', this.refresh, this);
					},

					refresh: function () {
						if (this.frame && this.frame.toolbar) {
							this.frame.toolbar.get().refresh();
						}
					},

					insert: function () {

						if (typeof this.frame.options.$shortcode !== "undefined" && typeof this.props.changed !== {}) {

							var $sh = this.frame.options.$shortcode;
							var tag = this.frame.options.type;

							_.each(this.props.attributes, function (value, key) {
								$sh.setAttribute('data-sh-' + tag + '-attr-' + key, value);
							});

							// apply style changes by re-rendering
							editor.execCommand('gridableRestore');
							editor.execCommand('gridableRender');

							this.frame.close();
						}
					},

					reset: function () {
						this.props.set('action', 'select');
						this.props.set('currentShortcode', null);
					},
				});

				var Toolbar = wp.media.view.Toolbar.extend({
					initialize: function () {
						_.defaults(this.options, {
							requires: false
						});
						// Call 'initialize' directly on the parent class.
						wp.media.view.Toolbar.prototype.initialize.apply(this, arguments);
					},

					refresh: function () {
						var action = this.controller.state().props.get('action');
						if (this.get('insert')) {
							this.get('insert').model.set('disabled', action == 'select');
						}
						/**
						 * call 'refresh' directly on the parent class
						 */
						wp.media.view.Toolbar.prototype.refresh.apply(this, arguments);
					}
				});

				var editGridableAttributeField = wp.media.View.extend({

					type: 'text',

					config: {},

					tagName: 'div',

					className: 'gridable-attribute-field',

					events: {
						'input  input': 'inputChanged',
						'input  textarea': 'inputChanged',
						'change select': 'inputChanged',
						'change input[type="radio"]': 'inputChanged',
						'change input[type="checkbox"]': 'inputChanged',
						'change input[type="text"].select2': 'inputChanged'
					},

					initialize: function () {
						this.config = this.options.config;
						this.type = this.options.config.type;
					},

					render: function () {
						var tmpl_key = 'gridable-row-option-' + this.type,
							template = wp.template(tmpl_key);

						config = jQuery.extend({
							id: 'gridable-ui-' + this.options.key,
							label: 'Text'
						}, this.config);

						var template_config = {
							key: this.options.key,
							label: this.config.label,
							value: this.config.default
						};

						if (typeof this.options.model.attributes[this.options.key] !== "undefined") {
							template_config.value = this.options.model.attributes[this.options.key];
						}

						if (this.type === 'checkbox') {
							template_config.checked = template_config.value === 'true' ? 'checked="checked"' : '';
						}

						var element = template(template_config);

						this.$el.html(element);

						var self = this;

						// if there is a colorpicker left behind, init it now
						if ('color' === this.type) {
							this.$el.find('.colorpicker input:not(.wp-color-picker)').wpColorPicker({
								hide: false,
								change: function (event, ui) {
									// event = standard jQuery event, produced by whichever control was changed.
									// ui = standard jQuery UI object, with a color member containing a Color.js object
									jQuery(this).parents('.media-frame-content').css('backgroundColor', ui.color.toString());
									jQuery(this).val(ui.color.toString());
									jQuery(this).trigger('input');
									// change the bg color
								},
								clear: function( event ) {
									// Clear button should make the field transparent
									self.options.model.attributes[self.options.key] = 'transparent';
								}
							});
						}

						if ('select' === self.type) {
							var options = [];

							_.each(self.config.options, function (label, value) {
								var opt_conf = {id: value, text: label};
								if ( value === template_config.value ) {
									opt_conf.selected = true;
								}

								options.push(opt_conf);
							});

							var $fieldSelect2 = self.$el.find('.selector select').select2({
								placeholder: self.config.label || 'Search',
								data: options,
								// containerCssClass: 'gridable-select2',
								theme: 'gridable',
								minimumResultsForSearch: -1
							});
						}

						return self;
					},

					/**
					 * Input Changed Update Callback.
					 *
					 * If the input field that has changed is for content or a valid attribute,
					 * then it should update the model. If a callback function is registered
					 * for this attribute, it should be called as well.
					 */
					inputChanged: function (e) {
						var $input = this.$el.find('.value_to_parse');
						if (this.type === 'checkbox') {
							this.setValue($input.attr('name'), $input[0].checked ? 'true' : 'false');
						} else {
							this.setValue($input.attr('name'), $input.val());
						}
					},

					getValue: function () {
						return this.model.get('value');
					},

					setValue: function (key, val) {
						this.model.set(key, val);
					},
				});

				var Gridable_UI = wp.Backbone.View.extend({

					initialize: function (options) {
						this.controller = options.controller.state();
						//toolbar model looks for controller.state()
						this.toolbar_controller = options.controller;
					},

					createToolbar: function (options) {
						toolbarOptions = {
							controller: this.toolbar_controller
						};
						this.toolbar = new Toolbar(toolbarOptions);
						this.views.add(this.toolbar);
					},

					render: function () {

						switch (this.controller.frame.options.type) {
							case 'row' :
								this.renderRowOptions();
								break;
							case 'column' :
								this.renderColumnOptions();
								break;
							default:
								console.log('render what?');
								break;
						}
					},

					renderRowOptions: function () {
						var atts = this.controller.frame.options.atts,
							$modal = this.$el,
							values = this.controller.props;

						if (typeof gridable_row_options !== "undefined") {

							_.each(gridable_row_options, function (config, key) {

								if ('cols_nr' === key || 'size' === key) {
									return true;
								}

								if (typeof config.type === 'undefined') {
									config.type = 'text';
								}

								if (typeof config.default === 'undefined') {
									config.default = 'Default';
								}

								// @TODO split this view object in multiple fields like select or ... etc
								var view = new editGridableAttributeField({key: key, config: config, model: values});
								$modal.append(view.render().el);
							});
						}
					},

					renderColumnOptions: function () {
						var atts = this.controller.frame.options.atts,
							$modal = this.$el,
							values = this.controller.props;

						if (typeof gridable_column_options !== "undefined") {

							_.each(gridable_column_options, function (config, key) {

								if ('cols_nr' === key || 'size' === key) {
									return true;
								}

								if (typeof config.type === 'undefined') {
									config.type = 'text';
								}

								if (typeof config.default === 'undefined') {
									config.default = 'Default';
								}

								var view = new editGridableAttributeField({key: key, config: config, model: values});
								$modal.append(view.render().el);
							});
						}
					},

				});

				var mediaFrame = postMediaFrame.extend({

					initialize: function () {

						postMediaFrame.prototype.initialize.apply(this, arguments);

						var id = 'gridable-ui',
							title = 'Update ' + this.options.type + ' options',
							sh_atts = {},
							needle = 'data-sh-column-attr-';

						if (this.options.type === 'row') {
							needle = 'data-sh-row-attr-';
						}

						Array.prototype.slice.call(this.options.$shortcode.attributes).forEach(function (item) {
							if (item.name.indexOf(needle) !== -1) {
								sh_atts[item.name.replace(needle, '')] = item.value;
							}
						});

						var opts = {
							id: id,
							search: false,
							router: false,
							toolbar: id + '-toolbar',
							menu: 'default',
							title: title,
							priority: 66,
							content: id + '-content-update',
							sh_atts: sh_atts
						};

						this.mediaController = new MediaController(opts);
						this.states.add([this.mediaController]);

						this.on('content:render:' + id + '-content-update', _.bind(this.contentRender, this, 'gridable-ui', 'update'));
						this.on('toolbar:create:gridable-ui-toolbar', this.toolbarCreate, this);
						this.on('toolbar:render:gridable-ui-toolbar', this.toolbarRender, this);
						this.on('menu:render:default', this.renderShortcodeUIMenu);
					},

					events: function () {
						return _.extend({}, postMediaFrame.prototype.events, {
							'click .media-menu-item': 'resetMediaController',
						});
					},

					resetMediaController: function (event) {
						if (this.state() && 'undefined' !== typeof this.state().props && this.state().props.get('currentShortcode')) {
							//this.mediaController.reset();
							this.contentRender('gridable-ui', 'update');
						}
					},

					contentRender: function (id, tab) {

						var view = new Gridable_UI({
							controller: this,
							className: 'clearfix media-sidebar visible ' + id + '-content ' + id + '-content-' + tab
						});

						this.content.set(view);
					},

					toolbarRender: function (toolbar) {
					},

					toolbarCreate: function (toolbar) {
						toolbar.view = new Toolbar({
							controller: this,
							items: {
								insert: {
									text: 'Update ' + this.options.type,
									style: 'primary',
									priority: 80,
									requires: false,
									click: this.insertAction,
								}
							}
						});
					},

					renderShortcodeUIMenu: function (view) {

						// Hide menu if editing.
						// @todo - fix this.
						// This is a hack.
						// I just can't work out how to do it properly...
						// if ( view.controller.state().props && view.controller.state().props.get( 'currentShortcode' ) ) {
						window.setTimeout(function () {
							view.controller.$el.addClass('hide-menu');
						});
						// }

					},

					insertAction: function () {
						/* Trigger render_destroy */
						/*
						 * Action run before the shortcode overlay is destroyed.
						 *
						 * Called as `shortcode-ui.render_destroy`.
						 *
						 * @param shortcodeModel (object)
						 *           Reference to the shortcode model used in this overlay.
						 */
						// var hookName = 'shortcode-ui.render_destroy';
						// var shortcodeModel = this.controller.state().props.get( 'currentShortcode' );
						// wp.shortcake.hooks.doAction( hookName, shortcodeModel );

						this.controller.state().insert();
					},
				});

				function open(type, editor, shortcode) {

					wp.media.view.MediaFrame.Post = mediaFrame;

					var atts = get_shortcode_atts(type, shortcode);

					// @TODO process shortcode
					var options = {
						frame: 'post',
						state: 'gridable-ui',
						type: type,
						atts: atts,
						$shortcode: shortcode
					};

					wp.media.editor.remove(editor);
					wp.media.editor.open(editor, options);
				}

				function get_shortcode_atts(type, el) {

					var all_atts = el.attributes,
						sh_atts = {};

					var needle = 'data-sh-column-attr-';

					if (type === 'row') {
						needle = 'data-sh-row-attr-';
					}

					Array.prototype.slice.call(el.attributes).forEach(function (item) {
						if (item.name.indexOf(needle) !== -1) {
							sh_atts[item.name.replace(needle, '')] = item.value;
						}
					});

					return sh_atts;
				}

				return {
					open: open
				};
			})();
		});
	});
})(jQuery, window);