/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('engine-qunit-tests', function (Y, NAME) {

    // mocked qunit
    var qunit = global.QUnit = {
        init:function () {
        },
        start:function () {
        },
        moduleStart:function (cb) {
            cb({name:"teststart"});
        },
        testDone:function (cb) {
            cb({name:"testdone"});
        },
        log:function (cb) {
            cb({message:"testlog", expected:"expected"});
        },
        done:function (cb) {
            cb({runtime:0, total:0, failed:0, passed:0});
        }
    };

    if (!global.ARROW || !global.ARROW.testLibs) {
        global.ARROW = {};
        global.ARROW.onSeeded = function () {
            console.log("seeded");
        }
        global.ARROW.shareLibServerSeed = "server seed";
        global.ARROW.consoleLog = "";
        global.ARROW.testLibs = [__dirname + "/test-data.js"];
        global.ARROW.testfile = __dirname + "/test-data.js";
    }
    if (typeof window !== "undefined") delete window;

    var path = require('path'),
        curDir,
        arrowRoot = path.join(__dirname, '../../../..'),

        suite = new Y.Test.Suite(NAME),
        A = Y.Assert,
        mockery = require("mockery");

    suite.add(new Y.Test.Case({
        'setUp':function () {
            mockery.enable({ useCleanCache: true });
            mockery.registerMock('qunit', qunit);
        },
        'tearDown':function () {
            mockery.deregisterMock('qunit');
            mockery.disable();
        },
        'test new interface seed':function () {
            // if can require,it will run we assert its true
            require(arrowRoot + '/lib/engine/qunit/qunit-seed');
            Y.Assert.isTrue(true);
        },
        'test new interface runner':function () {
            require(arrowRoot + '/lib/engine/qunit/qunit-runner');
            Y.Assert.isTrue(true);
        }
    }));

    Y.Test.Runner.add(suite);
}, '0.0.1', {requires:['test']});

