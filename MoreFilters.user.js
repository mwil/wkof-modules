// ==UserScript==
// @name          WaniKani Open Framework ACM's filters
// @namespace     wkof
// @author        acm
// @description   Additional filters for the WaniKani Open Framework
// @version       0.9.1
//
// @include       *://www.wanikani.com/*
//
// @copyright     2018+, Matthias Wilhelm
// @license       MIT; http://opensource.org/licenses/MIT
//
// @grant         none
// ==/UserScript==
//

/* jshint esversion: 6 */

(function(wkof) {
	'use strict';

	const wkofMinimumVersion = '1.0.18';

	if (!wkof)
	{
		const response = confirm(`WaniKani Open Framework acm's Filters requires WaniKani Open Framework.
		                          Click "OK" to be forwarded to installation instructions.`);

		if (response)
			window.location.href = 'https://community.wanikani.com/t/28549';

		return;
	}

	if (!wkof.version || wkof.version.compare_to(wkofMinimumVersion) === 'older')
	{
		alert(`WaniKani Open Framework acm's Filters requires at least version ${wkofMinimumVersion} of WaniKani Open Framework.`);

		return;
	}

	wkof.acmFilters = {
        filterNamePrefix: 'acmFilters_',
        register_funcs: []
	};

	wkof.load_script('http://localhost:8088/static/JLPTLevels_filter.js', false);

    wkof.wait_state('wkof.ItemData.registry', 'ready')
        .then(()=>wkof.acmFilters.register_funcs.forEach((rfunc)=>rfunc()));
}
)(window.wkof);
