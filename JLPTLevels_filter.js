/* jshint esversion: 6 */

(function(wkof) {
	'use strict';

	const JLPTLevelsFilterName = wkof.acmFilters.filterNamePrefix + 'JLPTLevels';
	const JLPTLevelsHoverTip = 'Only include items of chosen JLPT levels.';

	// BEGIN JLPT Levels
	function registerJLPTLevelsFilter()
	{
		wkof.ItemData.registry.sources.wk_items.filters[JLPTLevelsFilterName] = {
			type: 'multi',
			label: 'JLPT Levels',
			content: {5: 'N5', 4: 'N4', 3: 'N3', 2: 'N2', 1:'N1'},
			default: [],
			filter_func: JLPTLevelsFilter,
			set_options: function(options) { options.subjects = true; },
			hover_tip: JLPTLevelsHoverTip
		};
	}

    let jlpt_db;

	wkof.load_file('https://raw.githubusercontent.com/mwil/wkof-modules/master/data/jlpt.min.json', true /* use_cache */)
        .then(function(json){jlpt_db = JSON.parse(json);});

	function JLPTLevelsFilter(filterValue, item)
	{
        if (!(item.id in jlpt_db))
            return false;
        else
        {
            const jlpt_levels = jlpt_db[item.id].jlpt;

            // if (item.data.characters !== jlpt_db[item.id].slug)
            //     console.log('Different characters for', item.data.characters);

            return jlpt_levels.some((level)=>filterValue[level]);
        }
	}

	wkof.acmFilters.register_funcs.push(registerJLPTLevelsFilter);
}
)(window.wkof);
