/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('selenium-tests', function (Y, NAME) {
    
    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        DriverClass = require(arrowRoot + '/lib/driver/selenium.js'),
        suite = new Y.Test.Suite(NAME),
        A = Y.Assert;

    DriverClass.wdAppPath = arrowRoot + '/tests/unit/stub/webdriver.js';

    function testDriver(sendReport) {
        var driver,
            DriverClass = require(arrowRoot + '/lib/driver/node.js'),
            config,
            testParams,
            nodeProcess,
            pNodeArgs,
            pTestParams,
            reports,
            report,
            executed = false;

        config = {testSeed: 'seed', testRunner: 'runner'};
        testParams = {test: 'test.js', param: 'value'};
        driver = new DriverClass(config, {});
        driver.executeTest({}, testParams, function (errMsg) {
            executed = true;
            if(sendReport) {
                A.isTrue(!errMsg, 'Should have executed driver');
            } else {
                A.isString(errMsg, 'Should have failed to execute driver');
            }
        });

        nodeProcess = stubProcess.curProcess;
        nodeProcess.stdout.notify('data', 'stdout log data');
        nodeProcess.stderr.notify('data', 'stderr log data');
        if(sendReport) {
            nodeProcess.stdout.notify('data', 
                'log data -- TEST RESULT: {"name": "unittest", "failed": 0, "passed": 0}');
        }
        nodeProcess.notify('exit');

        reports = driver.getReports();
        if(sendReport) {
            report = JSON.parse(reports[0]);
            A.areEqual(report.name, 'unittest', 'Report should be added');
        } else {
            A.areEqual(reports.length, 0, 'No report should be added');
        }

        pNodeArgs = JSON.parse(decodeURI(nodeProcess.args[1]));
        A.areEqual(pNodeArgs.seed, 'seed', 'Seed should be passed');
        A.areEqual(pNodeArgs.runner, 'runner', 'Runner should be passed');
        A.areEqual(pNodeArgs.test, 'test.js', 'Test should be passed');
        pTestParams = JSON.parse(decodeURI(nodeProcess.args[2]));
        A.areEqual(pTestParams.param, 'value', 'Params should have been passed');

        A.isTrue(executed, 'Should have executed driver');
    }

    suite.add(new Y.Test.Case({

//        'test driver start stop': function () {
//            var driver,
//                config,
//                started = false,
//                stopped = false;
//
//            // test without selenium host
//            config = {browser: 'mybrowser'};
//            driver = new DriverClass(config, {});
//            driver.start(function (errMsg) {
//                started = true;
//                A.isString(errMsg, 'Should have failed to start driver');
//            });
//            A.isTrue(started, 'Should have started driver');
//
//            started = false;
//            config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'};
//            driver = new DriverClass(config, {});
//            driver.start(function (errMsg) {
//                started = true;
//                A.isTrue(!errMsg, 'Should successfully start driver');
//                driver.stop(function (errMsg) {
//                    stopped = true;
//                    A.isTrue(!errMsg, 'Should successfully stop driver');
//                });
//            });
//
//            A.isTrue(started, 'Should have started driver');
//            A.isTrue(stopped, 'Should have stopped driver');
//        },

        'test driver capabilities': function () {
            var driver,
                config = {},
                caps;

            driver = new DriverClass(config, {});
            caps = driver.getCapabilities();
            A.isString(caps.error, 'Should fail for no browser');

            config = {browser: 'mybrowser'};
            driver = new DriverClass(config, {});
            caps = driver.getCapabilities();
            A.areEqual(caps.browserName, 'mybrowser', 'Should return browser name');

            config = {browser: 'mybrowser-1.0'};
            driver = new DriverClass(config, {});
            caps = driver.getCapabilities();
            A.areEqual(caps.browserName, 'mybrowser', 'Should return browser name');
            A.areEqual(caps.version, '1.0', 'Should return browser version');

        },
//
//        'test navigation': function () {
//            var driver,
//                config,
//                actions;
//
//            config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'};
//            driver = new DriverClass(config, {});
//            driver.start(function (errMsg) {
//                driver.navigate('http://mypage', function () {
//                    driver.stop(function (errMsg) {
//                    });
//                });
//            });
//
//            var actions = driver.getWebDriver().actions;
//            A.isTrue('http://mypage' === actions[0].value, 'Must navigate to the page');
//        },

        'test driver error': function () {
            var driver,
                config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'},
                executed = false;

            driver = new DriverClass(config, {});
            driver.executeTest({}, {}, function (errMsg) {
                executed = true;
                A.isString(errMsg, 'Should have failed for no test file');
            });

            A.isTrue(executed, 'Should have executed driver');
        },

//        'test execute with page load': function () {
//            var self = this,
//                driver,
//                config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'},
//                executed = false;
//
//            driver = new DriverClass(config, {});
//            driver.createDriverJs = function () {
//                return 'driverjs';
//            };
//
//            function validate() {
//                var actions = driver.getWebDriver().actions;
//                A.isTrue(executed, 'Should have successfully executed test');
//                A.areEqual(actions[0].value, 'http://page', 'Should have navigated before test');
//            }
//
//            driver.start(function (errMsg) {
//                var webdriver = driver.getWebDriver();
//                webdriver.scriptResults['return ARROW.testReport;'] = '{"name": "functest", "failed": 0, "passed": 0}';
//
//                driver.executeTest({}, {page: 'http://page', test : 'test.js', customController : false}, function (errMsg) {
//                    executed = !errMsg;
//                    self.resume(validate);
//                });
//                self.wait();
//            });
//        },

//        'test execute with no page load': function () {
//            var self = this,
//                driver,
//                config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'},
//                executed = false;
//
//            driver = new DriverClass(config, {});
//            driver.createDriverJs = function () {
//                return 'driverjs';
//            };
//
//            function validate() {
//                A.isTrue(executed, 'Should have successfully executed test');
//            }
//
//            driver.start(function (errMsg) {
//                var webdriver = driver.getWebDriver();
//                webdriver.scriptResults['return ARROW.testReport;'] = '{"name": "functest", "failed": 0, "passed": 0}';
//
//                driver.executeTest({}, {test: 'test.js'}, function (errMsg) {
//                    executed = !errMsg;
//                    self.resume(validate);
//                });
//                self.wait();
//            });
//        },
//
//        'test action': function () {
//            var self = this,
//                driver,
//                config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'},
//                executed = false;
//
//            function createDriverJs() {
//                return 'driverjs';
//            }
//
//            function validate() {
//                var actions = driver.getWebDriver().actions;
//                A.isTrue(executed, 'Should have successfully executed action');
//                A.areEqual(actions[0].value, 'http://page', 'Should have navigated before test');
//            }
//
//            driver = new DriverClass(config, {});
//            driver.createDriverJs = createDriverJs;
//            driver.start(function (errMsg) {
//                var webdriver = driver.getWebDriver();
//                webdriver.scriptResults['return ARROW.actionReport;'] = '{}';
//
//                driver.executeAction({}, {page: 'http://page', action: 'action.js'}, function (errMsg) {
//                    executed = !errMsg;
//                    self.resume(validate);
//                });
//                self.wait();
//            });
//        },

//        'test action error': function () {
//            var self = this,
//                driver,
//                config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'},
//                executed = false;
//
//            function createDriverJs() {
//                return 'driverjs';
//            }
//
//            function validate() {
//                var actions = driver.getWebDriver().actions;
//                A.isTrue(executed, 'Should have successfully executed action');
//            }
//
//            driver = new DriverClass(config, {});
//            driver.createDriverJs = createDriverJs;
//            driver.start(function (errMsg) {
//                var webdriver = driver.getWebDriver();
//                webdriver.scriptResults['return ARROW.actionReport;'] = '{"error": "action error"}';
//
//                driver.executeAction({}, {action: 'action.js'}, function (errMsg) {
//console.log("executed: " + errMsg);
//                    executed = !!errMsg; // error must not be empty
//                    self.resume(validate);
//                });
//                self.wait();
//            });
//        },


        'test getArrowServerBase': function () {
            var self = this,
                driver,
                config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'},
                executed = false;


            driver = new DriverClass(config, {});
            A.isFalse(driver.getArrowServerBase(),"When Arrow Server is not running, getArrowServerBase should return false");
        },

        'test createDriverJs with bad testJs': function () {
            var self = this,
                driver,
                config = {browser: 'mybrowser', seleniumHost: 'http://wdhub',testRunner: arrowRoot + '/lib/client/yuitest-runner.js', testSeed: arrowRoot + '/lib/client/yuitest-seed.js', clientConfigName : 'client_seed.js'},

            driver = new DriverClass(config, {});
            A.isFalse(driver.createDriverJs({"test" : "not-found.js"},function(e){
                A.areEqual("Error: ENOENT, no such file or directory 'not-found.js'", e.toString(), "File not found error should be caught");
            }),"createDriverJs should return false for blank testParams");
        }
    }));
    
    Y.Test.Runner.add(suite);    
}, '0.0.1' ,{requires:['test']});

