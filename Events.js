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
// Lessons
// -- lessons.prevItem
// -- lessons.nextItem
//
// Lesson quiz and reviews
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

	// ########################################################################
	// ------------------------------
	// Published interface
	// ------------------------------
	global.wkof.Events = {
        cur_item: null,
        cur_type: TypeEnum.unknown,
        cur_page: PageEnum.unknown,

        P_ENUM: PageEnum,
        T_ENUM: TypeEnum
	};
	// ########################################################################

    wkof.ready('document').then(set_ready_state);

	function set_ready_state()
	{
        console.log('The event module is now ready! WKOF works ...');

		// Delay guarantees include() callbacks are called before ready() callbacks.
		setTimeout(()=>{wkof.set_state('wkof.Events', 'ready');}, 0);
	}
}
)(window);
