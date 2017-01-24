<?php


// print option html
function qac_add_modal_option_template() { ?>
	<script type="text/html" id="tmpl-gridable-row-option-color">
		<div class="colorpicker">
			<input type="text" class="value_to_parse" name="{{data.key}}" value="{{data.value}}">
		</div>
	</script>

	<script type="text/html" id="tmpl-gridable-row-option-text">
		<div class="text">
			<label for="{{data.key}}">{{data.label}}
				<input type="input" class="value_to_parse" name="{{data.key}}" value="{{data.value}}">
			</label>
		</div>
	</script>

	<script type="text/html" id="tmpl-gridable-row-option-checkbox">
		<div class="checkbox">
			<label for="{{data.key}}">{{data.label}}
				<input type="checkbox" class="value_to_parse" name="{{data.key}}" value="{{data.value}}">
			</label>
		</div>
	</script>


	<script type="text/html" id="tmpl-gridable-row-option-select">
		<div class="select">
			<label for="{{data.key}}">{{data.label}}
				<select type="checkbox" class="value_to_parse" name="{{data.key}}" value="{{data.value}}">
					{{data.select_options}}
				</select>
			</label>
		</div>
	</script>

	<script type="text/html" id="tmpl-gridable-row-option-radio">
		<div class="radio">
			<label for="{{data.key}}">{{data.label}}
				<input type="checkbox" class="value_to_parse" name="{{data.key}}" value="{{data.value}}">
			</label>
		</div>
	</script>

<?php }
add_action( 'gridable_print_row_options_templates', 'qac_add_modal_option_template' );

// register your addon
add_filter( 'gridable_addons', function ( $addons ) {
	$addons[] = 'colorpicker';
	return $addons;
});


add_filter( 'gridable_row_options', function ( $options ) {

	$options['bg_color'] = array(
		'type' => 'color',
		'label' => 'Row Background Color',
		'default' => 'transparent'
	);

	$options['stretch'] = array(
		'type' => 'checkbox',
		'label' => 'Stretch',
		'default' => 0
	);

	$options['ceva'] = array(
		'label' => 'Ceva',
	);

	return $options;
});


add_filter( 'gridable_column_options', function ( $options ) {

	$options['bg_color'] = array(
		'type' => 'color',
		'label' => 'Column Background Color',
		'default' => 'transparent'
	);

	$options['stretch'] = array(
		'type' => 'checkbox',
		'label' => 'Stretch',
		'default' => 0
	);

	$options['altceva'] = array(
		'label' => 'Alt Ceva',
	);

	return $options;
});