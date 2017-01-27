// Required for browser compatibility.
import "babel-polyfill";
import 'whatwg-fetch';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import React from "react";
import ReactDOM from "react-dom";

// import PixelgradeCareNoSupportHere from './components/no_support.js';
import OptionsPage from './components/dashboard.js';

ReactDOM.render(<OptionsPage />, document.getElementById('admin_options_dashboard')  );
