/*
 * Copyright (c) 2012, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var pathNotFound = "Path is not defined", empty = "", error = {
    1000 : {
        name : 'EDIMENV',
        text : 'The environment "{0}" is missing.\n' +
            'Please add environment "{0}" to dimensions file "{1}".',
        0 : empty,
        1 : pathNotFound
    },
    1001 : {
        name : 'ECHKDIM',
        text : "Please check dimensions file {0}. Wrong dimensions format : {1}",
        0 : pathNotFound,
        1 : "Dimensions is not defined"
    },
    1002 : {
        name : 'EREPORT',
        text : '{0} while collecting test result on testing page "{1}".\n{2}',
        0 : "Unknown error",
        1 : "page URL is not available",
        2 : empty
    },
    1003 : {
        name : 'EDSCENV',
        text : 'The settings {0} is missing.\n' +
            'Please add environment "{1}" to dimensions file "{2}"\n' +
            'or remove it from test descriptor file "{3}".',
        0 : empty,
        1 : empty,
        2 : pathNotFound,
        3 : pathNotFound
    },
    1004 : {
        name : 'EUNDEF',
        text :'Issue with loading testing page {0}\n' +
            'Possible cause :\n' +
            'The page got redirected before completing the test, this happens if your page has auto-redirects ' +
            'or your tests perform some UI action resulting into page change event. Please use a custom controller for these kind of issues.\n' +
            'If you are already using custom controller, please check that you are using waitForElement(s) to ensure page is ready for executing test.\n' +
            'For Arrow Usage, please refer to https://github.com/yahoo/arrow/blob/master/docs/arrow_cookbook/README.rst',
        0 : empty
    },
    1005 : {
        name : 'EDSCYCB',
        text : 'YCB Variable Replacement Failed, Please check you descriptor file, {0}.\nError: {1}',
        0 : empty
    },
    1006 : {
        name : 'ENULLARG',
        text : 'Argument "{0}" is "{1}".'
    }
};

module.exports = error;