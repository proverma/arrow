/*
 * Copyright (c) 2012-2013, Yahoo! Inc. All rights reserved.
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

    suite.add(new Y.Test.Case({

        'test driver start stop': function () {
            var driver,
                config,
                started = false,
                stopped = false;

            // test without selenium host
            config = {browser: 'mybrowser'};
            driver = new DriverClass(config, {});

            driver.start(function (errMsg) {
                started = true;
                A.isString(errMsg, 'Should have failed to start driver');
            });
            A.isTrue(started, 'Should have started driver');

            started = false;
            config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'};
            driver = new DriverClass(config, {});
            driver.sessionId = "SomeSessionId";
            driver.start(function (errMsg) {

                started = true;
                A.isTrue(!errMsg, 'Should successfully start driver');

                driver.stop(function (errMsg) {

                    stopped = true;
                    A.isTrue(!errMsg, 'Should successfully stop driver');

                });
            });

            A.isTrue(started, 'Should have started driver');
            A.isTrue(stopped, 'Should have stopped driver');

        },

        'test driver start stop phantomjs': function () {
            var driver,
                config,
                started = false,
                stopped = false;

            config = {browser: 'phantomjs', phantomHost: 'http://wdhub'};
            driver = new DriverClass(config, {});
            driver.start(function (errMsg) {

                started = true;
                A.isTrue(!errMsg, 'Should successfully start driver');

                driver.stop(function (errMsg) {

                    stopped = true;
                    A.isTrue(!errMsg, 'Should successfully stop driver');

                });
            });

            A.isTrue(started, 'Should have started driver');
            A.isTrue(stopped, 'Should have stopped driver');

        },

        'test driver capabilities': function () {
            var driver,
                config = {},
                caps,
                capabilitiesFile = __dirname + "/config/capabilities.json";

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


            config = {browser: 'firefox', proxyUrl: 'http://proxyUrl', capabilities: capabilitiesFile};
            driver = new DriverClass(config, {});

            caps = driver.getCapabilities();
            A.areEqual(caps.browserName, 'firefox', 'Should return browser name');
            A.areEqual(caps.version, '16.0', 'Should return browser version');

            // Pass capabilities file
            config = {browser: 'firefox', proxyUrl: 'http://proxyUrl', capabilities: capabilitiesFile};
            driver = new DriverClass(config, {});

            caps = driver.getCapabilities();
            A.areEqual(caps.browserName, 'firefox', 'Should return browser name');
            A.areEqual(caps.version, '16.0', 'Should return browser version');


            // Pass capabilities file, browser not mentioned in capabilities file
            config = {browser: 'undefinedBrowser', proxyUrl: 'http://proxyUrl', capabilities: capabilitiesFile};
            driver = new DriverClass(config, {});

            caps = driver.getCapabilities();
            A.areEqual(caps.browserName, 'undefinedBrowser', 'Should return browser name');

            // Pass browser version in config
            config = {browser: 'firefox', proxyUrl: 'http://proxyUrl', firefoxVersion: '16.0'};
            driver = new DriverClass(config, {});

            caps = driver.getCapabilities();
            A.areEqual(caps.browserName, 'firefox', 'Should return browser name');
            A.areEqual(caps.version, '16.0', 'Should return browser version');


        },

        'test navigation': function () {
            var driver,
                config,
                actions;

            config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'};
            driver = new DriverClass(config, {});
            driver.start(function (errMsg) {
                driver.navigate('http://mypage', function () {
                    driver.stop(function (errMsg) {
                    });
                });
            });

            actions = driver.getWebDriver().actions;
            A.isTrue('http://mypage' === actions[0].value, 'Must navigate to the page');
        },

        'test navigation invalid page': function () {
            var driver,
                config,
                actions;

            config = {browser: 'mybrowser', seleniumHost: 'wdhub'};
            driver = new DriverClass(config, {});
            driver.start(function (errMsg) {
                driver.navigate('http://mypage', function () {
                    driver.stop(function (errMsg) {
                    });
                });
            });

            actions = driver.getWebDriver().actions;
            A.isTrue('http://mypage' === actions[0].value, 'Must navigate to the page');
        },


        'test navigation arrow server not running': function () {
            var driver,
                config,
                actions;

            config = {browser: 'mybrowser', seleniumHost: 'wdhub'};
            driver = new DriverClass(config, {});
            driver.start(function (errMsg) {
                driver.navigate('mypage', function () {
                    driver.stop(function (errMsg) {
                    });
                });
            });

            actions = driver.getWebDriver().actions;
            A.isTrue(actions.length === 0, 'Actions shall be blank');
        },



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


        'test execute with page load': function () {
            var self = this,
                driver,
                config = {browser: 'mybrowser', seleniumHost: 'http://wdhub', coverage: true},
                executed = false;

            driver = new DriverClass(config, {});
            driver.createDriverJs = function (params,cb) {
                cb(null, 'driverjs');
            };

            function validate() {
                var actions = driver.getWebDriver().actions;
                A.isTrue(executed, 'Should have successfully executed test');
                A.areEqual(actions[0].value, 'http://page', 'Should have navigated before test');
            }

            driver.start(function (errMsg) {
                var webdriver = driver.getWebDriver();
                webdriver.scriptResults['return ARROW.testReport;'] = '{"name": "functest", "failed": 0, "passed": 0}';

                driver.executeTest({}, {page: 'http://page', test : 'test.js', customController : false}, function (errMsg) {
                    console.log(errMsg);
                    executed = !errMsg;
                    validate();
                });
            });
        },

        'test execute with no page load': function () {
            var self = this,
                driver,
                config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'},
                executed = false;

            driver = new DriverClass(config, {});
            driver.createDriverJs = function (params,cb) {
                cb( null, 'driverjs');
            };

            function validate() {
                A.isTrue(executed, 'Should have successfully executed test');
            }

            driver.start(function (errMsg) {
                var webdriver = driver.getWebDriver();
                webdriver.scriptResults['return ARROW.testReport;'] = '{"name": "functest", "failed": 0, "passed": 0}';

                driver.executeTest({}, {test: 'test.js'}, function (errMsg) {
                    executed = !errMsg;
                    validate()
                });
            });
        },


        'test execute with android - minifyjs': function () {
            var self = this,
                driver,
                config = {browser: 'android', seleniumHost: 'http://wdhub'},
                executed = false;

            driver = new DriverClass(config, {});
            driver.createDriverJs = function (params,cb) {
                cb(null,'if (time<20) { a=3; }');
            };

            function validate() {
                A.isTrue(executed, 'Should have successfully executed test');
            }

            driver.start(function (errMsg) {
                var webdriver = driver.getWebDriver();
                webdriver.scriptResults['return ARROW.testReport;'] = '{"name": "functest", "failed": 0, "passed": 0}';

                driver.executeTest({}, {test: 'test.js'}, function (errMsg) {
                    executed = !errMsg;
                    validate();
                });
            });
        },


        'test action': function () {
            var self = this,
                driver,
                config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'},
                executed = false;

            function createDriverJs(params,cb) {
                cb( null,'driverjs');
            }

            function validate() {
                var actions = driver.getWebDriver().actions;
                A.isTrue(executed, 'Should have successfully executed action');
                A.areEqual(actions[0].value, 'http://page', 'Should have navigated before test');
            }

            driver = new DriverClass(config, {});
            driver.createDriverJs = createDriverJs;
            driver.start(function (errMsg) {
                var webdriver = driver.getWebDriver();
                webdriver.scriptResults['return ARROW.actionReport;'] = '{}';

                driver.executeAction({}, {page: 'http://page', action: 'action.js'}, function (errMsg) {
                    executed = !errMsg;
                    validate();
                });
            });
        },


        'test action error': function () {
            var self = this,
                driver,
                config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'},
                executed = false;

            function createDriverJs(params,cb) {
                cb( null,'driverjs');
            }

            function validate() {
                var actions = driver.getWebDriver().actions;
                A.isTrue(executed, 'Should have successfully executed action');
            }

            driver = new DriverClass(config, {});
            driver.createDriverJs = createDriverJs;
// driver.maxAttempt = 1;//Added for test
            driver.start(function (errMsg) {
                var webdriver = driver.getWebDriver();
                webdriver.scriptResults['return ARROW.actionReport;'] = '{"error": "action error"}';

                driver.executeAction({}, {action: 'action.js'}, function (errMsg) {
                    executed = !!errMsg; // error must not be empty
                    validate();
                });
            });
        },


        'test getArrowServerBase': function () {
            var self = this,
                driver,
                config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'},
                executed = false;

            driver = new DriverClass(config, {});
            A.isFalse(driver.getArrowServerBase(), "When Arrow Server is not running, getArrowServerBase should return false");
        },

        'test createDriverJs with bad testJs': function () {
            var self = this,
                config = {arrowModuleRoot:arrowRoot,browser: 'mybrowser', seleniumHost: 'http://wdhub', testRunner: arrowRoot + '/lib/client/yuitest-runner.js', testSeed: arrowRoot + '/lib/client/yuitest-seed.js'},
                driver = new DriverClass(config, {}),
                filePath = "'" + arrowRoot + "/not-found.js" + "'";
            global.workingDirectory = arrowRoot;

            driver.createDriverJs({"test" : "not-found.js"}, function (e) {
                A.areEqual("Error: ENOENT, no such file or directory " + filePath, e.toString(), "File not found error should be caught");
            }), "createDriverJs should return false for blank testParams";
            global.workingDirectory = '';
        },

        'test createDriverJs ': function () {
            var self = this,
                testRunnerJs = arrowRoot + '/tests/unit/lib/driver/config/testRunner.js',
                libJs = arrowRoot + '/tests/unit/lib/driver/config/lib.js',
                seedJs = arrowRoot + '/tests/unit/lib/driver/config/seed.js',
                actionJs = arrowRoot + '/tests/unit/lib/driver/config/action.js',
                testHtml = arrowRoot + '/tests/unit/lib/driver/config/test.html',
                config = {
                    arrowModuleRoot:arrowRoot,
                    coverage: 'true',
                    browser: 'mybrowser',
                    seleniumHost: 'http://wdhub',
                    testRunner: testRunnerJs,
                    testSeed: seedJs
                },
                driver = new DriverClass(config, {});

            driver.createDriverJs({"test" : testRunnerJs,
                "lib" : libJs}, function (e) {
                A.areEqual(null, e, "There should be no error");
            });

            config = { browser: 'mybrowser',
                seleniumHost: 'http://wdhub',
                testRunner: testRunnerJs,
                testSeed: seedJs,
                arrowModuleRoot:arrowRoot
            };
            driver = new DriverClass(config, {});
            driver.createDriverJs({"test" : testRunnerJs,
                "lib" : "," + libJs, "action" : actionJs}, function (e) {
                A.areEqual(null, e, "There should be no error");
            });

            // Without test
            driver = new DriverClass(config, {});
            driver.createDriverJs({ "lib" : "," + libJs, "action" : actionJs}, function (e) {
                A.areEqual(null, e, "There should be no error");
            });

            // with html test
            driver = new DriverClass(config, {});
            driver.createDriverJs({"test" : testHtml,
                "lib" : "," + libJs, "action" : actionJs}, function (e) {
                A.areEqual(null, e, "There should be no error");
            });

        }

    }));

    Y.Test.Runner.add(suite);
}, '0.0.1', {requires: ['test']});

