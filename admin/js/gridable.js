(function ($, exports) {
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

		// @TODO the edit row button should open a modal with row attributes options
		editor.addButton('gridable_edit_row', {
			tooltip: l10n.edit_row,
			icon: 'dashicon dashicons-edit',
			onclick: function (i) {
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
			icon: 'dashicon dashicons-plus',
			onclick: function (event) {
				var node = editor.selection.getNode(),
					wrap = editor.$(node).closest('.row.gridable-mceItem'),
					columns = wrap.find('.col.gridable-mceItem'),
					new_size = 0;

				if (columns.length > 0) {
					columns.each(function (i, el) {
						var current_size = editor.$(el).attr('data-sh-col-attr-size');

						if (current_size > 2) {
							editor.$(el).attr('data-sh-col-attr-size', current_size - 2);
							new_size += 2;
						}
					});
				}

				if (new_size === 0) {
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

		editor.addButton('gridable_remove_col', {
			tooltip: 'Remove column',
			icon: 'dashicon dashicons-minus',
			onclick: function (event) {
				var node = editor.selection.getNode(),
					column = editor.$(node).closest('.col.gridable-mceItem');

				if (window.confirm('Are you sure you want to remove this column?')) {
					var column_size = editor.$(column).attr('data-sh-col-attr-size');

					if (column[0].previousElementSibling !== null) {
						increase_column_size_with(column_size, column[0].previousElementSibling);
					} else if ( column[0].nextElementSibling !== null ) {
						increase_column_size_with(column_size, column[0].nextElementSibling);
					} else {
						editor.$(node).closest('.row.gridable-mceItem').remove();
					}
					column.remove();
				}
			}
		});

		editor.addButton('gridable_row_options', {
			tooltip: 'Row Options',
			icon: 'dashicon dashicons-editor-kitchensink',
			onclick: function (event) {

				var node = editor.selection.getNode(),
					column = editor.$(node).closest('.row.gridable-mceItem');

				gridable_row_options_open( column );
			}
		});

		/**
		 * Create the toolbar with the controls for row
		 */
		editor.on('wptoolbar', function (args) {
			var selected_row = editor.dom.$(args.element).closest('div.row.gridable-mceItem');

			// if a row is focused we display the toolbar and add a CSS class
			if ( ( args.element.tagName === "P" || args.element.className.indexOf('gridable-mceItem') !== -1 ) && selected_row.length > 0) {
				args.toolbar = toolbar;
				args.selection = selected_row[0];
				selected_row.addClass('is-focused');
			} else { // we need to ensure that the focused class is removed
				var $rows = editor.dom.$('div.row.gridable-mceItem.is-focused');
				if ( $rows.length > 0 ) {
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
				toolbar = editor.wp._createToolbar([
					'gridable_add_col',
					'gridable_remove_col',
					'gridable_row_options',
					'gridable_row_remove'
				]);
			}
		});

		/**
		 * Whenever the cursor changes it's position the parent may be a grid column, then we need to add handlers
		 */
		editor.on('NodeChange', function (event) {

			if ('html' === window.getUserSetting('editor')) {
				return;
			}

			var wrap = editor.dom.$(event.element).closest('.row.gridable-mceItem');

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
		 * Here we replace the shortcodes like [row] with <div class="row">
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
					attrs: {size: columns[columnIndex].getAttribute('data-sh-col-attr-size')},
					content: columns[columnIndex].innerHTML.trim()
				});

				// console.debug(columns[columnIndex].outerHTML);
				// console.debug(columnReplacement);

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
					attrs: {cols_nr: rows[rowIndex].getAttribute('data-sh-row-attr-cols_nr')},
					content: rows[rowIndex].innerHTML.trim()
				});

				// console.debug(rows[rowIndex].outerHTML);x

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
		});


		// if this is not enough, you are free to hook this
		// GridableCallbacks.executeCallbacks = function(data) {
		//
		// 	$.each(GridableCallbacks.callbacks, function(key, callback) {
		// 		if ($.isFunction(callback)) {
		// 			console.log('you go ' + key );
		// 			callback(data, editor);
		// 		}
		// 	});
		// }

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

			// console.log(xLast - xStart, colWidth);

			if ($next.length && $prev.length && typeof xStart !== "unedfined") {

				if (xLast - xStart >= colWidth) {
					var nextSpan = parseInt($next[0].getAttribute('data-sh-col-attr-size'), 10),
						prevSpan = parseInt($prev[0].getAttribute('data-sh-col-attr-size'), 10);

					if (nextSpan != 2) {
						$next[0].setAttribute('data-sh-col-attr-size', nextSpan - 2);
						$prev[0].setAttribute('data-sh-col-attr-size', prevSpan + 2);

						xStart += 2 * colWidth;
					}
				} else if (xStart - xLast >= colWidth) {
					var nextSpan = parseInt($next[0].getAttribute('data-sh-col-attr-size'), 10),
						prevSpan = parseInt($prev[0].getAttribute('data-sh-col-attr-size'), 10);

					if (prevSpan != 2) {
						$next[0].setAttribute('data-sh-col-attr-size', nextSpan + 2);
						$prev[0].setAttribute('data-sh-col-attr-size', prevSpan - 2);

						xStart -= 2 * colWidth;
					}
				}
			}

			requestAnimationFrame(updateLoop);
		}

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

			return content;
		};

		/**
		 * Incresease the column size based on a given number
		 * @TODO maybe decrese the number of columns since we already know that 1 column will be deleted
		 * @param column_size
		 * @param node
		 */
		function increase_column_size_with(column_size, node) {
			var current_size = editor.$(node).attr('data-sh-col-attr-size');

			editor.$(node).attr('data-sh-col-attr-size', (parseInt(current_size) + parseInt(column_size)));
		}

		/**
		 * Render [row] shortcodes
		 * @param content
		 * @returns {*}
		 */
		function maybe_replace_rows(content) {
			var next = wp.shortcode.next('row', content);

			if (typeof next !== "undefined") {

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
		function maybe_replace_columns(content) {

			//content = remove_p_around_shortcodes(content);

			var next = wp.shortcode.next('col', content);

			if (typeof next !== "undefined") {

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
		function getRowTemplate(args) {

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
		function getColTemplate(args) {
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
		function get_attrs_string(tag, atts) {
			var atts_string = '';

			if (typeof atts.attrs.named !== "undefined" && Object.keys(atts.attrs.named).length > 0) {
				Object.keys(atts.attrs.named).forEach(function (key, index) {
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

		var gridable_row_options_open = function ( column) {

			var wp_gridable_frame = wp.media.frames.wp_gridable_frame = wp.media({
				frame : "post",
				state : 'gridable-ui',
				title : 'Wazaaaa'
			});

			wp_gridable_frame.open();

		};
	});

	/**
	 * WordPress modal logic
	 */


	$(document).ready(function () {
		var MediaFrame = wp.media.view.MediaFrame;

		// first we need to create a state-controller
		var GridableRowController = wp.media.controller.State.extend({

			initialize: function(){

				this.props = new Backbone.Model({
					currentShortcode: null,
					action: 'select',
					search: null
				});

				this.props.on( 'change:action', this.refresh, this );
			},

			// refresh: function() {
			// 	if ( this.frame && this.frame.toolbar ) {
			// 		this.frame.toolbar.get().refresh();
			// 	}
			// },

			insert: function() {
				var shortcode = this.props.get('currentShortcode');
				if ( shortcode ) {
					send_to_editor( shortcode.formatShortcode() );
					this.reset();
					this.frame.close();
				}
			},

			reset: function() {
				this.props.set( 'action', 'select' );
				this.props.set( 'currentShortcode', null );
				this.props.set( 'search', null );
			},
		});

		wp.media.wp_gridable_frame = MediaFrame.Post.extend( {

			initialize: function() {

				postMediaFrame.prototype.initialize.apply( this, arguments );

				var opts = {
					id      : 'gridable-ui',
					search  : false,
					router  : false,
					toolbar : 'gridable-ui-toolbar',
					menu    : 'default',
					title   : 'Row Options',
					tabs    : [ 'update' ],
					priority:  66,
					content : 'gridable-ui-content-insert',
				};

				this.gridableController = new GridableRowController( opts );

				this.states.add([ this.gridableController ]);

				this.on( 'content:render:gridable-ui-content-insert', _.bind( this.contentRender, this, 'gridable-ui', 'update' ) );

				this.on( 'toolbar:create:' + id + '-toolbar', this.toolbarCreate, this );
				this.on( 'toolbar:render:' + id + '-toolbar', this.toolbarRender, this );
				this.on( 'menu:render:default', this.renderShortcodeUIMenu );

			},

			contentRender: function( id, tab ) {

				this.content.set(
					new wp.media.View({
						controller: this,
						className: 'clearfix gridable-ui-content gridable-ui-content-' + tab
					})
				);
			},

			renderShortcodeUIMenu: function( view ) {

				// Add a menu separator link.
				view.set({
					'shortcode-ui-separator': new wp.media.View({
						className: 'separator',
						priority: 65
					})
				});
			},

			toolbarRender: function( toolbar ) {},

			toolbarCreate : function( toolbar ) {
				var text = shortcodeUIData.strings.media_frame_toolbar_insert_label;
				if ( 'currentShortcode' in this.options ) {
					text = shortcodeUIData.strings.media_frame_toolbar_update_label;
				}

				toolbar.view = new  Toolbar( {
					controller : this,
					items: {
						insert: {
							text: text,
							style: 'primary',
							priority: 80,
							requires: false,
							click: this.insertAction,
						}
					}
				} );
			},

			insertAction: function() {
				/* Trigger render_destroy */
				/*
				 * Action run before the shortcode overlay is destroyed.
				 *
				 * Called as `shortcode-ui.render_destroy`.
				 *
				 * @param shortcodeModel (object)
				 *           Reference to the shortcode model used in this overlay.
				 */
				var hookName = 'gridable-ui.render_destroy';
				var shortcodeModel = this.controller.state().props.get( 'currentShortcode' );
				wp.shortcake.hooks.doAction( hookName, shortcodeModel );

				this.controller.state().insert();

			},
		});
	});

})(jQuery, window);