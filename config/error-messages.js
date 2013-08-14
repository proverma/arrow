/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
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
		text : 'ARROW is not defined on testing page {0}\n' +
			'Please check following:\n' +
			'1. page is not reloaded.\n' +
			'2. page is not switched to other page.\n' +
			'3. page is loaded and not blank.\n' +
			'For Arrow Usage, please refer to https://github.com/yahoo/arrow/blob/master/docs/arrow_cookbook/README.rst',
		0 : empty
	},
	1005 : {
		name : 'EDSCYCB',
		text : 'YCB Variable Replacement Failed, Please check you descriptor file, {0}.\nError: {1}',
		0 : empty
	}
};

module.exports = error;
