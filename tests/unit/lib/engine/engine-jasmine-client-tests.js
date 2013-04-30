/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('engine-jasmine-client-tests', function (Y, NAME) {

    var jasmine = global.jasmine = {
        getEnv:function () {
            return {
                addReporter:function (item) {

                },
                addReporter:function (item) {

                },
                execute:function (item) {
                }
            }
        },
        ArrowReporter:function () {
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
            window.jasmine = jasmine
        },
        'tearDown':function () {
            process.chdir(curDir);
            delete window;
            delete document;
        },

        'test new jasmine seed':function () {

            document = {};
            document.createElement = function (type) {
                return {onload:function () {
                }};
            }
            document.body = {};
            document.body.appendChild = function (type) {
                type.onload();
            }

            require(arrowRoot + '/lib/engine/interface/engine-seed');

            require(arrowRoot + '/lib/engine/jasmine/jasmine-seed');
            // no exception
            A.isTrue(true);

            document.createElement = function (type) {
                return {readyState:"loaded"};
            }
            document.body.appendChild = function (type) {
                type.onreadystatechange();
            }
            require(arrowRoot + '/lib/engine/jasmine/jasmine-seed');
            A.isTrue(true);
        },

        'test new jasmine runner':function () {
            require(arrowRoot + '/lib/engine/interface/engine-runner');
            require(arrowRoot + '/lib/engine/jasmine/jasmine-runner');
            A.isTrue(true);
        }
    }));

    Y.Test.Runner.add(suite);
}, '0.0.1', {requires:['test']});

