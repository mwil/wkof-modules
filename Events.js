// ==UserScript==
// @name        Wanikani Open Framework - Events module
// @namespace   wkof
// @author      acm
// @description Events module for wkof
// @version     0.7.0
// @copyright   2018+, Matthias Wilhelm
// @license     MIT; http://opensource.org/licenses/MIT
// ==/UserScript==

/* jshint esversion: 6 */

// Observe changes in the WK website and trigger events.
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
// -- item (Japanese string or empty for some radicals)
// -- slug (=item, the name for some radicals)
// -- type type of the item (rad, kan, voc)
// -- page (type of the current page)
//
// List of page types
// -- unknown
// -- radicals, kanji, vocabulary
// -- reviews_quiz, reviews_summary
// -- lessons, lessons_quiz, lessons_summary
//

(function(global)
{
   'use strict';

    let wk_state = {};

	// ########################################################################
	// ------------------------------
	// Published interface
	// ------------------------------
	global.wkof.Events = {};
	// ########################################################################

    const quiz_showinfo_obs = new MutationObserver(quiz_showinfo_callback);
    const quiz_answer_obs   = new MutationObserver(quiz_answer_callback);

    const lesson_quiz_prompt_obs = new MutationObserver(lesson_quiz_prompt_callback);
    const review_quiz_prompt_obs = new MutationObserver(review_quiz_prompt_callback);

    const lesson_obs = new MutationObserver(lesson_callback);

    function wk_state_reset()
    {
        wk_state.char = '';
        wk_state.slug = '';
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

            lesson_quiz_prompt_obs.observe(
                document.getElementById('character'),
                {childList: true}
            );

            // Reuse some standard review observers for lesson reviews
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

            wkof.trigger('quiz.prompt',
                Object.assign(
                    {questionType: $.jStorage.get('questionType')},
                    wk_state
                )
            );
        }
    }

    function lesson_quiz_prompt_callback(mutations)
    {
        // Lessons: two events for all transition
        if (mutations.length === 2)
        {
            process_qitem($.jStorage.get('l/currentQuizItem'));
            wk_state.page = 'lessons_quiz';

            wkof.trigger('quiz.prompt',
                Object.assign(
                    {questionType: $.jStorage.get('l/questionType')},
                    wk_state
                )
            );
        }
    }

    function quiz_answer_callback(mutations)
    {
        // Matches both correct and incorrect
        if (/correct/.test(mutations[0].target.className))
        {
            wkof.trigger('quiz.result',
                Object.assign({
                    result: $("#answer-form fieldset").hasClass('correct')?
                            'correct':
                            'incorrect',
                    questionType: $.jStorage.get('questionType')
                }, wk_state)
            );
        }
    }

    function lesson_callback(mutations)
    {
        process_qitem($.jStorage.get('l/currentLesson'));
        wk_state.page = 'lessons';

        wkof.trigger('item.ready', wk_state);
    }

    const LODASH = 'https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js';
    const promises = [
        wkof.ready('document'),
        wkof.load_script(LODASH, true /* use_cache */)
    ];

    Promise.all(promises).then(set_ready_state);

	function set_ready_state()
	{
	    wkof.on('item.ready',    (data)=>{console.log('item.ready:', data);});
	    wkof.on('quiz.showinfo', (data)=>{console.log('quis.showinfo:', data);});
	    wkof.on('quiz.prompt',   (data)=>{console.log('quiz.prompt:', data);});
	    wkof.on('quiz.result',   (data)=>{console.log('quiz.result:', data);});

	    process_page();

		// Delay guarantees include() callbacks are called before ready() callbacks.
		setTimeout(()=>{wkof.set_state('wkof.Events', 'ready');}, 0);
	}
}
)(window);
