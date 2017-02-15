=== Gridable - The Missing Grid Content Editor ===
Contributors: pixelgrade, euthelup, babbardel, razvanonofrei
Tags: grid, preview, render, row, column, inline-edit
Requires at least: 4.6.1
Tested up to: 4.7.2
Stable tag: 1.1.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Gridable — The Missing Grid Content Editor

== Description ==

Gridable is a witty solution for WordPress lovers who want to create flexible and reliable grids. Being smoothly integrated into the **WordPress's Editor** interface, our plugin becomes a suitable choice for everyone: from people with a technical background to those who are non-techy. It simplifies the entire process of building an extensive range of grids that fit perfectly into various environments.

Gridable allows you to create an adaptable and fully responsive grid in no time. Thanks to options such as row spacing top and bottom, row gutter and row background color everything comes in the right place without effort. Imagine playing around with bold approaches for different sections of your website through a grid system that puts convenience on top of the digital experience.

It has never been easier to create a dynamic grid with such ease and creative freedom.

##Complete control

You have a particular set of options that allow you to adjust the grid content editor to your unique brand's voice and personality. Mix and match colors, spacings, content with images, and make them yours.

## No coding required

Gridable is accessible for everyone who handles WordPress. Being so naturally integrated into the platform, every action is a very natural behavior and doesn't require any special skills.

## Continuous improvement

We invest a lot of time and energy into developing Gridable in a way that makes sense and brings real value to its users so that people make the most out of it.

== Installation ==

1. Activate the plugin through the 'Plugins' menu in WordPress
2. Edit a post, page or a custom post type
3. Enjoy the "Add Row" button

== Changelog ==

= 1.1.0 =
* Rewrite `gridable_sh_row_classes` and `gridable_sh_col_classes` into a more consistent way as `gridable_row_class` and `gridable_column_class`
* Limit the word selection to the column container
* Fix conflict with Yoast
* Fix the attributes default selection
* Make inline preview for bg_color attribute
* Small fixes


= 1.0.0 =
* Improved the inline grid UI
* We changed the grid system from 6 columns to 12 columns
* We added the [attributes system](https://github.com/pixelgrade/gridable/tree/dev#need-some-grid-attributes) which supports fields like text, checkbox, select and colorpicker
* Improved the row and column templates.
* Small fixes

= 0.5.0 =
* Improved the resize UI
* Added the `girdable_load_public_style` filter which allows you to disable the plugin public CSS style so you can add your own
* Fixed the conflicts with toolbars of links and galleries
* Small fixes

= 0.1.0 =
* Improved editing UX by keeping the cursor inside the column while pressing enter on empty lines
* Fixed PHP Fatal error when there is no other style appended
* Fixed the removal when there is a nested row
* Small fixes

= 0.0.1 =
* Plugin init
