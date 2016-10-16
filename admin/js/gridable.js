(function () {
	/**
	 * A TinyMCE plugin which handles the rendering of grid shortcodes
	 */
	tinymce.PluginManager.add('gridable', function ( editor, url ) {
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
			debug = true

		// The bix X button that removes the entre row shortcode
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

			// console.group('init');
			//
			// var ifrm_doc = editor.dom.doc,
			// 	$next = editor.$(),
			// 	$prev =	editor.$();
			//
			// editor.dom.bind( ifrm_doc, 'mousedown', function ( e ) {
			// 	if ( typeof e.target.className !== "undefined" && e.target.className.indexOf('gridable__handle') !== -1 ) {
			// 		e.preventDefault();
			//
			// 		var grid = e.target.closest('.grid'),
			// 			$grid = editor.$( grid );
			//
			// 		var gstyle = getGridStyle( grid );
			//
			// 		gridStyle = gstyle.gridStyle;
			// 		gridWidth = gstyle.gridWidth;
			// 		colWidth = gstyle.colWidth;
			//
			// 		$grid.addClass('grabbing');
			//
			// 		$next = editor.dom.$( e.target ).parent();
			// 		$prev = $next.prev('.col');
			// 		xStart = e.clientX;
			//
			// 		gridable_resizing = true;
			// 		updateLoop();
			//
			// 		var width = parseInt( $next[0].offsetWidth, 10 ),
			// 			colNo = Math.round( width / colWidth );
			// 	}
			// }, editor.$('.gridable__handle') );
			//
			// editor.dom.bind( ifrm_doc, 'mousemove', function ( e ) {
			// 	if ( typeof e.target.className !== "undefined" && e.target.className.indexOf('gridable__handle') !== -1 ) {
			// 		xLast = e.clientX;
			// 	}
			// }, editor.$('.gridable__handle'));
			//
			// editor.dom.bind( ifrm_doc, 'mouseup mouseleave', function ( e ) {
			//
			// 	if ( typeof e.target !== "undefined" ) {
			//
			// 		var grid = editor.dom.$(e.target).closest('.grid'),
			// 			$grid = editor.dom.$( grid );
			//
			// 		$grid.removeClass('grabbing');
			// 		$next.find( '.gridable__handle' ).css( 'transform', 'translate3d(0,0,0)');
			// 		xEnd = e.clientX;
			// 		gridable_resizing = false;
			// 	}
			// }, editor.$('.gridable__handle'));
			//
			// function updateLoop() {
			//
			// 	if ( ! gridable_resizing || ! xLast || ! xStart ) {
			// 		return false;
			// 	}
			//
			// 	if ( $next.length && $prev.length && typeof xStart !== "unedfined" ) {
			//
			// 		if ( xLast - xStart >= colWidth ) {
			// 			var nextSpan = parseInt( $next[0].getAttribute('data-sh-col-attr-size'), 10 ),
			// 				prevSpan = parseInt( $prev[0].getAttribute('data-sh-col-attr-size'), 10 );
			//
			// 			if ( nextSpan != 2 ) {
			// 				$next[0].setAttribute('data-sh-col-attr-size', nextSpan - 2);
			// 				$prev[0].setAttribute('data-sh-col-attr-size', prevSpan + 2);
			//
			// 				xStart += 2 * colWidth;
			// 			}
			// 		} else if ( xStart - xLast >= colWidth ) {
			// 			var nextSpan = parseInt( $next[0].getAttribute('data-sh-col-attr-size'), 10 ),
			// 				prevSpan = parseInt( $prev[0].getAttribute('data-sh-col-attr-size'), 10 );
			//
			// 			if ( prevSpan != 2 ) {
			// 				$next[0].setAttribute('data-sh-col-attr-size', nextSpan + 2);
			// 				$prev[0].setAttribute('data-sh-col-attr-size', prevSpan - 2);
			//
			// 				xStart -= 2 * colWidth;
			// 			}
			// 		}
			// 	}
			//
			// 	requestAnimationFrame(updateLoop);
			// }
			//
			// function getGridStyle(grid) {
			// 	var gridStyle = getComputedStyle( grid ),
			// 		gridWidth = grid.clientWidth - parseFloat(gridStyle.paddingLeft) - parseFloat(gridStyle.paddingRight),
			// 		colWidth = gridWidth / 12;
			//
			// 	return {
			// 		gridStyle: gridStyle,
			// 		gridWidth: gridWidth,
			// 		colWidth: colWidth
			// 	}
			// }
			//
			// console.groupEnd('init');
		});

		/**
		 * While pressing enter in editor the cursor should not be allowd the leave the coulmn
		 */
		// editor.on('keydown', function ( evt ) {
		//
		// 	if ( evt.keyCode == 13 ) { // if Enter is pressed
		// 		var dom = editor.dom,
		// 			selection = editor.selection,
		// 			settings = editor.settings,
		// 			rng = selection.getRng(true),
		// 			container = rng.startContainer,
		// 			parentBlock = dom.getParent(container, dom.isBlock), // Find parent block and setup empty block paddings
		// 			containerBlock = parentBlock ? dom.getParent(parentBlock.parentNode, dom.isBlock) : null;
		//
		// 		// Handle enter in column item
		// 		if ( typeof parentBlock!== "null"
		// 		&& dom.isEmpty(parentBlock)
		// 		&& containerBlock !== null
		// 		&& typeof containerBlock.tagName !== "undefined"
		// 		&& "DIV" === containerBlock.tagName
		// 		&& containerBlock.className.indexOf( "col gridable-mceItem") !== -1 ) {
		// 			editor.execCommand("InsertLineBreak", false, evt);
		// 			evt.preventDefault();
		// 			return false;
		// 		}
		// 	}
		// });

		/**
		 * Event triggered when the content is set
		 * Here we replace the shortcodes like [row] with <div class="row">
		 */
		// editor.on( 'BeforeSetContent', function ( event ) {
		// 	// console.group('BeforeSetContent');
		//
		// 	if ( ! event.content || 'html' === event.mode ) {
		// 		return;
		// 	}
		//
		// 	setTimeout(function ( e ) {
		// 		editor.execCommand( 'gridableRender' );
		// 	},1000);
		// 	// console.groupEnd('BeforeSetContent');
		// });

		// editor.on( 'GetContent', function ( event ) {
		// 	console.group('GetContent');
		//
		// 	if ( event.format !== 'raw' || ! event.content || event.selection ) {
		// 		return;
		// 	}
		//
		// 	editor.execCommand( 'gridableRestore', event );
		// 	console.groupEnd('GetContent');
		// });


		/**
		 * Whenever the cursor changes it's position the parent may be a grid column, then we need to add handlers
		 */
		// editor.on( 'NodeChange', function ( event ) {
		// 	debug = false;
		// 	var node = editor.selection.getNode(),
		// 		wrap = editor.$(node).closest('.row.gridable-mceItem');
		//
		// 	if ( wrap.length > 0 ) {
		// 		console.group('NodeChange');
		// 		// addColumnsHandlers();
		// 		console.groupEnd('NodeChange');
		// 	} else {
		// 		removeColumnsHandlers();
		// 	}
		// });

		// editor.on( 'PostProcess', function ( event ) {
		//
		// 	if ( ! event.content || ! event.get ) {
		// 		return;
		// 	}
		//
		// 	editor.execCommand('gridableRestore');
		// });

		// editor.on( 'LoadContent', function ( event ) {
		// 	console.log(' LoadContent');
		// 	editor.execCommand( 'gridableRender' );
		// });
		//
		// editor.on( 'SaveContent', function ( event ) {
		// 	tinyMCE.execCommand('gridableRestore');
		// });
		// editor.on( 'PreProcess', function ( event ) {
		// 	console.log('pre process');
		// 	console.log(event);
		// });

		/**
		 * This function turns the grid shortcodes into HTML
		 *
		 * [row][/row] will turn into <div class="row"></div>
		 *
		 * @param content
		 * @returns {*}
		 */
		editor.addCommand( 'gridableRender', function() {
			console.group('gridableRender');
			var content = this.getBody().innerHTML;

			if ( typeof content === "undefined" ) {
				return;
			}

			// first we need to strip grid shortcodes from p's
			// content = remove_p_around_shortcodes( content );

			// same for cols
			content = maybe_replace_columns( content );


			// now replace row shortcodes with their HTML if there are any
			content = maybe_replace_rows( content );

			this.setContent(content, { no_events: true});

			console.groupEnd('gridableRender');
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
		editor.addCommand( 'gridableRestore', function() {
			console.group('gridableRestore');
			// hold all the content inside a HTML element.This way we keep it safe
			// var content_process = this.dom.create('DIV', {}, event.content);
			var content_process = this.dom.doc.body;

			var columns = content_process.querySelectorAll('.col.gridable-mceItem'),
				columnReplacement = '';

			for ( var columnIndex = 0; columnIndex < columns.length; columnIndex++ ) {
				var columnReplacement = wp.shortcode.string({
					tag: 'col',
					attrs: {size: columns[columnIndex].getAttribute('data-sh-col-attr-size')},
					content: columns[columnIndex].innerHTML
				});

				content_process.innerHTML = content_process.innerHTML.replace(columns[columnIndex].outerHTML, columnReplacement);
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

				content_process.innerHTML = content_process.innerHTML.replace(rows[rowIndex].outerHTML, rowReplacement);
			}

			// this.dom.setHTML(this.dom.doc.body, content_process.innerHTML, {format: 'raw', no_events: true});
			this.dom.doc.body.innerHTML = content_process.innerHTML;
			// this.setContent(content_process.innerHTML, { no_events: true});
			console.groupEnd('gridableRestore');
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
		 * Render [row] shortcodes
		 * @param content
		 * @returns {*}
		 */
		function maybe_replace_rows (content) {

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
		function maybe_replace_columns (content) {

			content = remove_p_around_shortcodes(content);

			var next = wp.shortcode.next('col', content);

			if ( typeof next !== "undefined" ) {

				var col = getColTemplate({
					tag: "col",
					content: next.shortcode.content,
					attrs: next.shortcode.attrs
				});

				var new_content = content.replace( next.content, col );

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
		 * Function to add Column Resize Handlers
		 */
		var addColumnsHandlers = function(  ) {
			var $body = editor.getBody();
			// if the handlers are already here we quit
			if ( $body.className.indexOf('gridable--resize-handlers-active') !== -1 ) {
				return;
			}

			var $cols = editor.dom.$( '.col.gridable-mceItem'),
				handle = wp.html.string({
					tag: 'div',
					attrs: {
						class: "gridable__handle",
						unselectable: "true"
					}
				});

			if ( $cols.length > 0 ) {
				$cols.each(function ( i, col ) {

					var current_handler = editor.$(this).children('.gridable__handle');

					if ( current_handler.length < 1 ) {
						editor.$(col).append(handle);
					}
				});
				$body.classList.add('gridable--resize-handlers-active');
			}
		}

		function removeColumnsHandlers () {
			var $body = editor.getBody(),
				wrap = editor.dom.$('.gridable__handle');

			if ( wrap.length < 1 || $body.className.indexOf('gridable--resize-handlers-active') === -1 ) {
				// console.log('handlers already removed');
				return;
			}
			console.log(wrap);
			editor.dom.remove(wrap);

			$body.classList.remove('gridable--resize-handlers-active');

			editor.$( '.gridable' ).each(function (i, grid) {
				editor.$(grid).removeClass( 'gridable--resize-bound' );
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
		function wpAutoP ( content ) {
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
		function removeAutoP ( content ) {
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
			// if ( switchEditors && switchEditors.wpautop ) {
			// 	content = switchEditors.wpautop(content);
			// }
			// return content;

			switchEditors.go('content', 'html');
			switchEditors.go('content', 'tmce');
		};
	});
})();