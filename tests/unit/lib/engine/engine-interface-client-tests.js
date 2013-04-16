/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('engine-interface-client-tests', function (Y, NAME) {

    if (!global.ARROW || !global.ARROW.testLibs) {
        global.ARROW = {};
        global.ARROW.onSeeded = function () {
            console.log("seeded");
        }
        global.ARROW.shareLibServerSeed = "server side seed";
        global.ARROW.consoleLog = "";
    }

    var path = require('path'),
        curDir,
        arrowRoot = path.join(__dirname, '../../../..'),
        suite = new Y.Test.Suite(NAME),
        A = Y.Assert;

    suite.add(new Y.Test.Case({
        'setUp':function () {
            curDir = process.cwd();
            process.chdir(arrowRoot);
            require("module")._cache = {};
            window = {};
            window.setTimeout = global.setTimeout;
            window.clearTimeout = global.clearTimeout;
            window.setInterval = global.setInterval;
            window.clearInterval = global.clearInterval;
        },
        'tearDown':function () {
            process.chdir(curDir);
            delete window;
            delete document;
        },

        'test new interface runner':function () {
            require(arrowRoot + '/lib/engine/interface/engine-runner');
            var runner = window.engineRunner,

                _runner = new runner({});

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

        },
        'test new interface client seed':function () {
            require(arrowRoot + '/lib/engine/interface/engine-seed');
            var seed = window.engineSeed,
                _seed = new seed({});

            (function () {
                if (!console.error) {
                    console.error = function (message) {
                        console.log(message);
                    }
                }
                if (!console.debug) {
                    console.debug = function (message) {
                        console.log(message);
                    }
                }
                _seed.captureConsoleMessages();
                console.log("test log");
                console.info("test info");
                console.warn("test warn");
                console.debug("test debug");
                console.error("test error");
                A.isTrue(global.ARROW.consoleLog.indexOf("[LOG]") != -1 &&
                    global.ARROW.consoleLog.indexOf("[WARN]") != -1 &&
                    global.ARROW.consoleLog.indexOf("[DEBUG]") != -1 &&
                    global.ARROW.consoleLog.indexOf("[ERROR]") != -1 &&
                    global.ARROW.consoleLog.indexOf("[INFO]") != -1)
            })();

            _seed.generateServerSideSeed(function () {
                A.isTrue(true);
            });

            _seed.generateClientSideSeed(function () {
                A.isTrue(true);
            });

            document = {};
            document.createElement = function (type) {
                return {};
            }
            document.body = {};
            document.body.appendChild = function (type) {
                type.onload();
            }
            _seed.run();
            A.isTrue(true);
            document.createElement = function (type) {
                return {readyState:"loaded"};
            }
            document.body.appendChild = function (type) {
                type.onreadystatechange();
            }
            _seed.loadScript("url", function () {
                console.log("loaded");
            });
            A.isTrue(true);
        }
    }));

    Y.Test.Runner.add(suite);
}, '0.0.1', {requires:['test']});

