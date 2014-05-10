/*jslint browser: true, sloppy: true, white: true, nomen: true, indent: 4 */
/*globals YUI, console*/

/*
 * Copyright (c) 2012, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*
 * This module tests against common markup errors.  As not all are explicit
 * errors, they are listed in the console as warnings.  This must be run with
 * --logLevel=debug to see warnings.
 *
 * Built from selectors found in DebugCSS: http://yahoo.github.io/debugCSS
 *
 * Sample test descriptor file
 *
 * [
 *    {
 *        "settings": [ "master" ],
 *
 *        "name" : "markup-test",
 *
 *        "dataprovider" : {
 *              "Generic Markup Test" : {
 *                  "group" : "smoke",
 *                  "params" : {
 *                      "test" : "../../lib/common/tests/markup-test.js",
 *                      "page" : "http://yahoo.github.io/debugCSS/playgrounds/accessibility.html",
 *                      "warnOnly" : false
 *                  }
 *              }
 *          }
 *      }
 * ]
 *
 */

var warnOnly = this.testParams["warnOnly"] || false;

YUI.add("markup-common-tests", function (Y) {

    var suite  = new Y.Test.Suite("Test using markup common test function"),
        error  = [],
        i      = 0,
//      green  = '\u001b[32m',
//      yellow = '\u001b[33m',
//      blue   = '\u001b[34m',
//      pink   = '\u001b[35m',
        red    = '\u001b[31m',
        aqua   = '\u001b[36m',
        gray   = '\u001b[37m',
        reset  = '\u001b[0m',
        color  = reset;

    suite.add(new Y.Test.Case({

        "markup result test": function() {
            if(Y.one('table[summary]')) {
                error.push({level: 'warn', text: 'Table summary deprecated.'});
            }

            if(Y.one('table > *:first-child:not(caption)')) {
                error.push({level: 'warn', text: 'Should you have a table caption?'});
            }

            if(Y.one('table > tr')) {
                error.push({level: 'warn', text: 'Table Row without thead/tbody/tfoot.'});
            }

            if(Y.one('table th:not([scope])')) {
                error.push({level: 'warn', text: 'Table Header without scope (this is fine if you\'re using header mappings.'});
            }

            if(Y.one('table thead td')) {
                error.push({level: 'warn', text: 'Table Header with td instead of th.'});
            }

            if(Y.one('table > tbody:first-child')) {
                error.push({level: 'warn', text: 'tbody as first-child of table (instead of tfoot or thead).'});
            }

            if(Y.one('table > tfoot ~ thead')) {
                error.push({level: 'warn', text: 'thead comes before tfoot.'});
            }

            if(Y.one('table > tbody ~ tfoot')) {
                error.push({level: 'warn', text: 'tfoot comes before tbody.'});
            }

            if(Y.one('table > tbody ~ thead')) {
                error.push({level: 'warn', text: 'thead comes before tbody.'});
            }

            if(Y.one('table > tr:first-child:last-child') ||
               Y.one('table > tbody > tr:first-child:last-child')) {
                error.push({level: 'warn', text: 'Only one table row in table - are you using this for layout?'});
            }

            if(Y.one('table > *:not(thead):not(tfoot):not(tbody):not(tr):not(colgroup):not(caption)')) {
                error.push({level: 'error', text: 'Invalid immediate child of table.'});
            }

            if(Y.one('colgroup *:not(col)')) {
                error.push({level: 'warn', text: 'Colgroup with invalid child element.'});
            }

            if(Y.one('table[align]')       ||
               Y.one('table[bgcolor]')     ||
               Y.one('table[border]')      ||
               Y.one('table[cellpadding]') ||
               Y.one('table[cellspacing]') ||
               Y.one('table[width]')) {
                error.push({level: 'warn', text: 'Legacy style attribute found on table.'});
            }

            if(Y.one('*:not(img):not(iframe)[width]')  ||
               Y.one('*:not(img):not(iframe)[height]') ||
               Y.one('*[border]')) {
                error.push({level: 'warn', text: 'Legacy style attribute found on element.'});
            }

            if(Y.one('*:not(area):not(base):not(br):not(col):not(embed):not(hr):not(iframe):not(img):not(input):not(textarea):empty')) {
                error.push({level: 'warn', text: 'Empty element - is it necessary?'});
            }

            if(Y.one('a a')) {
                error.push({level: 'error', text: 'Anchor within another anchor.  This looks like a bug.'});
            }

            if(Y.one('img:not([alt])')) {
                error.push({level: 'error', text: 'Img tag missing alt text.'});
            }

            if(Y.one('img:not([src])') ||
               Y.one('img[src=""]')    ||
               Y.one('img[src="#"]')) {
                error.push({level: 'error', text: 'Image tag without a valid source value can have serious implications for performance.'});
            }

            if(Y.one('a:not([href])') ||
               Y.one('a[href="#"]')   ||
               Y.one('a[href*=javascript:]')) {
                error.push({level: 'warn', text: 'Anchor tag with no javascript fall-back link.  If this link is generated with JS, it might be OK.'});
            }

            if(Y.one('a[onclick]')     ||
               Y.one('a[onmouseover]') ||
               Y.one('a[onmouseout]')) {
                error.push({level: 'error', text: 'Anchor tag with inline javascript.  Tsk tsk.'});
            }

            if(Y.one('img[src="spacer.gif"]')) {
                error.push({level: 'warn', text: 'spacer.gif used - is this used for layout?'});
            }
/*
            if(Y.one('img[src*="&"]:not([src*="&amp;"])') ||
               Y.one('a[href*="&"]:not([href*="&amp;"])')) {
                error.push({level: 'error', text: 'Unencoded &amp;'});
            }
*/
            if(Y.one('label:not([for])')) {
                error.push({level: 'warn', text: 'Labels should probably specify the for attribute instead of relying on siblings.'});
            }

            if(Y.one('nav:not([role])')) {
                error.push({level: 'warn', text: 'Nav element should have role attribute.'});
            }

            if(Y.one('div[role="img"]:not([aria-label])')) {
                error.push({level: 'warn', text: 'Div used as imag should have aria-label.'});
            }

            if(Y.one('div[role="img"]:not([aria-label])')) {
                error.push({level: 'warn', text: 'Div used as imag should have aria-label.'});
            }

            if(Y.one('h1 div') ||
               Y.one('h2 div') ||
               Y.one('h3 div') ||
               Y.one('h4 div') ||
               Y.one('h5 div') ||
               Y.one('h6 div') ||
               Y.one('span div')) {
                error.push({level: 'warn', text: 'Block level element within span level element.'});
            }

            if(Y.one('html[xmlns] a div') ||
               Y.one('html[xmlns] a h1')  ||
               Y.one('html[xmlns] a h2')  ||
               Y.one('html[xmlns] a h3')  ||
               Y.one('html[xmlns] a h4')  ||
               Y.one('html[xmlns] a h5')  ||
               Y.one('html[xmlns] a h6')) {
                error.push({level: 'warn', text: 'Block level element within anchor (not a problem for HTML5, but it looks like you\'re using XHTML).'});
            }

            if(Y.one('ol > *:not(li)') ||
               Y.one('ul > *:not(li)') ||
               Y.one('dl > *:not(dt):not(dd)')) {
                error.push({level: 'error', text: 'List with invalid child element.'});
            }

            if(Y.one('form > *:not(fieldset)')) {
                error.push({level: 'warn', text: 'Form without a fieldset.'});
            }

            if(Y.one('fieldset > *:not(legend):first-child')) {
                error.push({level: 'warn', text: 'Fieldset requires a legend.'});
            }

            if(Y.one('iframe:not([title])')) {
                error.push({level: 'warn', text: 'iframe should have a title.  If this is an ad, I\'ll forgive you.'});
            }

            if(Y.one('b') ||
               Y.one('i')) {
                error.push({level: 'warn', text: 'Use of b or i tags can be bad.  Do you know what you\'re doing?'});
            }

            if(Y.one('center') ||
               Y.one('u')      ||
               Y.one('font')   ||
               Y.one('map')    ||
               Y.one('blink')  ||
               Y.one('marquee')) {
                error.push({level: 'error', text: 'Some pretty non-semantic / legacy tags being used here.'});
            }

            if(Y.one('script:not([type])') ||
               Y.one('style:not([type])')) {
                error.push({level: 'warn', text: 'script or style tag without type defined.'});
            }

            if(Y.one('br + br')) {
                error.push({level: 'error', text: 'Multiple br tags in a row.  Is that necessary?'});
            }

            if(Y.one('*[class^="1"]') ||
               Y.one('*[class^="2"]') ||
               Y.one('*[class^="3"]') ||
               Y.one('*[class^="4"]') ||
               Y.one('*[class^="5"]') ||
               Y.one('*[class^="6"]') ||
               Y.one('*[class^="7"]') ||
               Y.one('*[class^="8"]') ||
               Y.one('*[class^="9"]') ||
               Y.one('*[class^="0"]')) {
                error.push({level: 'error', text: 'Class name starting with a number.'});
            }

            if(Y.one('*[id^="1"]') ||
               Y.one('*[id^="2"]') ||
               Y.one('*[id^="3"]') ||
               Y.one('*[id^="4"]') ||
               Y.one('*[id^="5"]') ||
               Y.one('*[id^="6"]') ||
               Y.one('*[id^="7"]') ||
               Y.one('*[id^="8"]') ||
               Y.one('*[id^="9"]') ||
               Y.one('*[id^="0"]')) {
                error.push({level: 'error', text: 'ID starting with a number.'});
            }

            if(Y.one('*[class*=left]')   ||
               Y.one('*[class*=right]:not([class*=opyright])') ||
               Y.one('*[class*=bottom]') ||
               Y.one('*[class*=center]') ||
               Y.one('*[class*=clear]')  ||
               Y.one('*[class*=float]')  ||
               Y.one('*[class*=large]')  ||
               Y.one('*[class*=small]')  ||
               Y.one('*[class*=blue]')   ||
               Y.one('*[class*=green]')  ||
               Y.one('*[class*=yellow]') ||
               Y.one('*[class*=white]')  ||
               Y.one('*[class*=black]')  ||
               Y.one('*[class*=Left]')   ||
               Y.one('*[class*=Right]')  ||
               Y.one('*[class*=Bottom]') ||
               Y.one('*[class*=Center]') ||
               Y.one('*[class*=Clear]')  ||
               Y.one('*[class*=Float]')  ||
               Y.one('*[class*=Large]')  ||
               Y.one('*[class*=Small]')  ||
               Y.one('*[class*=Blue]')   ||
               Y.one('*[class*=Green]')  ||
               Y.one('*[class*=Yellow]') ||
               Y.one('*[class*=White]')  ||
               Y.one('*[class*=Black]')) {
                error.push({level: 'error', text: 'Classname appears potentially non-semantic.'});
            }

            if(Y.one('*[id*=left]')   ||
               Y.one('*[id*=right]:not([id*=opyright])') ||
               Y.one('*[id*=bottom]') ||
               Y.one('*[id*=center]') ||
               Y.one('*[id*=clear]')  ||
               Y.one('*[id*=float]')  ||
               Y.one('*[id*=large]')  ||
               Y.one('*[id*=small]')  ||
               Y.one('*[id*=blue]')   ||
               Y.one('*[id*=green]')  ||
               Y.one('*[id*=yellow]') ||
               Y.one('*[id*=white]')  ||
               Y.one('*[id*=black]')  ||
               Y.one('*[id*=Left]')   ||
               Y.one('*[id*=Right]')  ||
               Y.one('*[id*=Bottom]') ||
               Y.one('*[id*=Center]') ||
               Y.one('*[id*=Clear]')  ||
               Y.one('*[id*=Float]')  ||
               Y.one('*[id*=Large]')  ||
               Y.one('*[id*=Small]')  ||
               Y.one('*[id*=Blue]')   ||
               Y.one('*[id*=Green]')  ||
               Y.one('*[id*=Yellow]') ||
               Y.one('*[id*=White]')  ||
               Y.one('*[id*=Black]')) {
                error.push({level: 'error', text: 'ID appears potentially non-semantic.'});
            }

            if(Y.one('*[class*="\\"]') ||
               Y.one('*[class*="."]')  ||
               Y.one('*[class*="#"]')  ||
               Y.one('*[class*="~"]')  ||
               Y.one('*[class*="!"]')  ||
               Y.one('*[class*="@"]')  ||
               Y.one('*[class*="$"]')  ||
               Y.one('*[class*="%"]')  ||
               Y.one('*[class*="^"]')  ||
               Y.one('*[class*="&"]')  ||
               Y.one('*[class*="*"]')  ||
               Y.one('*[class*="("]')  ||
               Y.one('*[class*=")"]')  ||
               Y.one('*[class*="="]')  ||
               Y.one('*[class*=","]')  ||
               Y.one('*[class*="/"]')  ||
               Y.one('*[class*="\'"]') ||
               Y.one('*[class*=";"]')  ||
               Y.one('*[class*=":"]')  ||
               Y.one('*[class*="\""]') ||
               Y.one('*[class*="?"]')  ||
               Y.one('*[class*=">"]')  ||
               Y.one('*[class*="<"]')  ||
               Y.one('*[class*="["]')  ||
               Y.one('*[class*="]"]')  ||
               Y.one('*[class*="{"]')  ||
               Y.one('*[class*="}"]')  ||
               Y.one('*[class*="|"]')  ||
               Y.one('*[class*="`"]')) {
                error.push({level: 'error', text: 'Class name with an invalid character.'});
            }

            if(Y.one('*[id*="\\"]') ||
               Y.one('*[id*="."]')  ||
               Y.one('*[id*="#"]')  ||
               Y.one('*[id*="~"]')  ||
               Y.one('*[id*="!"]')  ||
               Y.one('*[id*="@"]')  ||
               Y.one('*[id*="$"]')  ||
               Y.one('*[id*="%"]')  ||
               Y.one('*[id*="^"]')  ||
               Y.one('*[id*="&"]')  ||
               Y.one('*[id*="*"]')  ||
               Y.one('*[id*="("]')  ||
               Y.one('*[id*=")"]')  ||
               Y.one('*[id*="="]')  ||
               Y.one('*[id*=","]')  ||
               Y.one('*[id*="/"]')  ||
               Y.one('*[id*="\'"]') ||
               Y.one('*[id*=";"]')  ||
               Y.one('*[id*=":"]')  ||
               Y.one('*[id*="\""]') ||
               Y.one('*[id*="?"]')  ||
               Y.one('*[id*=">"]')  ||
               Y.one('*[id*="<"]')  ||
               Y.one('*[id*="["]')  ||
               Y.one('*[id*="]"]')  ||
               Y.one('*[id*="{"]')  ||
               Y.one('*[id*="}"]')  ||
               Y.one('*[id*="|"]')  ||
               Y.one('*[id*="`"]')) {
                error.push({level: 'error', text: 'ID with an invalid character.'});
            }

            if(error.length > 0) {
                console.log(aqua + '=========================================================================' + reset);
                console.log(aqua + 'Visit http://yahoo.github.com/debugCSS/ for help debugging these problems' + reset);
                for(i; i < error.length; i += 1) {
                    color = error[i]['level'] === 'error' ? red : gray;
                    console.log('* ' + color + error[i]['text'] + reset);

                    if(!warnOnly) {
                        Y.Assert.areNotEqual('error', error[i]['level'], error[i]['text']);
                    }
                }
                console.log(aqua + '=========================================================================' + reset);
            }
        }
    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
}, "0.1", { requires: ["test", "node"]});
