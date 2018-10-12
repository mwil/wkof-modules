// ==UserScript==
// @name          WaniKani Open Framework acm's filters
// @namespace     wkof
// @author        acm
// @description   Additional filters for the WaniKani Open Framework
// @version       0.1.0
//
// @include       *://www.wanikani.com/*
// @copyright     2018+, Matthias Wilhelm
//
// @license       MIT; http://opensource.org/licenses/MIT
//
// @grant         none
// ==/UserScript==
//

/* jshint esversion: 6 */

(function(wkof) {
	'use strict';

	var wkofMinimumVersion = '1.0.18';

	if (!wkof)
	{
		var response = confirm(`WaniKani Open Framework acm's Filters requires WaniKani Open Framework.
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

	function promise(){var a,b,c=new Promise(function(d,e){a=d;b=e;});c.resolve=a;c.reject=b;return c;}

	var settingsDialog;
	var settingsScriptId = 'acmFilters';
	var settingsTitle = 'More Filters by acm';

	var needToRegisterFilters = true;
	var settingsLoadedPromise = promise();

	var filterNamePrefix = 'acmFilters_';
	var JLPTLevelsFilterName = filterNamePrefix + 'JLPTLevels';

	var supportedFilters = [JLPTLevelsFilterName];

	var defaultSettings = {};
	defaultSettings[JLPTLevelsFilterName] = true;

	var JLPTLevelsHoverTip = 'Only include items of chosen JLPT levels.';

	wkof.ready('Menu').then(installMenu);

	function waitForItemDataRegistry() {
		return wkof.wait_state('wkof.ItemData.registry', 'ready');
	}

    waitForItemDataRegistry().then(registerJLPTLevelsFilter);

	// BEGIN JLPT Levels
	function registerJLPTLevelsFilter() {
		wkof.ItemData.registry.sources.wk_items.filters[JLPTLevelsFilterName] = {
			type: 'multi',
			label: 'JLPT levels',
			content: {5: 'N5', 4: 'N4', 3: 'N3', 2: 'N2', 1:'N1'},
			default: [],
			filter_func: JLPTLevelsFilter,
			set_options: function(options) { options.subjects = true; },
			hover_tip: JLPTLevelsHoverTip
		};
	}

    let jlpt_db;

	wkof.load_file('https://www.wanikani.com/settings/account', false /* use_cache */)
    .then(function(json){jlpt_db = JSON.parse(json);});

	function JLPTLevelsFilter(filterValue, item) {
        // console.log('Filter value is', filterValue, 'item is', item);

        if (item.data.characters === '入る')
        {
            console.log('Filter value is', filterValue, 'item is', item);

            return true;
        }

        return false;
	}
	// END JLPT Levels
}
)(window.wkof);
