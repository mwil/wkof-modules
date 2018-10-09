// ==UserScript==
// @name        Wanikani Open Framework - Events module
// @namespace   wkof
// @author      acm
// @description Events module for wkof
// @version     0.0.1
// @copyright   2018+, Matthias Wilhelm
// @license     MIT; http://opensource.org/licenses/MIT
// ==/UserScript==

/* jshint esversion: 6 */

// Observe changes in the WK website and trigger events.
// Provide some convience functions to access page data.
//
// List of events:
// ------------------------------------
// General
// -- item.ready
//
// Lessons
// -- lessons.prevItem
// -- lessons.nextItem
//
// Lesson quiz and reviews
// -- quiz.nextItem
// -- quiz.moreInfo
// -- quiz.readingPrompt
// -- quiz.meaningPrompt
// -- quiz.readingResult
// -- quiz.meaningResult
//
// List of data:
// -- item (slug?)
// -- type (rad, kan, voc)
// -- curPage
//

(function(global)
{
   "use strict";

	const PageEnum = Object.freeze({
	    'unknown': 0,
        'radicals': 1,
        'kanji': 2,
        'vocabulary': 3,
        'reviews': 4,
        'reviews_summary': 5,
        'lessons': 6,
        'lessons_quiz': 7,
        'lessons_summary': 8
	});

	const TypeEnum = Object.freeze({
	    'unknown': 0,
	    'rad': 1,
	    'kan': 2,
	    'voc': 3
	});

    let wk_state = {
        item: null,
        page: PageEnum.unknown,
        type: TypeEnum.unknown
    };


	// ########################################################################
	// ------------------------------
	// Published interface
	// ------------------------------
	global.wkof.Events = {
        wk_state: wk_state,

        P_ENUM: PageEnum,
        T_ENUM: TypeEnum
	};
	// ########################################################################

   const moreinfo_obs  = new MutationObserver(moreinfo_callback);
   const lesson_obs  = new MutationObserver(lesson_callback);

	function process_page()
    {
        const pathname =  window.location.pathname;

        wk_state.item = null;
        wk_state.type = TypeEnum.unknown;

        if (/\/radicals\//.test(pathname))
        {
            wk_state.item = pathname.split('/').slice(-1)[0];
            wk_state.type = TypeEnum.rad;
            wk_state.page = PageEnum.radicals;

            wkof.trigger('item.ready');
        }
        else if (/\/kanji\//.test(pathname))
        {
            wk_state.item = decodeURIComponent(pathname.split('/').slice(-1)[0]);
            wk_state.type = TypeEnum.kan;
            wk_state.page = PageEnum.kanji;

            wkof.trigger('item.ready');
        }
        else if (/\/vocabulary\//.test(pathname))
        {
            wk_state.item = decodeURIComponent(pathname.split('/').slice(-1)[0]);
            wk_state.type = TypeEnum.voc;
            wk_state.page = PageEnum.vocabulary;

            wkof.trigger('item.ready');
        }
        else if (/\/review\/session/.test(pathname))
        {
            wk_state.page = PageEnum.reviews;

            // Set up observation for:
            // -- nextItem (new prompt)
            // -- prompts
            // -- answers
            // -- more info fold loaded
            // ---- changes state => item.ready

            moreinfo_obs.observe(
                document.getElementById(`item-info-col2`),
                {childList: true}
            );
        }
        else if (/\/lesson\/session/.test(pathname))
        {
            wk_state.page = PageEnum.lessons;

            // Set up observation for:
            // -- quiz start (continues with review events)
            // -- prevItem, nextItem
            // ---- changes state => item.ready

            ['rad', 'kan', 'voc'].forEach((type)=>{
                lesson_obs.observe(
                    document.getElementById(`supplement-${type}`),
                    {attributes: true}
                );
            });

            // Reuse the standard review observer for lesson reviews
            moreinfo_obs.observe(
                document.getElementById(`item-info-col2`),
                {childList: true}
            );

            // The first lesson is directly available after loading
            process_item($.jStorage.get("l/currentLesson"));
            wkof.trigger('item.ready');
        }
        else if (/\/review/.test(pathname))
            wk_state.page = PageEnum.reviews_summary;
        else if (/\/lesson/.test(pathname))
            wk_state.page = PageEnum.lessons_summary;
        else
            wk_state.page = PageEnum.unknown;
    }

    function process_item(queue_item)
    {
        if ('rad' in queue_item)
        {
            // TODO: this results in either the long name ('courage') or
            // the kanji (勇) if available, should be the same any time!
            if (!!queue_item.custom_font_name)
                wk_state.item = queue_item.custom_font_name;
            else
                wk_state.item = queue_item.rad;

            wk_state.type = TypeEnum.rad;
        }
        else if ('kan' in queue_item)
        {
            wk_state.item = queue_item.kan;
            wk_state.type = TypeEnum.kan;
        }
        else if ('voc' in queue_item)
        {
            wk_state.item = queue_item.voc;
            wk_state.type = TypeEnum.voc;
        }
    }

    function moreinfo_callback(mutations)
    {
        // Length 2 for radical page, 4 for kanji page (vocab is 5)
        if (mutations.some((m) => [2, 4, 5].includes(m.addedNodes.length)))
            wkof.trigger('item.ready');
    }

    function lesson_callback(mutations)
    {
        process_item($.jStorage.get("l/currentLesson"));

        wkof.trigger('item.ready');
    }


    wkof.ready('document').then(set_ready_state);

	function set_ready_state()
	{
	    wkof.on('item.ready', ()=>{console.log('The current page state is', wk_state);});

	    process_page();

		// Delay guarantees include() callbacks are called before ready() callbacks.
		setTimeout(()=>{wkof.set_state('wkof.Events', 'ready');}, 0);
	}
}
)(window);
