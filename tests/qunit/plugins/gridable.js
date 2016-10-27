(function() {
	module("tinymce.plugins.Gridable", {
		setupModule: function() {
			QUnit.stop();

			tinymce.init({
				selector: "textarea",
				add_unload_trigger: false,
				skin: false,
				indent: false,
				plugins: 'gridable',
				init_instance_callback: function(ed) {
					window.editor = ed;
					QUnit.start();
				}
			});
		},
		teardown: function() {
			Utils.unpatch(editor.getDoc());
			// inlineEditor.show();
			// editor.show();
		}
	});

	/**
	 * Scenario:
	 * Add a column in the editor and test if it is well wrapped
	 * Call the render command and test if it is returning the correct markup
	 */
	test("Test column render command", function() {
		editor.setContent('[col size="6"]<p>Content</p>[/col]');
		editor.execCommand('gridableRender');

		var result = tinyMCE.activeEditor.getContent({format : 'raw'});

		equal(result, '<div class="col gridable-mceItem  " data-sh-col-attr-size="6" data-mce-placeholder="1"><p>Content</p></div>');
	});

	/**
	 * Scenario:
	 * Set up a rendered column
	 * Call the restore command
	 * Check if the result is a correct shortcode
	 */
	test("Test column restore command", function() {
		editor.setContent('<div class="col gridable-mceItem  " data-sh-col-attr-size="6" data-mce-placeholder="1"><p>Content</p></div>');
		editor.execCommand('gridableRestore');
		equal(editor.getContent(), '<p>[col size=\"6\"]</p><p>Content</p><p>[/col]</p>');
	});

	/**
	 * Scenario
	 * Setup a column shortcode
	 * Select the inner content
	 * Press Enter key
	 * Test if the result has the right p tags order
	 * Setup a rendered shortcode and redo the steps aboce
	 */
	test("Test column shortcode render and restore after an Enter key is pressed", function() {
		editor.setContent('[col size="6"]<p>Content</p>[/col]');

		// select the second p tag
		Utils.setSelection('p:nth-child(1)', 4);

		Utils.pressEnter();

		equal(editor.getContent(), '<p>[col size="6"]</p><p>Cont</p><p>ent</p><p>[/col]</p>');

		editor.setContent('<div class="col gridable-mceItem  " data-sh-col-attr-size="6" data-mce-placeholder="1"><p>Content</p></div>');
		Utils.setSelection('p', 4);

		Utils.pressEnter();

		equal(tinyMCE.activeEditor.getContent({format : 'raw'}), '<div class="col gridable-mceItem  " data-sh-col-attr-size="6" data-mce-placeholder="1"><p>Cont</p><p>ent</p></div>');
		editor.execCommand('gridableRestore');

		equal(tinyMCE.activeEditor.getContent({format : 'raw'}), '<p>[col size="6"]</p><p>Cont</p><p>ent</p><p>[/col]</p>');
	});


	test("Test row render command", function() {
		editor.setContent('[row cols_nr="2"][col size="6"]<p>Content</p>[/col][col size="6"]<p>Content</p>[/col][/row]');

		var content = editor.getContent();

		content = content.replace(/<div class=\"gridable__handle\">&nbsp;<\/div>/gm, '');

		equal(content, '<p>[row cols_nr=\"2\"][col size=\"6\"]</p><p>Content</p><p>[/col][col size=\"6\"]</p><p>Content</p><p>[/col][/row]</p>');

		editor.execCommand('gridableRender');
		var result = tinyMCE.activeEditor.getContent({format : 'raw'});

		result = result.replace('/<div class=\"gridable__handle\">&nbsp;</div>/', '');
		result = result.replace('/<div class=\"gridable__handle\"></div>/', '');

		equal(result, '<div class=\"row gridable-mceItem \" data-sh-row-attr-cols_nr=\"2\" data-gridable-row=\"1\" data-mce-placeholder=\"1\"><div class=\"col gridable-mceItem  \" data-sh-col-attr-size=\"6\" data-mce-placeholder=\"1\"><p>Content</p></div><div class=\"col gridable-mceItem  \" data-sh-col-attr-size=\"6\" data-mce-placeholder=\"1\"><p>Content</p></div></div>');
	});

	test("Test row restore command", function() {
		editor.setContent('<div class=\"row gridable-mceItem \" data-sh-row-attr-cols_nr=\"2\" data-gridable-row=\"1\" data-mce-placeholder=\"1\"><div class=\"col gridable-mceItem  \" data-sh-col-attr-size=\"6\" data-mce-placeholder=\"1\"><p>Content</p></div><div class=\"col gridable-mceItem  \" data-sh-col-attr-size=\"6\" data-mce-placeholder=\"1\"><p>Content</p></div></div>');
		editor.execCommand('gridableRestore');
		equal(editor.getContent(), '<p>[row cols_nr=\"2\"][col size=\"6\"]</p><p>Content</p><p>[/col][col size=\"6\"]</p><p>Content</p><p>[/col][/row]</p>');
	});
})();
