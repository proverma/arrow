/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var log4js = require("log4js");
var SessionFactory = require("./sessionfactory");
var ReportManager = require("../util/reportmanager");
var WdSession = require("../session/wdsession");
var TestSession = require("../session/testsession");
var ProxyManager = require("../proxy/proxymanager");
var clone = require('clone');
var path = require("path");
var os = require("os");
var async = require("async");

function TestExecutor(sessionFactory) {

    this.sessionFactory = sessionFactory;
    this.logger = log4js.getLogger("TestExecutor");

}

TestExecutor.prototype.executeTests = function () {

    var sf = this.sessionFactory,
        ts = this,
    // counters to track all sessions
        curSessionCount = 0,
        totalSessionCount = 0,
        wdSessions = [],
        hub,
        proxyConfig,
        testSessionsArr = [],
        descriptor,
        reportObj,
        reportManager,
        reportFile;

    function runNextTest(testQueue) {

        var testSession,
            testSessionTimeArr = [],
            currTime;

        if (testQueue.curIndex === testQueue.sessions.length) {
            return; // all done with this queue
        }

        testSession = testQueue.sessions[testQueue.curIndex];
        testQueue.curIndex += 1;

        currTime = Date.now();
        if (!sf.timeReportObj[testSession.descriptorPath]) {
            sf.timeReportObj[testSession.descriptorPath] = [];
            sf.timeReportObj[testSession.descriptorPath].startTime = currTime;
        }

        // If first test session is starting for the descriptor, note start time
        if (!sf.descriptorTimeMap[testSession.descriptorPath]) {
            sf.descriptorTimeMap[testSession.descriptorPath] = currTime;
        }

        testSession.runTest(function () {

            ts.logger.trace("Run Test :" + curSessionCount + "==" + totalSessionCount);
            testSession.endTime = Date.now();

            // Write report per descriptor ( if all testsessions for the descriptor ( to which the current test session belongs ) are run )

            if (sf.timeReportObj[testSession.descriptorPath].testSessionTimeArr) {
                testSessionTimeArr = sf.timeReportObj[testSession.descriptorPath].testSessionTimeArr;
            } else {
                testSessionTimeArr = {};
            }

            testSessionTimeArr[testSession.args.testName] = {};

            testSessionTimeArr[testSession.args.testName].timeTaken = ((testSession.endTime - testSession.startTime) / 1000).toFixed(2);
            sf.timeReportObj[testSession.descriptorPath].testSessionTimeArr = testSessionTimeArr;

            ts.logger.info('Time taken to run - ' + testSession.args.testName + ' is::' +
                testSessionTimeArr[testSession.args.testName].timeTaken);

            function writeReportForDescriptor(callback) {

                for (descriptor in sf.descriptorMap) { // TODO - remove Jslint error
                    if (descriptor === testSession.descriptorPath) {

                        // Store testSessions array for each descriptor in testSessionMap
                        if (sf.testSessionMap[descriptor]) {
                            testSessionsArr = sf.testSessionMap[descriptor];
                        } else {
                            testSessionsArr = [];
                        }
                        testSessionsArr.push(testSession);

                        sf.testSessionMap[descriptor] = testSessionsArr;

                        sf.descriptorMap[descriptor] = sf.descriptorMap[descriptor] - 1;

                        if (sf.descriptorMap[descriptor] === 0) {

                            currTime = Date.now();
                            sf.descriptorTimeMap[testSession.descriptorPath] =
                                ((currTime - sf.descriptorTimeMap[testSession.descriptorPath]) / 1000).toFixed(2);

                            sf.timeReportObj[testSession.descriptorPath].endTime = currTime; // TODO Is endTime required ???
                            sf.timeReportObj[testSession.descriptorPath].timeTaken =
                                ((sf.timeReportObj[testSession.descriptorPath].endTime - sf.timeReportObj[testSession.descriptorPath].startTime) / 1000).toFixed(2);

                            ts.logger.info('Time taken to run descriptor-' + testSession.descriptorPath + ' = ' + sf.timeReportObj[testSession.descriptorPath].timeTaken);

                            ts.logger.info('All tests over for descriptor:' + testSession.descriptorPath);
                            reportObj = {
                                "reportFolder" : global.reportFolder,
                                "arrTestSessions" : sf.testSessionMap[descriptor],
                                "descriptor" : testSession.descriptorPath,
                                "reuseSession" : sf.reuseSession,
                                "testSuiteName" : sf.testSuiteName,
                                "driver" : sf.driver,
                                "browser" : sf.browser,
                                "group" : sf.args.group,
                                "testName" : sf.args.testName

                            };
                            reportManager = new ReportManager(reportObj);
                            reportManager.totalTimeTaken = sf.descriptorTimeMap[testSession.descriptorPath];
                            reportFile = reportManager.writeReports();
                        }

                    }
                }
                callback();
            }

            writeReportForDescriptor(function() {

                curSessionCount += 1;
                if (curSessionCount === totalSessionCount) {
                    ts.logger.trace("Done with all the sessions");
                    sf.tearDown(testQueue, wdSessions);
                } else {
                    ts.logger.trace("Calling Next Test : " + curSessionCount);
                    runNextTest(testQueue);
                }
            });

        });
    }

    function startTest() {

        function runTests(testQueues, parallelCount) {
            var i, j;

            for (i = 0; i < testQueues.length; i += 1) {
                // start running as many sessions as we can in parallel as specified
                for (j = 0; j < parallelCount; j += 1) {
                    runNextTest(testQueues[i]);
                }
            }

        }

        var tests = [],
            testParams,
            test,
            parallelCount,
            testQueues = [],
            browsers,
            i,
            j,
            proxyManager;

        if (sf.arrDescriptor) {

            tests = sf.getFactoryTests();

            if (tests.length === 0) {
                sf.tearDown({}, null);
            }
        } else if (sf.tests) {
            for (i = 0; i < sf.tests.length; i += 1) {
                testParams = clone(sf.args);
                testParams.test = sf.tests[i];
                // convert the cmd line test to look like a descriptor test
                test = {
                    config : {},
                    params : testParams,
                    testName : "Default",
                    driver : sf.args.driver,
                    controller : sf.args.controller,
                    browser : sf.browser
                };
                tests.push(test);
            }
        } else {
            // convert the cmd line test to look like a descriptor test
            test = {
                config: {},
                params : sf.args,
                testName : "Default",
                driver : sf.args.driver,
                controller : sf.args.controller,
                browser : sf.browser
            };
            test.params.lib = sf.args.lib;
            tests.push(test);
        }
        parallelCount = parseInt(sf.parallel, 10);
        if (isNaN(parallelCount) || (parallelCount <= 0)) {
            parallelCount = 1;
        }

        // Get how many unique proxy servers we need to start

        function startProxy(routerConfigPath, callback) {

            if (os.type() === "Darwin") {
                global.hostname = "localhost";
            } else {
                global.hostname = os.hostname();
            }

            ts.logger.info('Starting proxy server : ' + routerConfigPath);

            proxyManager = new ProxyManager(path.resolve(global.workingDirectory, routerConfigPath));

            proxyManager.runRouterProxy(sf.config.minPort, sf.config.maxPort, global.hostname, function(proxyHost) {

                if (proxyHost) {
                    if (proxyHost.indexOf("Error") === -1) {
                        ts.logger.info("Running Proxy Server at " + proxyHost + ' for :::' + routerConfigPath);
                        global.routerMap[routerConfigPath] = proxyHost;
                    } else {
                        ts.logger.info("Unable to Start Proxy, " + proxyHost);
                        ts.logger.info("Running Tests Without Proxy! ");
                    }
                } else {
                    ts.logger.info("Some error while starting proxy");
                    //TODO - What message to show here??
                }

            });

            setTimeout(callback, 500);


        }

        function setupTestQueues(callback) {

            // there may be more than one independent queue that can always run in parallel
            if (wdSessions.length > 0) {
                parallelCount = 1; // when reusing sessions, items in a single queue cannot run in parallel

                // every wd session gets its own queue
                for (i = 0; i < wdSessions.length; i += 1) {
                    testQueues[i] = {curIndex: 0, sessions: []};
                    for (j = 0; j < tests.length; j += 1) {
                        test = clone(tests[j]);

                        // If proxy set to true , ignore reuseSession
                        if (test.startProxyServer === true) {
                            testQueues[i].sessions.push(new TestSession(sf.config, test));
                        } else {
                            testQueues[i].sessions.push(new TestSession(sf.config, test, wdSessions[i]));
                        }

                    }
                    totalSessionCount += tests.length;
                }
            } else {
                // when not reusing sessions, a single queue contains all the items
                // parallelism is controlled by the "parallel" argument passed by the user
                testQueues[0] = {curIndex: 0, sessions: []};
                for (i = 0; i < tests.length; i += 1) {
                    browsers = sf.getBrowsers(tests[i]);
                    for (j = 0; j < browsers.length; j += 1) {
                        test = clone(tests[i]);
                        test.browser = browsers[j];
                        testQueues[0].sessions.push(new TestSession(sf.config, test));
                    }
                    totalSessionCount += browsers.length;
                }
            }
            ts.logger.info("Total test sessions: " + totalSessionCount);
            callback();

        }

        // If set from command line
        if (sf.args.startProxyServer === true || sf.args.startProxyServer === undefined) {

            for (i = 0; i < tests.length; i += 1) {

                if (tests[i].startProxyServer === false) {
                    continue;
                }

                // If test has routerProxyConfig
                if (tests[i].routerProxyConfig) {

                    proxyConfig = tests[i].routerProxyConfig;

                    if (tests[i].relativePath) {
                        proxyConfig = path.resolve(global.workingDirectory, tests[i].relativePath, proxyConfig);
                    } else {
                        proxyConfig = path.resolve(global.workingDirectory, proxyConfig);
                    }

                } else if (sf.args.routerProxyConfig) { // If routerProxyConfig is passed as an argument
                    proxyConfig = path.resolve(global.workingDirectory, sf.args.routerProxyConfig);
                }

                if (proxyConfig) {

                    tests[i].resolvedRouterConfigPath = proxyConfig;
                    // Add routerConfig to the list ,if not already added
                    if (sf.routerConfigList.indexOf(proxyConfig) === -1) {
                        sf.routerConfigList.push(proxyConfig);
                    }
                }
            }

            if (sf.routerConfigList && sf.routerConfigList.length > 0) {

                ts.logger.info('Number of Proxy servers needed to start:' + sf.routerConfigList.length);

                async.eachSeries(sf.routerConfigList, startProxy, function(err) {

                    if (err) {
                        ts.logger.info('ERROR !! Failed to start proxy servers..');
                    } else {
                        ts.logger.info('Started all proxy servers..Now running tests\n\n');

                        setupTestQueues(function() {
                            runTests(testQueues, parallelCount);
                        });
                    }

                });

            } else {

                setupTestQueues(function() {
                    runTests(testQueues, parallelCount);
                });

            }

        } else {

            setupTestQueues(function() {
                runTests(testQueues, parallelCount);
            });

        }

    }

    // get all wd sessions if applicable (based on reuseSession flag)
    if (sf.reuseSession) {
        hub = new WdSession(sf.config);
        hub.getSessions(sf, function (error, sf, arrSessions) {
            if (error) {
                process.exit(1);
            }
            wdSessions = arrSessions;
            startTest();
        });
    } else {
        startTest();
    }

};

module.exports = TestExecutor;