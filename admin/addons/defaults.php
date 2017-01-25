<?php


// print option html
function qac_add_modal_option_template() { ?>
	<script type="text/html" id="tmpl-gridable-row-option-color">
		<fieldset class="colorpicker">
			<label class="setting" for="{{data.key}}">
				<span class="name">{{data.label}}</span>
			</label>
			<input type="text" class="value_to_parse" name="{{data.key}}" value="{{data.value}}">
		</fieldset>
	</script>

	<script type="text/html" id="tmpl-gridable-row-option-text">
		<fieldset class="text">
			<label class="setting" for="{{data.key}}">
				<span class="name">{{data.label}}</span>
				<input type="input" class="value_to_parse" name="{{data.key}}" value="{{data.value}}">
			</label>
		</fieldset>
	</script>

	<script type="text/html" id="tmpl-gridable-row-option-checkbox">
		<fieldset class="checkbox">
			<label class="setting" for="{{data.key}}">
				<span class="name">{{data.label}}</span>
				<input type="checkbox" class="value_to_parse" name="{{data.key}}" {{data.checked}} value="{{data.value}}">
			</label>
		</fieldset>
	</script>


	<script type="text/html" id="tmpl-gridable-row-option-select">
		<fieldset class="select">
			<label class="setting" for="{{data.key}}">
				<span class="name">{{data.label}}</span>
				<select type="checkbox" class="value_to_parse" name="{{data.key}}" value="{{data.value}}">
					{{data.select_options}}
				</select>
			</label>

		</fieldset>
	</script>

	<script type="text/html" id="tmpl-gridable-row-option-radio">
		<fieldset class="radio">
			<label class="setting" for="{{data.key}}">
				<span class="name">{{data.label}}</span>
				<input type="checkbox" class="value_to_parse" name="{{data.key}}" value="{{data.value}}">
			</label>
		</fieldset>
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