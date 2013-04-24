/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

if (!global.appRoot)global.appRoot = require('path').join(__dirname, '../../../..');
YUI.add('enginemanager-tests', function (Y) {

    var path = require('path');
    var fs = require('fs'),
        arrowRoot = global.appRoot,
        enginemgr = require(arrowRoot + '/lib/util/enginemanager.js'),
        suite = new Y.Test.Suite("engine manager test suite"),
        assert = Y.Assert;

    suite.add(new Y.Test.Case({

        _should:{
            error:{
                "Test get no-exsit test seed":true, //this test should throw an error
                "Test get no-exsit test runner":true
            }
        },

        "Test get engine seed":function () {
            assert.isTrue(new enginemgr().getEngineSeed().indexOf("lib/engine/interface/engine-seed.js") != -1);
            assert.isTrue(new enginemgr().getEngineRunner().indexOf("lib/engine/interface/engine-runner.js") != -1);
        },
        "Test get test seed":function () {
            var self = this;
            assert.isTrue(new enginemgr().getTestSeed("yui").indexOf("lib/engine/yuitest/yuitest-seed.js") != -1);
            assert.isTrue(new enginemgr().getTestRunner("yui").indexOf("lib/engine/yuitest/yuitest-runner.js") != -1);

            assert.isTrue(new enginemgr().getTestSeed("mocha").indexOf("lib/engine/mocha/mocha-seed.js") != -1);
            assert.isTrue(new enginemgr().getTestRunner("mocha").indexOf("lib/engine/mocha/mocha-runner.js") != -1);

            assert.isTrue(new enginemgr().getTestSeed("jasmine").indexOf("lib/engine/jasmine/jasmine-seed.js") != -1);
            assert.isTrue(new enginemgr().getTestRunner("jasmine").indexOf("lib/engine/jasmine/jasmine-runner.js") != -1);

            assert.isTrue(new enginemgr().getTestSeed("qunit").indexOf("lib/engine/qunit/qunit-seed.js") != -1);
            assert.isTrue(new enginemgr().getTestRunner("qunit").indexOf("lib/engine/qunit/qunit-runner.js") != -1);

        },
        "Test get no-exsit test seed":function () {
            new enginemgr().getTestSeed("not-a-engine");
        },
        "Test get no-exsit test runner":function () {
            new enginemgr().getTestRunner("not-a-engine");

        },
        "Test get config json":function () {
            assert.isTrue(Object.keys(new enginemgr().getConfigJason()).length == 0);
            assert.isTrue(Object.keys(new enginemgr().getConfigJason("no-exist-config-path")).length == 0);
            assert.isTrue(Object.keys(new enginemgr().getConfigJason(arrowRoot + "/tests/unit/lib/util/dimensions.json")).length >= 0);
            assert.isTrue(Object.keys(new enginemgr().getConfigJason(arrowRoot + "/tests/unit/lib/util/testSession.js")).length >= 0);
            assert.isTrue(Object.keys(new enginemgr().getConfigJason("{\"ui\":\"ui\"}")).length >= 0);
            assert.isTrue(Object.keys(new enginemgr().getConfigJason("ui:\"ui\"")).length == 0);
            assert.isTrue(Object.keys(new enginemgr().getConfigJason({ui:"ui"})).length >= 0);
            assert.isTrue(Object.keys(new enginemgr().getConfigJason(function () {
            })).length == 0);
        }
    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires:['test']});
 
 
 
 
 
 
 
