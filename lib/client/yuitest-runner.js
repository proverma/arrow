/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI({ useBrowserConsole: true }).use("get", function (Y) {

    function loadAction() {
        YUI({ useBrowserConsole: true }).use(ARROW.testBag, function (Y) {
            var action = Y.arrow ? Y.arrow.action : null;

            if (!action) {
                ARROW.actionReport = JSON.stringify({"error": "Could not find an action to execute"});
                return;
            }

            try {
                action.testParams = ARROW.testParams;

                action.setUp(function (error, data) {
                    var interval;

                    ARROW.actionReport = JSON.stringify({"error": error, "data": data});
                    if (error) { // we cannot execute the action
                        return;
                    }
                    // wait for the report to be collected before executing the action
                    // because actions are supposed to navigate away
                    interval = setInterval(function () {
                        if (ARROW.actionReported) {
                            clearInterval(interval);
                            action.execute();
                        }
                    }, 100);
                });
            } catch (ex) {
                ARROW.actionReport = JSON.stringify({"error": "Exception: " + ex});
            }
        });
    }

    function completeTest(testRunner) {
        var YTest = YUITest;

        testRunner = YTest.TestRunner;

        if (typeof navigator !== "undefined") {
            testRunner._root.results.ua = navigator.userAgent;
        }
        ARROW.testReport = testRunner.getResults(YTest.ResultsFormat.JSON);
        testRunner.clear();
    }

    function runTest() {
        var YTest = YUITest,
            testRunner = YTest.TestRunner;

        function asyncForEach(array, fn, callback) {
            var completed = 0;
            if (array.length === 0) {
                callback(); // done immediately
            }
            var len = array.length;
            for (var i = 0; i < len; i++) {
                fn(array[i], function () {
                    completed++;
                    if (completed === array.length) {
                        callback();
                    }
                });
            }
        }

        asyncForEach(testRunner.masterSuite.items, function (el, callback) {
            el.testParams = ARROW.testParams;
            if (el.items) {
                asyncForEach(el.items, arguments.callee, function () {
                    return callback();
                });
            } else {
                callback();
            }
        }, function () {
            testRunner.subscribe(testRunner.COMPLETE_EVENT, completeTest);
            if (typeof testRunner.origin_run === "function") {
                testRunner.run = testRunner.origin_run;
                testRunner.origin_run = null;
            }
            testRunner.run();
        });
    }

    function loadTest() {
        YUI({ useBrowserConsole: true }).use(ARROW.testBag, function (Y) {
            runTest();
        });
    }

    function autoTest() {
        var YTest = window.YUITest,
            testRunner;
        if (!YTest) {
            return window.setTimeout(autoTest, 50);
        }

        testRunner = YTest.TestRunner;
        if (testRunner._root && testRunner._root.results && "report" === testRunner._root.results.type) {
            completeTest();
        } else {
            testRunner.subscribe(testRunner.COMPLETE_EVENT, completeTest);
        }
    }

    if (ARROW.autoTest) {
        autoTest();
    } else {
        loadTest();
    }
});

