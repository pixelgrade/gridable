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
					wrap = editor.$(node).parents('.row.gridable-mceItem');

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

		// the edit row button should open a modal with row attributes options
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
					wrap = editor.$(node).parents('.row.gridable-mceItem');

				var columns = wrap.find('.col.gridable-mceItem');

				var new_size = 0;

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

				var tmp = getColTemplate({
					attrs: {named: {size: new_size.toString()}},
					size: new_size.toString(),
					content: "<p>" + l10n.new_column_content + "</p>"
				});

				node = editor.dom.create('DIV', {}, tmp);

				wrap[0].appendChild(node.children[0]);
				clearfix();
			}
		});

		editor.once('preinit', function () {
			if ( editor.wp && editor.wp._createToolbar ) {
				toolbar = editor.wp._createToolbar([
					'gridable_add_col',
					// 'gridable_edit_row',
					'gridable_row_remove'
				]);
			}
		});

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

		function replaceShortcodes( content ) {

			// first remove s
			content = removeAutoP(content);

			var new_content = wp.shortcode.replace('row', content, function ( args ) {
				return getRowTemplate(args);
			});

			new_content = wp.shortcode.replace('col', new_content, function ( args ) {
				return getColTemplate(args);
			});

			new_content = wpAutoP( new_content );

			return new_content;
		}

		/**
		 * This function must restore the shortcodes from the rendering state
		 *
		 * Since we are handling html we rather create a DOM element and use its innerHTML as parsing method
		 *
		 * @param content
		 * @returns {*|string}
		 */
		function restoreShortcodes( content ) {

			if ( typeof( window.QTags ) !== 'undefined' ) {
				window.QTags.closeAllTags('content');
			}

			var div = document.createElement('div');
			div.innerHTML = content;

			var cols = div.querySelectorAll('.col.gridable-mceItem'),
				to_replaceC = '';

			for ( var indexC = 0; indexC < cols.length; indexC++ ) {

				var col_atts = '';

				if ( typeof cols[indexC].getAttribute('data-sh-col-attr-size') !== "null" ) {
					col_atts += ' size="' + cols[indexC].getAttribute('data-sh-col-attr-size') + '"';
				}

				to_replaceC = '<p>[col' + col_atts + ']</p><p>' + cols[indexC].innerHTML + '</p><p>[/col]</p>';
				div.innerHTML = div.innerHTML.replace( cols[indexC].outerHTML , to_replaceC);
			}

			// first restore back the row shortcodes
			var rows = div.querySelectorAll('.row.gridable-mceItem'),
				to_replaceR = '';

			for ( var indexR = 0; indexR < rows.length; indexR++ ) {

				var row_atts = '';

				if ( typeof rows[indexR].getAttribute('data-sh-row-attr-cols_nr') !== "null" ) {
					row_atts += ' cols_nr="' + rows[indexR].getAttribute('data-sh-row-attr-cols_nr') + '"';
				}

				to_replaceR = '<p>[row' + row_atts + ']</p>' + rows[indexR].innerHTML + '<p>[/row]</p>';

				div.innerHTML = div.innerHTML.replace(rows[indexR].outerHTML, to_replaceR);
			}

			return div.innerHTML;
		}

		editor.on('BeforeSetContent', function ( event ) {
			event.content = replaceShortcodes(event.content);
		});


		//
		// editor.on('SetContent', function ( event ) {
		//
		// 	var startMovingTheControl = function ( e ) {
		// 		console.log( 'moving now' );
		// 		// var new_left = parseInt( e.target.style.left.replace('px', '') ) + e.movementX;
		// 		// e.target.setAttribute('style', 'left: ' + new_left + 'px;' );
		// 	};
		//
		// 	var gridableControlOnMouseDown = function ( e ) {
		// 		e.target.parentElement.style.pointerEvents = false;
		//
		// 		if ( e.target.className.indexOf('resize_control') > -1 ) {
		// 			// console.log( 'down');
		// 			e.target.addEventListener('mousemove', startMovingTheControl );
		// 		}
		// 	};
		//
		// 	var gridableControlOnMouseUp = function ( e ) {
		// 		e.target.removeEventListener('mousemove', startMovingTheControl );
		// 		console.log('remove moving');
		// 	};
		//
		// 	var gridableControlOnMouseOut = function ( ev ) {
		// 		console.log('remove moving');
		// 		// console.log('out the FUCK!!!!! of the element');
		//
		// 		ev.target.removeEventListener('mousemove', startMovingTheControl );
		//
		// 		//this is the original element the event handler was assigned to
		// 		var e = ev.toElement || ev.relatedTarget;
		// 		if (e.parentNode == this || e == this) {
		// 			return;
		// 		}
		//
		// 	};
		//
		// 	setTimeout( function (  ) {
		//
		// 		var columns = editor.$('.col.gridable-mceItem');
		//
		// 		// make each col resizable
		// 		columns.each(function ( i, column ) {
		//
		// 			if ( i < columns.length - 1 ) {
		//
		// 				var control_span = document.createElement('span');
		// 				control_span.classList.add('resize_control');
		// 				control_span.setAttribute('contenteditable', false );
		// 				control_span.setAttribute('draggable', true );
		//
		// 				var ps = column.getBoundingClientRect();
		// 				var new_left = ps.width - 5;
		//
		// 				// control_span.setAttribute('style', 'left: ' + new_left + 'px;' );
		// 				control_span.style.left = new_left + 'px';
		// 				// column.appendChild( control_span );
		// 				column.parentNode.insertBefore(control_span, column.nextSibling);
		//
		// 				editor.dom.bind( control_span, 'mousedown', gridableControlOnMouseDown);
		// 				editor.dom.bind( control_span, 'mouseup', gridableControlOnMouseUp);
		// 				// editor.dom.bind( control_span, 'mouseout', gridableControlOnMouseOut);
		// 			}
		// 		});
		// 	}, 600 );
		// });

		//
		// editor.on('ObjectResized', function ( e ) {
		// 	console.log('this was a resize');
		// });
		//
		// editor.on('ObjectSelected', function ( e ) {
		// 	console.log('this is a resize');
		// });

		editor.on('PostProcess', function ( event ) {
			if ( event.content ) {
				event.content = restoreShortcodes(event.content);
				// clearfix();
			}
		});

		//helper functions
		function getRowTemplate( args ) {

			var rowSh = wp.template("gridable-grider-row"),
				atts = get_attrs_string('row', args);

			return rowSh({
				content: wpAutoP(args.content),
				classes: 'row gridable-mceItem',
				atts: atts
			});
		}

		function getColTemplate( args ) {
			var atts = get_attrs_string('col', args),
				colSh = wp.template("gridable-grider-col");

			return colSh({
				content: wpAutoP(args.content),
				classes: 'col  gridable-mceItem ',
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

		var clearfix = function (  ) {
			// if ( switchEditors && switchEditors.wpautop ) {
			// 	content = switchEditors.wpautop(content);
			// }
			// return content;


			switchEditors.go( 'content', 'html' );
			switchEditors.go( 'content', 'tmce' );
		};
	});
})();