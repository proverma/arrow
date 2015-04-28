/*
 * Copyright (c) 2012-2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('selenium-tests', function (Y, NAME) {

    var path = require('path'),
        mockery = require('mockery'),
        arrowRoot = path.join(__dirname, '../../../..'),
        suite = new Y.Test.Suite(NAME),
        A = Y.Assert,
        DriverClass,
        CapabilityManagerClass;

    //DriverClass.wdAppPath = arrowRoot + '/tests/unit/stub/webdriver.js';
    suite.setUp = function () {
        var wdMock = require(arrowRoot + '/tests/unit/stub/webdriver');
        mockery.registerMock('../util/wd-wrapper', wdMock);
        mockery.enable();
        DriverClass = require(arrowRoot + '/lib/driver/selenium.js');
        CapabilityManagerClass = require(arrowRoot + '/lib/util/capabilitymanager.js');

    };

    suite.tearDown = function () {
        mockery.disable();
        mockery.deregisterAll();
    };

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
                capabilitiesFile = __dirname + "/config/capabilities.json",
                cm = new CapabilityManagerClass();

            driver = new DriverClass(config, {});
            caps = cm.getCapabilities(driver.args, driver.config);
            A.isString(caps.error, 'Should fail for no browser');

            config = {browser: 'mybrowser'};
            driver = new DriverClass(config, {});
            caps = cm.getCapabilities(driver.args, driver.config);
            A.areEqual(caps.browserName, 'mybrowser', 'Should return browser name');

            config = {browser: 'mybrowser-1.0'};
            driver = new DriverClass(config, {});
            caps = cm.getCapabilities(driver.args, driver.config);
            A.areEqual(caps.browserName, 'mybrowser', 'Should return browser name');
            A.areEqual(caps.version, '1.0', 'Should return browser version');


            config = {browser: 'firefox', proxyUrl: 'http://proxyUrl', capabilities: capabilitiesFile};
            driver = new DriverClass(config, {});
            caps = cm.getCapabilities(driver.args, driver.config);
            A.areEqual(caps.browserName, 'firefox', 'Should return browser name');
            A.areEqual(caps.version, '16.0', 'Should return browser version');

            // Pass capabilities file
            config = {browser: 'firefox', proxyUrl: 'http://proxyUrl', capabilities: capabilitiesFile};
            driver = new DriverClass(config, {});
            caps = cm.getCapabilities(driver.args, driver.config);
            A.areEqual(caps.browserName, 'firefox', 'Should return browser name');
            A.areEqual(caps.version, '16.0', 'Should return browser version');
//

            // Pass capabilities file, browser not mentioned in capabilities file
            config = {browser: 'undefinedBrowser', proxyUrl: 'http://proxyUrl', capabilities: capabilitiesFile};
            driver = new DriverClass(config, {});
            caps = cm.getCapabilities(driver.args, driver.config);
            A.areEqual(caps.browserName, 'undefinedBrowser', 'Should return browser name');

            // Pass browser version in config
            config = {browser: 'firefox', proxyUrl: 'http://proxyUrl', firefoxVersion: '16.0'};
            driver = new DriverClass(config, {});
            caps = cm.getCapabilities(driver.args, driver.config);
            A.areEqual(caps.browserName, 'firefox', 'Should return browser name');
            A.areEqual(caps.version, '16.0', 'Should return browser version');

        },

        'test navigation': function () {
            var driver,
                config,
                actions,
                params;

            config = {browser: 'mybrowser', seleniumHost: 'http://wdhub'};
            driver = new DriverClass(config, {});
            params = {
                page: 'http://mypage'
            };
            driver.start(function (errMsg) {
                driver.navigate(params, function () {
                    driver.stop(function (errMsg) {
                    });
                });
            });

            actions = driver.getWebDriver()._actions;
            A.isTrue('http://mypage' === actions[0].value, 'Must navigate to the page');
        },

        'test navigation invalid page': function () {
            var driver,
                config,
                actions,
                params;

            config = {browser: 'mybrowser', seleniumHost: 'wdhub'};
            driver = new DriverClass(config, {});
            params = {
                page: 'http://mypage'
            };
            driver.start(function (errMsg) {
                driver.navigate(params, function () {
                    driver.stop(function (errMsg) {
                    });
                });
            });

            actions = driver.getWebDriver()._actions;
            A.isTrue('http://mypage' === actions[0].value, 'Must navigate to the page');
        },


        'test navigation arrow server not running': function () {
            var driver,
                config,
                actions,
                params;

            config = {browser: 'mybrowser', seleniumHost: 'wdhub'};
            driver = new DriverClass(config, {});
            params = {
                page: 'mypage'
            };
            driver.start(function (errMsg) {
                driver.navigate(params, function () {
                    driver.stop(function (errMsg) {
                    });
                });
            });

            actions = driver.getWebDriver()._actions;
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
            driver.createDriverJs = function (params, cb) {
                cb(null, 'driverjs');
            };

            function validate() {
                var actions = driver.getWebDriver()._actions;
                A.isTrue(executed, 'Should have successfully executed test');
                A.areEqual(actions[0].value, 'http://page', 'Should have navigated before test');
            }

            driver.start(function (errMsg) {
                var webdriver = driver.getWebDriver();
                webdriver.scriptResults['return ARROW.testReport;'] = '{"name": "functest", "failed": 0, "passed": 0}';
                driver.executeTest({}, {page: 'http://page', test: 'test.js', customController: false}, function (errMsg) {
                    executed = !errMsg;
                    validate();
                });
            });
        },

        'test execute with page load w/ sauceLabs': function () {
            var self = this,
                driver,
                config = {
                    browser: 'mybrowser',
                    seleniumHost: 'http://wdhub',
                    coverage: true,
                    isSauceLabs: true
                },
                executed = false,
                wdMock = require(arrowRoot + '/tests/unit/stub/webdriver');

                wdMock.WebDriver.prototype.getCapabilities = function (cb) {
                    var self = this;
                    return {
                        then: function (cb) {
                            var Capabilities = function () {
                            };

                            Capabilities.prototype.set = function (caps) {
                                self.caps = caps;
                            };

                            Capabilities.prototype.get = function (key) {
                                var val;
                                if (self.caps.hasOwnProperty(key)) {
                                    val = self.caps[key];
                                }
                                return val;

                            };

                            self.capabilities = new Capabilities();
                            self.capabilities.set(self.caps);
                            self.capabilities.caps_ = {};
                            self.capabilities.caps_['webdriver.remote.sessionid'] =
                                'sauceSessionId';
                            cb(self.capabilities);

                        }
                    };
                };

                mockery.registerMock('../util/wd-wrapper', wdMock);
                mockery.enable({ useCleanCache: true });

                driver = new DriverClass(config, {});
                driver.createDriverJs = function (params, cb) {
                    cb(null, 'driverjs');
                };

                function validate() {
                    var actions = driver.getWebDriver()._actions;
                    A.isTrue(executed, 'Should have successfully executed test');
                    A.areEqual(actions[0].value, 'http://page', 'Should have navigated before test');
                }

            driver.start(function (errMsg) {
                var webdriver = driver.getWebDriver();
                webdriver.scriptResults['return ARROW.testReport;'] = '{"name": "functest", "failed": 0, "passed": 0}';
                driver.executeTest({}, {page: 'http://page', test: 'test.js', customController: false}, function (errMsg) {
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
            driver.createDriverJs = function (params, cb) {
                cb(null, 'driverjs');
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
            driver.createDriverJs = function (params, cb) {
                cb(null, 'if (time<20) { a=3; }');
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

        'test getArrowServerBase': function () {
            var self = this,
                driver,
                config = {},
                args = {browser: 'mybrowser', seleniumHost: 'http://wdhub'},
                executed = false;

            driver = new DriverClass(config, args);
            A.isFalse(driver.getArrowServerBase(), "When Arrow Server is not running, getArrowServerBase should return false");
        },

        'test createDriverJs with bad testJs': function () {
            var self = this,
                config = {arrowModuleRoot: arrowRoot, browser: 'mybrowser', seleniumHost: 'http://wdhub', testRunner: arrowRoot + '/lib/client/yuitest-runner.js', testSeed: arrowRoot + '/lib/client/yuitest-seed.js'},
                driver = new DriverClass(config, {}),
                filePath = "'" + arrowRoot + "/not-found.js" + "'";
            global.workingDirectory = arrowRoot;

            driver.createDriverJs({"test": "not-found.js"}, function (e) {
                A.areEqual("Error: ENOENT, no such file or directory " + filePath, e.toString(), "File not found error should be caught");
            }), "createDriverJs should return false for blank testParams";
            global.workingDirectory = '';
        },

        'test createDriverJs ': function () {
            var self = this,
                testRunnerJs = arrowRoot + '/tests/unit/lib/driver/config/testRunner.js',
                libJs = arrowRoot + '/tests/unit/lib/driver/config/lib.js' + ' , ' + arrowRoot + '/tests/unit/lib/driver/config/lib.js',
                seedJs = arrowRoot + '/tests/unit/lib/driver/config/seed.js',
                testHtml = arrowRoot + '/tests/unit/lib/driver/config/test.html',
                config = {
                    arrowModuleRoot: arrowRoot,
                    coverage: 'true',
                    browser: 'mybrowser',
                    seleniumHost: 'http://wdhub',
                    testRunner: testRunnerJs,
                    testSeed: seedJs
                },
                driver = new DriverClass(config, {});

            driver.createDriverJs({"test": testRunnerJs,
                "lib": libJs}, function (e) {
                A.areEqual(null, e, "There should be no error");
            });

            config = { browser: 'mybrowser',
                seleniumHost: 'http://wdhub',
                testRunner: testRunnerJs,
                testSeed: seedJs,
                arrowModuleRoot: arrowRoot
            };
            driver = new DriverClass(config, {});
            driver.createDriverJs({"test": testRunnerJs,
                "lib": "," + libJs}, function (e) {
                A.areEqual(null, e, "There should be no error");
            });

            // Without test
            driver = new DriverClass(config, {});
            driver.createDriverJs({ "lib": "," + libJs}, function (e) {
                A.areEqual("The test js must be specified", e, "Message should be - The test js must be specified");
            });

            // with html test
            driver = new DriverClass(config, {});
            driver.createDriverJs({"test": testHtml,
                "lib": "," + libJs}, function (e) {
                A.areEqual(null, e, "There should be no error");
            });

        },
        'test createDriverJs share lib load': function () {

            var self = this,
                testRunnerJs = arrowRoot + '/tests/unit/lib/driver/config/testRunner.js',
                libJs = arrowRoot + '/tests/unit/lib/driver/config/libs/lib-one.js,' + arrowRoot + '/tests/unit/lib/driver/config/libs/lib-two.js',
                seedJs = arrowRoot + '/tests/unit/lib/driver/config/seed.js',
                testHtml = arrowRoot + '/tests/unit/lib/driver/config/test.html',
                config = {
                    arrowModuleRoot: arrowRoot,
                    coverage: 'true',
                    browser: 'mybrowser',
                    seleniumHost: 'http://wdhub',
                    testRunner: testRunnerJs,
                    testSeed: seedJs
                },
                driver = new DriverClass(config, {});

            driver.createDriverJs({"test": testRunnerJs,
                "lib": libJs}, function (e, driverjs) {
                A.areEqual(null, e, "There should be no error");
                A.isTrue(driverjs.indexOf("http://chaijs.com/chai.js") != -1 &&
                    driverjs.indexOf("/tests/unit/lib/driver/config/libs/lib-one.js") != -1 &&
                    driverjs.indexOf("/tests/unit/lib/driver/config/libs/lib-two.js") != -1);
            });
        },

        'test createDriverJs with mocked share lib load': function () {
            var stubscanner = require(arrowRoot + "/lib/util/sharelibscanner.js");
            stubscanner.scannerUtil.getSrcDependencyByPath = function (lib, affinity) {
                return {
                    shareDepLibs: [arrowRoot + '/tests/unit/lib/driver/config/libs/lib-one.js',
                        arrowRoot + '/tests/unit/lib/driver/config/libs/lib-two.js',
                        arrowRoot + '/tests/unit/lib/driver/config/libs/lib-three.js'],
                    yuiDepLibs: ['test'],
                    urlDepLibs: ['temp.js']
                }
            }
            mockery.registerMock("../util/sharelibscanner", stubscanner);

            var self = this,
                testRunnerJs = arrowRoot + '/tests/unit/lib/driver/config/testRunner.js',
                libJs = arrowRoot + '/tests/unit/lib/driver/config/libs/lib-one.js,' + arrowRoot + '/tests/unit/lib/driver/config/libs/lib-two.js',
                seedJs = arrowRoot + '/tests/unit/lib/driver/config/seed.js',
                testHtml = arrowRoot + '/tests/unit/lib/driver/config/test.html',
                config = {
                    arrowModuleRoot: arrowRoot,
                    coverage: 'true',
                    browser: 'mybrowser',
                    seleniumHost: 'http://wdhub',
                    testRunner: testRunnerJs,
                    testSeed: seedJs
                },
                driver = new DriverClass(config, {});

            mockery.enable();
            /*
             in this example, libjs contain lib-one and lib-two, while share lib will contains lib-one,lib-two(with name lib one),lib-three
             sharelib/lib-one has some file path with libjs/lib-one , so will be ignored
             sharelib/lib-two has some module name with libjs/lib-one , so will be ignored
             sharelib/lib-three will be loaded and with a url contains in it.
             */
            driver.createDriverJs({"test": testRunnerJs,
                "lib": libJs}, function (e, driverjs) {
                A.areEqual(null, e, "There should be no error");
                A.isTrue(
                    driverjs.indexOf("temp.js") != -1 &&
                        driverjs.indexOf("/tests/unit/lib/driver/config/libs/lib-one.js") != -1 &&
                        driverjs.indexOf("/tests/unit/lib/driver/config/libs/lib-two.js") != -1 &&
                        driverjs.indexOf("/tests/unit/lib/driver/config/libs/lib-three.js") != -1);
            });



        },

        'test createDriverJs app seed': function () {

            var self = this,
                testRunnerJs = arrowRoot + '/tests/unit/lib/driver/config/testRunner.js',
                libJs = arrowRoot + '/tests/unit/lib/driver/config/libs/lib-one.js,' + arrowRoot + '/tests/unit/lib/driver/config/libs/lib-two.js',
                seedJs = arrowRoot + '/tests/unit/lib/driver/config/seed.js',
                testHtml = arrowRoot + '/tests/unit/lib/driver/config/test.html',
                config = {
                    arrowModuleRoot: arrowRoot,
                    coverage: 'true',
                    browser: 'mybrowser',
                    seleniumHost: 'http://wdhub',
                    testRunner: testRunnerJs,
                    defaultAppSeed: 'http://defaultAppSeed.org',
                    testSeed: seedJs
                },
                driver = new DriverClass(config, {});

            driver.createDriverJs({"test": testRunnerJs,
                "lib": libJs}, function (e, driverjs) {
                A.areEqual(null, e, "There should be no error");

                A.isTrue(driverjs.indexOf("http://defaultAppSeed.org") !== -1);

            });
        }

    }));

    Y.Test.Runner.add(suite);
}, '0.0.1', {requires: ['test']});

