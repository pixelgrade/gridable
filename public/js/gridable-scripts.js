(
	function( $ ) {
		'use strict';

		/**
		 * All of the code for your public-facing JavaScript source
		 * should reside in this file.
		 *
		 * Note: It has been assumed you will write jQuery code here, so the
		 * $ function reference has been prepared for usage within the scope
		 * of this function.
		 *
		 * This enables you to define handlers, for when the DOM is ready:
		 *
		 * $(function() {
	 *
	 * });
		 *
		 * When the window is loaded:
		 *
		 * $( window ).load(function() {
	 *
	 * });
		 *
		 * ...and/or other possibilities.
		 *
		 * Ideally, it is not considered best practise to attach more than a
		 * single DOM-ready or window-load handler for a particular page.
		 * Although scripts in the WordPress core, Plugins and Themes may be
		 * practising this, we should strive to set a better example in our own work.
		 */


		var GridableClass = function() {};

		GridableClass.prototype.cleanup = function( $container ) {
			$container = typeof $container !== "undefined" ? $container : $( 'body' );

			$container.find( '.gridable--col' ).each( function( i, obj ) {
				var $col = $( obj );

				if ( $col.text().trim() === "" && $col.find( 'img, video, input, textarea, [class]' ).length === 0 ) {
					$col.addClass( 'is-empty' );
				}
			} );
		};

		window.Gridable = new GridableClass();

		$( window ).on( 'load', function() {
			window.Gridable.cleanup();
		} );

	}
)( jQuery );
