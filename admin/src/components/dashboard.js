import React from "react";
import ReactDOM from "react-dom";

import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import {Tabs, Tab} from 'material-ui/Tabs';

const tabsStyles = {
	barStyle: {
		display: "none"
	}
};

class OptionsDashboard extends React.Component {

	constructor(props) {
		// this makes the this
		super(props);

		// get the current state localized by wordpress
		this.state = gridable.state;
		// // This binding is necessary to make `this` work in the callback

		this.config = gridable.config || {}

	}

	render() {

		var output =
			<div>
				<Tabs className={"dashboard-tabs"} >

					<Tab className={"dashboard-tabs__tab-name"} label="label 1">
						<div className="section  section--informative  u-text-center">
							<h3>Section</h3>

							<p>asd asd ad a sdasd</p>
							<p>asd asd ad a sdasd</p>
						</div>
					</Tab>

					<Tab className="dashboard-tabs__tab-name" label="label 2">
						<div className="section  section--informative  u-text-center">
							<h3>Section</h3>
						</div>
					</Tab>

					<Tab className={"dashboard-tabs__tab-name  dashboard-tabs__tab-name--system-status"} label="label 3">
						<div className="section  section--informative  u-text-center">
							adsdasd
						</div>
					</Tab>
				</Tabs>
			</div>

		return (output);
	}

	htmlDecode(input) {
		var e = document.createElement('div');
		e.innerHTML = input;
		return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
	}

	onPixcareState(state) {
		this.update_local_state(state);
	}

	update_local_state($state) {
		this.setState($state, function () {
			jQuery.ajax({
				url: gridable.wp_rest.root + 'gridable/v1/react_state',
				method: 'POST',
				beforeSend: function (xhr) {
					xhr.setRequestHeader('X-WP-Nonce', gridable.wp_rest.nonce);
				},
				data: {
					'gridable_nonce': gridable.wp_rest.gridable_nonce,
					state: this.state
				}
			}).done(function (response) {
				console.log(response);
			});
		});
	}

	add_notices = (state) => {
		var components = [];
		var install_data = JSON.parse(gridable.install_data);

		return components;
	}
}

// Handle active tab hack
window.requestAnimationFrame(function () {
	var tabs = jQuery('.dashboard-tabs__tab-name');

	jQuery('.dashboard-tabs__tab-name:first-of-type').addClass('is-active');
	tabs.on('click', function () {
		tabs.removeClass('is-active');
		jQuery(this).addClass('is-active');
	});
});

const OptionsPage = () => (
	<MuiThemeProvider muiTheme={getMuiTheme(lightBaseTheme)}>
		<OptionsDashboard />
	</MuiThemeProvider>
);

export default OptionsPage;