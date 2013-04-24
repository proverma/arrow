/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/
/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('engine-interface-tests', function (Y, NAME) {

    if (!global.ARROW || !global.ARROW.testLibs) {
        global.ARROW = {};
        global.ARROW.onSeeded = function () {
            console.log("seeded");
        }
        global.ARROW.shareLibServerSeed = seed;
        global.ARROW.consoleLog = "";
    }
    if (typeof window !== "undefined") delete window;

    var path = require('path'),
        curDir,
        arrowRoot = path.join(__dirname, '../../../..'),

        runner = require(arrowRoot + '/lib/engine/interface/engine-runner').engineRunner,
        seed = require(arrowRoot + '/lib/engine/interface/engine-seed').engineSeed,

        suite = new Y.Test.Suite(NAME),
        A = Y.Assert;


    suite.add(new Y.Test.Case({
        'setUp':function () {
            curDir = process.cwd();
            process.chdir(arrowRoot);
            require("module")._cache = {};
        },
        'tearDown':function () {
            process.chdir(curDir);
        },

        'test new interface runner':function () {
            var _runner = new runner({});

            _runner.setClientSideReporter(function () {
                A.isTrue(true);
            });

            _runner.setServerSideReporter(function () {
                A.isTrue(true);
            });

            _runner.collectReport(function () {
                A.isTrue(true);
            });

            _runner.run();

            A.isTrue(true); // no exception
        },
        'test new interface seed':function () {
            var _seed = new seed({});

            _seed.generateServerSideSeed(function () {
                A.isTrue(true);
            });

            _seed.generateClientSideSeed(function () {
                A.isTrue(true);
            });

            _seed.run();

            A.isTrue(true); // no exception
        }
    }));

    Y.Test.Runner.add(suite);
}, '0.0.1', {requires:['test']});

