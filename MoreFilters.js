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

	var filterNamePrefix = 'acmFilters_';
	var JLPTLevelsFilterName = filterNamePrefix + 'JLPTLevels';

	var JLPTLevelsHoverTip = 'Only include items of chosen JLPT levels.';

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

	wkof.load_file('https://raw.githubusercontent.com/mwil/wkof-modules/master/data/jlpt.json', true /* use_cache */)
    .then(function(json){jlpt_db = JSON.parse(json);});

	function JLPTLevelsFilter(filterValue, item) {
        if (!(item.id in jlpt_db))
            return false;
        else
        {
            const jlpt_levels = jlpt_db[item.id].jlpt;

            // if (item.data.characters !== jlpt_db[item.id].slug)
            //     console.log('Different characters for', item.data.characters);

            if (jlpt_levels.some((level)=>filterValue[level]))
                return true;
        }
	}
	// END JLPT Levels
}
)(window.wkof);
