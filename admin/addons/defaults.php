<?php


// print option html
function qac_add_modal_option_template() { ?>
	<script type="text/html" id="tmpl-gridable-row-option-color">
		<div class="colopicker">
			<span>{{data.key}}</span>
			<span>{{data.label}}</span>
			<span>{{data.value}}</span>
			<input type="hidden" class="wp-color-picker" value="{{data.value}}">
		</div>
	</script>

	<script type="text/html" id="tmpl-gridable-row-option-text">
		<div class="text">
			<p>––––––––––––––––––––––</p>
			<label for="{{data.key}}">{{data.label}}
				<input type="input" name="{{data.key}}" value="{{data.value}}">
			</label>
			<p>––––––––––––––––––––––</p>
		</div>
	</script>

	<script type="text/html" id="tmpl-gridable-row-option-checkbox">
		<div class="checkbox">
			<p>––––––––––––––––––––––</p>
			<label for="{{data.key}}">{{data.label}}
				<input type="checkbox" name="{{data.key}}" value="{{data.value}}">
			</label>
			<p>––––––––––––––––––––––</p>
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

	$options['streched'] = array(
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

	$options['streched'] = array(
		'type' => 'checkbox',
		'label' => 'Stretch',
		'default' => 0
	);

	$options['altceva'] = array(
		'label' => 'Alt Ceva',
	);

	return $options;
});