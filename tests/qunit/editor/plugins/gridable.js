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

	test("Test column shortcode set", function() {
		editor.setContent('[col size="6"]<p>Content</p>[/col]');
		equal(editor.getContent(), '<p>[col size="6"]</p><p>Content</p><p>[/col]</p>');
	});

	test("Test column render command", function() {
		editor.setContent('[col size="6"]<p>Content</p>[/col]');
		editor.execCommand('gridableRender');
		equal(editor.getContent(), '<div class="col gridable-mceItem  " data-sh-col-attr-size="6" data-mce-placeholder="1"><p>Content</p></div>');
	});

	test("Test column restore command", function() {
		editor.setContent('<div class="col gridable-mceItem  " data-sh-col-attr-size="6" data-mce-placeholder="1"><p>Content</p></div>');
		editor.execCommand('gridableRestore');
		equal(editor.getContent(), '<p>[col size=\"6\"]</p><p>Content</p><p>[/col]</p>');
	});

	test("Test column shortcode render and restore after an Enter key is pressed", function() {
		editor.setContent('[col size="6"]<p>Content</p>[/col]');

		// select the second p tag
		Utils.setSelection('p:nth-child(2)', 4);

		Utils.pressEnter();
		equal(editor.getContent(), '<p>[col size="6"]</p><p>Cont</p><p>ent</p><p>[/col]</p>');

		editor.setContent('<div class="col gridable-mceItem  " data-sh-col-attr-size="6" data-mce-placeholder="1"><p>Content</p></div>');
		Utils.setSelection('p', 4);

		Utils.pressEnter();

		equal(editor.getContent(), '<div class="col gridable-mceItem  " data-sh-col-attr-size="6" data-mce-placeholder="1"><p>Cont</p><p>ent</p></div>');
		editor.execCommand('gridableRestore');

		equal(editor.getContent(), '<p>[col size="6"]</p><p>Cont</p><p>ent</p><p>[/col]</p>');
	});

	test("Test row shortcode set", function() {
		editor.setContent('[row cols_nr="2"][col size="6"]<p>Content</p>[/col][col size="6"]<p>Content</p>[/col][/row]');
		equal(editor.getContent(), '<p>[row cols_nr=\"2\"][col size=\"6\"]</p><p>Content</p><p>[/col][col size=\"6\"]</p><p>Content</p><p>[/col][/row]</p>');
	});

	test("Test row render command", function() {
		editor.setContent('[row cols_nr="2"][col size="6"]<p>Content</p>[/col][col size="6"]<p>Content</p>[/col][/row]');
		editor.execCommand('gridableRender');
		equal(editor.getContent(), '<div class=\"row gridable-mceItem \" data-sh-row-attr-cols_nr=\"2\" data-gridable-row=\"1\" data-mce-placeholder=\"1\"><div class=\"col gridable-mceItem  \" data-sh-col-attr-size=\"6\" data-mce-placeholder=\"1\"><p>Content</p></div><div class=\"col gridable-mceItem  \" data-sh-col-attr-size=\"6\" data-mce-placeholder=\"1\"><p>Content</p></div></div>');
	});

	test("Test row restore command", function() {
		editor.setContent('<div class=\"row gridable-mceItem \" data-sh-row-attr-cols_nr=\"2\" data-gridable-row=\"1\" data-mce-placeholder=\"1\"><div class=\"col gridable-mceItem  \" data-sh-col-attr-size=\"6\" data-mce-placeholder=\"1\"><p>Content</p></div><div class=\"col gridable-mceItem  \" data-sh-col-attr-size=\"6\" data-mce-placeholder=\"1\"><p>Content</p></div></div>');
		editor.execCommand('gridableRestore');
		equal(editor.getContent(), '<p>[row cols_nr=\"2\"][col size=\"6\"]</p><p>Content</p><p>[/col][col size=\"6\"]</p><p>Content</p><p>[/col][/row]</p>');
	});
})();
