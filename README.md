# Gridable

The Missed Grid Content Editor

-------------------

## Remove gridable style?

Gridable adds some CSS style in front-end to handle the grid, but if you want to use your grid system or something like Bootstrap you may want to disable this behavior by using this filter:

`add_filter('gridable_load_public_style' '__return_false' );`

Note: We may add an option for this feature, but this filter will always have the last say!

## Row and Column templates

Each row is represented by the `[row][/row]` shortcode and be sure that there is a template file which can be found in `gridable/public/partials/row.php`.

You may overwrite this file in your theme in `template-parts/gridable/row.php` with your markup, but this is highly NOT recommended, only for desperate cases.

The right way would be to use the actions and filters available. 

* `gridable_before_row_render` and `gridable_before_after_render` - action - You can use them to add an extra wrapper

* \<div class="`row`" \> - `gridable_row_class` - filter

* \<div class="row" `data-custom-attribute="value"` \> - `gridable_row_attributes` - filter - Did you know you can add [custom attributes](https://gist.github.com/andreilupu/2ed88a589ece14a8a8afdb1170db9e43)?

* `gridable_before_row_content_render` and `gridable_after_row_content_render` - action - You can use them to add an inner wrapper

* `gridable_render_shortcodes_in_row` - filter - You can chose NOT to run inner shortcodes since they run by default

* `gridable_the_row_content` - filter - In case you need to filter the content of a specific row

## Need some grid attributes?
This plugin adds a nice interface to edit row or column [custom attributes](https://gist.github.com/andreilupu/2ed88a589ece14a8a8afdb1170db9e43)

<script src="https://gist.github.com/andreilupu/2ed88a589ece14a8a8afdb1170db9e43.js"></script>
