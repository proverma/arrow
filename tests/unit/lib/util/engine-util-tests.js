/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('engine-util-tests', function (Y, NAME) {

    var suite = new Y.Test.Suite(NAME),
        A = Y.Assert;

    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        engineUtil = require(arrowRoot+'/lib/util/engineUtil.js');

        var engUtil = new engineUtil();

        engUtil.mock = {
            exit: function (code) {
                throw new Error("exit code is "+code);
            }
        };

    suite.add(new Y.Test.Case({
        'test engine util error matches':function () {

            var error = new Error("Cannot find module \'yui\'");

            try {
                engUtil.handleYUIRequireError(error);
            }
            catch(e) {
                A.areEqual(e.message,'exit code is 2', "Process should exit if YUI is missing");
            }

        },

        'test engine util error does not match':function () {

            var error = new Error("NOT MATCHING");

            try {
                engUtil.handleYUIRequireError(error);
            }
            catch(e) {
                A.areNotEqual(e.message,'exit code is 2', "Process should NOT exit if YUI is NOT missing");
            }

        }


    }));

    Y.Test.Runner.add(suite);
}, '0.0.1', {requires:['test']});

