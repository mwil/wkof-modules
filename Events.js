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
// Lesson quiz and reviews
// -- quiz.showinfo
// -- quiz.prompt
// -- quiz.result
//
// List of data:
// -- item (slug?)
// -- type (rad, kan, voc)
// -- curPage
//

(function(global)
{
   'use strict';

	const PageEnum = Object.freeze({
	    'unknown': 0,
        'radicals': 1,
        'kanji': 2,
        'vocabulary': 3,
        'reviews_quiz': 4,
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
        char: null,
        slug: null,
        page: 'unknown',
        type: 'unknown'
    };


	// ########################################################################
	// ------------------------------
	// Published interface
	// ------------------------------
	global.wkof.Events = {
        wk_state: wk_state,
	};
	// ########################################################################

    const quiz_showinfo_obs = new MutationObserver(quiz_showinfo_callback);
    const quiz_answer_obs   = new MutationObserver(quiz_answer_callback);
    const lesson_quiz_prompt_obs = new MutationObserver(lesson_quiz_prompt_callback);
    const review_quiz_prompt_obs = new MutationObserver(review_quiz_prompt_callback);

    const lesson_obs = new MutationObserver(lesson_callback);

    function wk_state_reset()
    {
        wk_state.char = null;
        wk_state.slug = null;
        wk_state.type = 'unknown';
        wk_state.page = 'unknown';
    }

	function process_page()
    {
        const pathname =  window.location.pathname;

        wk_state_reset();

        if (/\/radicals\//.test(pathname))
        {
            wk_state.char = $('span.radical-icon').text();
            wk_state.slug = pathname.split('/').slice(-1)[0];
            wk_state.type = 'rad';
            wk_state.page = 'radicals';

            wkof.trigger('item.ready', wk_state);
        }
        else if (/\/kanji\//.test(pathname))
        {
            wk_state.char = decodeURIComponent(pathname.split('/').slice(-1)[0]);
            wk_state.slug = wk_state.char;
            wk_state.type = 'kan';
            wk_state.page = 'kanji';

            wkof.trigger('item.ready', wk_state);
        }
        else if (/\/vocabulary\//.test(pathname))
        {
            wk_state.char = decodeURIComponent(pathname.split('/').slice(-1)[0]);
            wk_state.slug = wk_state.char;
            wk_state.type = 'voc';
            wk_state.page = 'vocabulary';

            wkof.trigger('item.ready', wk_state);
        }
        else if (/\/review\/session/.test(pathname))
        {
            wk_state.page = 'reviews_quiz';

            review_quiz_prompt_obs.observe(
                document.getElementById('loading'),
                {attributes: true, attributeFilter: ['style']}
            );
            review_quiz_prompt_obs.observe(
                document.getElementById('character'),
                {attributes: true, attributeFilter: ['class']}
            );

            quiz_answer_obs.observe(
                document.getElementById('answer-form'),
                {attributes: true, attributeFilter: ['class'], subtree: true}
            );

            quiz_showinfo_obs.observe(
                document.getElementById('item-info-col2'),
                {childList: true}
            );
        }
        else if (/\/lesson\/session/.test(pathname))
        {
            wk_state.page = 'lessons';

            ['rad', 'kan', 'voc'].forEach((type)=>{
                lesson_obs.observe(
                    document.getElementById(`supplement-${type}`),
                    {attributes: true}
                );
            });

            // Reuse the standard review observer for lesson reviews
            lesson_quiz_prompt_obs.observe(
                document.getElementById('character'),
                {childList: true}
            );

            quiz_answer_obs.observe(
                document.getElementById('answer-form'),
                {attributes: true, attributeFilter: ['class'], subtree: true}
            );

            quiz_showinfo_obs.observe(
                document.getElementById('item-info-col2'),
                {childList: true}
            );

            // The first lesson is directly available after loading
            process_qitem($.jStorage.get('l/currentLesson'));
            wkof.trigger('item.ready', wk_state);
        }
        else if (/\/review/.test(pathname))
            wk_state.page = 'reviews_summary';
        else if (/\/lesson/.test(pathname))
            wk_state.page = 'lessons_summary';
    }

    function process_qitem(queue_item)
    {
        if ('rad' in queue_item)
        {
            wk_state.char = queue_item.rad;
            wk_state.slug = _.kebabCase(queue_item.en[0]);
            wk_state.type = 'rad';
        }
        else if ('kan' in queue_item)
        {
            wk_state.char = queue_item.kan;
            wk_state.slug = queue_item.kan;
            wk_state.type = 'kan';
        }
        else if ('voc' in queue_item)
        {
            wk_state.char = queue_item.voc;
            wk_state.slug = queue_item.voc;
            wk_state.type = 'voc';
        }
    }

    function quiz_showinfo_callback(mutations)
    {
        // Length 2 for radical page, 4 for kanji page (vocab is 5)
        if (mutations.some((m) => [2, 4, 5].includes(m.addedNodes.length)))
        {
            wkof.trigger('quiz.showinfo', wk_state);
            wkof.trigger('item.ready', wk_state);
        }
    }

    function review_quiz_prompt_callback(mutations)
    {
        // Reviews: two events for transition, three for the last step of loading
        if ([2, 3].includes(mutations.length))
        {
            process_qitem($.jStorage.get('currentItem'));

            wkof.trigger('quiz.prompt', {
                questionType: $.jStorage.get('questionType')
            });
        }
    }

    function lesson_quiz_prompt_callback(mutations)
    {
        // Lessons: two events for all transition
        if (mutations.length === 2)
        {
            process_qitem($.jStorage.get('l/currentQuizItem'));
            wk_state.page = 'lessons_quiz';

            wkof.trigger('quiz.prompt', {
                questionType: $.jStorage.get('l/questionType')
            });
        }
    }

    function quiz_answer_callback(mutations)
    {
        // Matches both correct and incorrect
        if (/correct/.test(mutations[0].target.className))
        {
            wkof.trigger('quiz.result', {
                result: $("#answer-form fieldset").hasClass('correct')?
                        'correct':
                        'incorrect',
                questionType: $.jStorage.get('questionType')
            });
        }
    }

    function lesson_callback(mutations)
    {
        process_qitem($.jStorage.get('l/currentLesson'));
        wk_state.page = 'lessons';

        wkof.trigger('item.ready', wk_state);
    }

    const LODASH = 'https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js';
    let promises = [];

    promises.push(wkof.ready('document'));
    promises.push(wkof.load_script(LODASH, true /* use_cache */));

    Promise.all(promises).then(set_ready_state);

	function set_ready_state()
	{
	    wkof.on('item.ready',    (data)=>{console.log('item.ready:', data);});
	    wkof.on('quiz.showinfo', (data)=>{console.log('quis.showinfo:', data);});
	    wkof.on('quiz.prompt',   (data)=>{console.log('quiz.prompt:', wk_state, ', data:', data);});
	    wkof.on('quiz.result',   (data)=>{console.log('quiz.result:', wk_state, ', data:', data);});

	    process_page();

		// Delay guarantees include() callbacks are called before ready() callbacks.
		setTimeout(()=>{wkof.set_state('wkof.Events', 'ready');}, 0);
	}
}
)(window);
