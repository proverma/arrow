/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var isCommonJS = typeof window === "undefined" && typeof exports === "object";
var runner = isCommonJS ? require('../interface/engine-runner').engineRunner : window.engineRunner;

/**
 * @constructor
 * @param config yui engine config
 */
function yuitestRunner(config) {
    this.config = config || {};
    runner.call(this, config);
}

yuitestRunner.prototype = Object.create(runner.prototype);

/**
 * yuitest set client side reporter
 * @param cb
 */
yuitestRunner.prototype.setClientSideReporter = function (cb) {
    cb();
};

/**
 * yuitest set server side reporter
 * @param cb
 */
yuitestRunner.prototype.setServerSideReporter = function (cb) {
    cb();
};


/**
 * register event for yui test runner complete
 * @param testRunner
 */
yuitestRunner.prototype.completeTest = function (testRunner) {
    var YTest = YUITest;

    testRunner = YTest.TestRunner;

    if (typeof navigator !== "undefined") {
        testRunner._root.results.ua = navigator.userAgent;
    }
    ARROW.testReport = testRunner.getResults(YTest.ResultsFormat.JSON);
    testRunner.clear();
};

/**
 * call yuitest runner
 * @param cb
 */
yuitestRunner.prototype.runRunner = function (cb) {
    var self = this;
    YUI({ useBrowserConsole: true }).use("get", function (Y) {

        function runTest() {
            var YTest = YUITest,
                testRunner = YTest.TestRunner,
                i;

            function injectConfig(suites) {
                for (i = 0; i < suites.length; i += 1) {
                    var suite = suites[i];
                    suite.testParams = ARROW.testParams;
                    if (suite.items) {
                        injectConfig(suite.items);
                    }
                }
            }

            injectConfig(testRunner.masterSuite.items);

            testRunner.subscribe(testRunner.COMPLETE_EVENT, self.completeTest);
            testRunner.run();
            cb();
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
                self.completeTest();
            } else {
                testRunner.subscribe(testRunner.COMPLETE_EVENT, self.completeTest);
            }
        }

        function fetchTest(testScript) {
            if (testScript.length > 0) {
                Y.Get.script(testScript, {
                    onSuccess: function (o) {
                        loadTest();
                    }
                });
            } else {
                loadTest();
            }
        }

        function fetchScript() {

            if (ARROW.scriptType) {
                if ("test" === ARROW.scriptType) {
                    fetchTest(ARROW.testScript);
                }
            } else {
                fetchTest(ARROW.testScript);
            }
        }

        if (ARROW.autoTest) {
            autoTest();
        } else if (ARROW.testLibs.length > 0) {
            Y.Get.script(ARROW.testLibs, {
                onSuccess: function (o) {
                    fetchScript();
                },
                async: false // TODO: could async true create dependency issue
            });
        } else {
            fetchScript();
        }
    });
};

/**
 * call yuitest to collect report
 * @param cb
 */
yuitestRunner.prototype.collectReport = function (cb) {
    cb();
};

new yuitestRunner(ARROW.engineConfig).run();




