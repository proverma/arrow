/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('sauceLabsUtil-tests', function (Y) {

    var path = require('path'),
        mockery = require('mockery'),
        arrowRoot = path.join(__dirname, '../../../..'),
        SauceLabsUtil,
        suite = new Y.Test.Suite("SauceLabs Util test suite"),
        sauceLabsUtil;

    suite.setUp = function () {
    }

    suite.tearDown = function () {
        mockery.disable();
        mockery.deregisterAll();
    }

    suite.add(new Y.Test.Case({
        "Update Job Status failed": function(){
            var result =
                {"passed":true, "name": 'SauceTestName'},
                sessionId = 'SauceSessionId',
                sauceUserName = 'Username',
                sauceAccessKey = 'AccessKey';

            var sauceLabsMock = require(arrowRoot + '/tests/unit/stub/SauceLabs');
            mockery.registerMock('saucelabs', sauceLabsMock);
            mockery.enable();

            SauceLabsUtil = require(arrowRoot + '/lib/util/sauceLabsUtil.js');
            sauceLabsUtil = new SauceLabsUtil();

            sauceLabsMock.prototype.updateJob = function(sessionId, result, callback) {
                callback(new Error('error'));
            };

            sauceLabsUtil.updateJobStatus(result,
                sessionId,
                sauceUserName,
                sauceAccessKey,
                function (error){
                    Y.Assert.isNotNull(error);
                    Y.Assert.areEqual(error.message,'Error updating Sauce pass/fail status: Error: error',
                    'Error message does not match');
                    mockery.deregisterMock('saucelabs');
                });
        }

    }));

    suite.add(new Y.Test.Case({
        "Update Job Status Passed": function(){
            var result =
            {"passed":true, "name": 'SauceTestName'},
                sessionId = 'SauceSessionId',
                sauceUserName = 'Username',
                sauceAccessKey = 'AccessKey';

            var sauceLabsMock = require(arrowRoot + '/tests/unit/stub/SauceLabs');
            mockery.registerMock('saucelabs', sauceLabsMock);
            mockery.enable();

            SauceLabsUtil = require(arrowRoot + '/lib/util/sauceLabsUtil.js');
            sauceLabsUtil = new SauceLabsUtil();

            sauceLabsMock.prototype.updateJob = function(sessionId, result, callback) {
                callback(null);
            };

            sauceLabsUtil.updateJobStatus(result,
                sessionId,
                sauceUserName,
                sauceAccessKey,
                function (error){
                    Y.Assert.isNull(error);
                    mockery.deregisterMock('saucelabs');
                });
        }
    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires:['test']});
 
