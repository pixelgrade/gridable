<?php
// print option html
function gridable_default_attributes_modal_options_templates() { ?>
	<script type="text/html" id="tmpl-gridable-row-option-color">
		<fieldset class="colorpicker">
			<label class="gridable-setting setting" for="{{data.key}}">
				<span class="name">{{data.label}}</span>
				<input type="text" class="value_to_parse" name="{{data.key}}" value="{{data.value}}">
			</label>
		</fieldset>
	</script>

	<script type="text/html" id="tmpl-gridable-row-option-text">
		<fieldset class="text">
			<label class="gridable-setting setting" for="{{data.key}}">
				<span class="name">{{data.label}}</span>
				<input type="input" class="value_to_parse" name="{{data.key}}" value="{{data.value}}">
			</label>
		</fieldset>
	</script>

	<script type="text/html" id="tmpl-gridable-row-option-checkbox">
		<fieldset class="checkbox">
			<label class="gridable-setting setting" for="{{data.key}}">
				<span class="name">{{data.label}}</span>
				<input type="checkbox" class="value_to_parse" name="{{data.key}}" {{data.checked}} value="{{data.value}}">
			</label>
		</fieldset>
	</script>


	<script type="text/html" id="tmpl-gridable-row-option-select">
		<fieldset class="selector">
			<label class="gridable-setting setting" for="{{data.key}}">
				<span class="name">{{data.label}}</span>
				<select class="value_to_parse select2" name="{{data.key}}" value="{{data.value}}" data-options="{{data.options}}"></select>
			</label>

		</fieldset>
	</script>

	<script type="text/html" id="tmpl-gridable-row-option-radio">
		<fieldset class="radio">
			<label class="gridable-setting setting" for="{{data.key}}">
				<span class="name">{{data.label}}</span>
				<input type="checkbox" class="value_to_parse" name="{{data.key}}" value="{{data.value}}">
			</label>
		</fieldset>
	</script>

<?php }
add_action( 'gridable_print_row_options_templates', 'gridable_default_attributes_modal_options_templates' );