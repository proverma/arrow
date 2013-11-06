/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var log4js = require("log4js");
var SessionFactory = require("./sessionfactory");
var ReportManager = require("../util/reportmanager");
var FileUtil = require("../util/fileutil");
var WdSession = require("../session/wdsession");
var TestSession = require("../session/testsession");
var ProxyManager = require("../proxy/proxymanager");
var clone = require('clone');
var path = require("path");
var os = require("os");
var fs = require("fs");
var async = require("async");

var sf;
var testExecutor;
var curSessionCount;
var totalSessionCount;
var wdSessions;
var parallelCount;
var tests;
var testQueues;

function TestExecutor(sessionFactory) {

    sf = sessionFactory;

    this.logger = log4js.getLogger("TestExecutor");
    testExecutor = this;
    tests = [];
    wdSessions = [];
    testQueues = [];
    curSessionCount = 0;
    totalSessionCount = 0;
    parallelCount = 0;

}

TestExecutor.prototype.writeReportForDescriptor = function(testSession, callback) {

    var descriptor,
        testSessionsArr,
        currTime,
        reportObj,
        reportManager;

    for (descriptor in sf.descriptorObj) {
        if (descriptor === testSession.descriptorPath) {
            // Store testSessions array for each descriptor in testSessionMap
            if (sf.testSessionMap[descriptor]) {
                testSessionsArr = sf.testSessionMap[descriptor];
            } else {
                testSessionsArr = [];
            }
            testSessionsArr.push(testSession);

            sf.testSessionMap[descriptor] = testSessionsArr;

            sf.descriptorObj[descriptor].testSessionCount -= 1;
            if (sf.descriptorObj[descriptor].testSessionCount === 0) {

                sf.timeReportObj[testSession.descriptorPath].endTime = Date.now(); // TODO Is endTime required ???
                sf.timeReportObj[testSession.descriptorPath].timeTaken =
                    ((sf.timeReportObj[testSession.descriptorPath].endTime - sf.timeReportObj[testSession.descriptorPath].startTime) / 1000).toFixed(2);

                testExecutor.logger.info('Time taken to run descriptor-' + testSession.descriptorPath + ' = ' + sf.timeReportObj[testSession.descriptorPath].timeTaken);

                testExecutor.logger.info('All tests over for descriptor:' + testSession.descriptorPath);
                reportObj = {
                    "reportFolder" : global.reportFolder,
                    "arrTestSessions" : sf.testSessionMap[descriptor],
                    "descriptor" : testSession.descriptorPath,
                    "reuseSession" : sf.reuseSession,
                    "testSuiteName" : sf.descriptorObj[descriptor].testSuiteName,
                    "driver" : sf.driver,
                    "browser" : sf.browser,
                    "group" : sf.args.group,
                    "testName" : sf.args.testName

                };
                reportManager = new ReportManager(reportObj);
                reportManager.totalTimeTaken = sf.timeReportObj[testSession.descriptorPath].timeTaken;
                reportManager.writeReports();

            }

        }
    }
    callback();
};

TestExecutor.prototype.startProxy = function(proxyConfigPath, callback) {

    //TODO - move this to index.js
    if (os.type() === "Darwin") {
        global.hostname = "localhost";
    } else {
        global.hostname = os.hostname();
    }

    testExecutor.logger.info('Starting proxy server : ' + proxyConfigPath);

    var proxyManager = new ProxyManager(path.resolve(global.workingDirectory, proxyConfigPath),sf.config);

    proxyManager.runRouterProxy(sf.config.minPort, sf.config.maxPort, global.hostname, function(proxyHost) {

        if (proxyHost) {
            if (proxyHost.indexOf("Error") === -1) {
                testExecutor.logger.info("Running Proxy Server at " + proxyHost + ' for :::' + proxyConfigPath);
                global.routerMap[proxyConfigPath] = proxyHost;
            } else {
                testExecutor.logger.info("Unable to Start Proxy, " + proxyHost);
                testExecutor.logger.info("Running Tests Without Proxy! ");
            }
        } else {
            testExecutor.logger.info("Some error while starting proxy");
            //TODO - What message to show here??
        }

    });

    setTimeout(callback, 500);

};

TestExecutor.prototype.runNextTest = function(testQueue) {

    var testSession,
        testSessionTimeArr = [];

    if (testQueue.curIndex === testQueue.sessions.length) {
        return; // all done with this queue
    }
    testSession = testQueue.sessions[testQueue.curIndex];

    var thisSession = testQueue.sessions[testQueue.curIndex];

    testQueue.curIndex += 1;
    // If first test session is starting for the descriptor, note start time
    if (!sf.timeReportObj[testSession.descriptorPath]) {
        sf.timeReportObj[testSession.descriptorPath] = [];
        sf.timeReportObj[testSession.descriptorPath].startTime = Date.now();
    }

    testSession.runTest(function (error) {

        if (error) {
            var obj = {};
            obj.error = error;
            thisSession.driver.reports.addReport(obj);
            testExecutor.logger.debug("Error : " + error);
        }

        testExecutor.logger.trace("Run Test :" + curSessionCount + "==" + totalSessionCount);
        thisSession.endTime = Date.now();

        // Write report per descriptor ( if all testsessions for the descriptor ( to which the current test session belongs ) are run )

        if (sf.timeReportObj[thisSession.descriptorPath].testSessionTimeArr) {
            testSessionTimeArr = sf.timeReportObj[thisSession.descriptorPath].testSessionTimeArr;
        } else {
            testSessionTimeArr = {};
        }

        testSessionTimeArr[thisSession.args.testName] = {};

        testSessionTimeArr[thisSession.args.testName].timeTaken = ((thisSession.endTime - thisSession.startTime) / 1000).toFixed(2);
        sf.timeReportObj[thisSession.descriptorPath].testSessionTimeArr = testSessionTimeArr;

        testExecutor.logger.info('Time taken to run - ' + thisSession.descriptorPath + '-' + thisSession.args.testName + ' is::' +
            testSessionTimeArr[thisSession.args.testName].timeTaken);

        testExecutor.writeReportForDescriptor(thisSession, function() {
            curSessionCount += 1;
            if (curSessionCount === totalSessionCount) {
                testExecutor.logger.trace("Done with all the sessions");
                sf.tearDown(testQueue, wdSessions);
            } else {
                testExecutor.logger.trace("Calling Next Test : " + curSessionCount);
                testExecutor.runNextTest(testQueue);
            }
        });

    });
};

TestExecutor.prototype.runTests = function(testQueues, parallelCount) {
    var i, j;
    for (i = 0; i < testQueues.length; i += 1) {
        // start running as many sessions as we can in parallel as specified
        for (j = 0; j < parallelCount; j += 1) {
            testExecutor.runNextTest(testQueues[i]);
        }
    }

};

TestExecutor.prototype.setupTestQueues = function(callback) {

    var test,
        browsers,
        i,
        j;

    // there may be more than one independent queue that can always run in parallel
    if (wdSessions.length > 0) {

        parallelCount = 1; // when reusing sessions, items in a single queue cannot run in parallel
        // every wd session gets its own queue
        for (i = 0; i < wdSessions.length; i += 1) {
            testQueues[i] = {curIndex: 0, sessions: []};
            for (j = 0; j < tests.length; j += 1) {
                test = clone(tests[j]);

                // If proxy set to true or reuseSession set to false , ignore reuseSession
                if (test.startProxyServer === true || test.reuseSession === false) {
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
            // If more than one browsers, double the length
            if (browsers.length > 1) {

                if (sf.descriptorObj[test.descriptorPath]) {
                    sf.descriptorObj[test.descriptorPath].testSessionCount = sf.descriptorObj[test.descriptorPath].testSessionCount * browsers.length;
                }
            }

        }
    }
    testExecutor.logger.info("Total test sessions: " + totalSessionCount);
    callback();

};

TestExecutor.prototype.getTests = function(callback) {

    var testParams,
        test,
        i;

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

    callback();


};

TestExecutor.prototype.populateProxyConfigList = function(callback) {

    var i,
        proxyConfig;

    // Get how many unique proxy servers we need to start
    for (i = 0; i < tests.length; i += 1) {

        proxyConfig = undefined;

        if (tests[i].startProxyServer === false) {
            continue;
        }

        // If test has routerProxyConfig
        if (tests[i].proxyConfig) {

            proxyConfig = tests[i].proxyConfig;

            if (tests[i].relativePath) {
                proxyConfig = path.resolve(global.workingDirectory, tests[i].relativePath, proxyConfig);
            } else {
                proxyConfig = path.resolve(global.workingDirectory, proxyConfig);
            }

        } else if (sf.args.routerProxyConfig) { // If proxyConfig is passed as an argument
            proxyConfig = path.resolve(global.workingDirectory, sf.args.routerProxyConfig);
        }

        if (proxyConfig) {

            tests[i].resolvedProxyConfigPath = proxyConfig;
            // Add routerConfig to the list ,if not already added
            if (sf.proxyConfigList.indexOf(proxyConfig) === -1) {
                sf.proxyConfigList.push(proxyConfig);
            }
        }
    }
    callback();

};

TestExecutor.prototype.setupProxy = function(callback) {

    // If set from command line
    if (sf.args.startProxyServer === true || sf.args.startProxyServer === undefined) {

        testExecutor.populateProxyConfigList(function () {

            if (sf.proxyConfigList && sf.proxyConfigList.length > 0) {

                testExecutor.logger.info('Number of Proxy servers needed to start:' + sf.proxyConfigList.length);

                async.eachSeries(sf.proxyConfigList, testExecutor.startProxy, function(err) {

                    if (err) {
                        testExecutor.logger.info('ERROR !! Failed to start proxy servers..');
                    } else {
                        testExecutor.logger.info('Started all proxy servers..Now running tests\n\n');
                    }
                    callback();

                });

            } else {
                callback();
            }
        });

    } else {
        callback();
    }

};

TestExecutor.prototype.startTest = function() {

    testExecutor.getTests(function() {
        parallelCount = parseInt(sf.parallel, 10);
        if (isNaN(parallelCount) || (parallelCount <= 0)) {
            parallelCount = 1;
        }
        testExecutor.setupProxy(function() {
            testExecutor.setupTestQueues(function() {
                testExecutor.runTests(testQueues, parallelCount);
            });
        });

    });

};


TestExecutor.prototype.executeTests = function () {
    var hub;

    // get all wd sessions if applicable (based on reuseSession flag)
    if (sf.reuseSession) {
        hub = new WdSession(sf.config);
        hub.getSessions(sf, function (error, sf, arrSessions) {
            if (error) {
                // logger.error('No sessions found..'); TODO  search for this msg
                process.exit(1);
            }
            wdSessions = arrSessions;
            testExecutor.startTest();
        });
    } else {
        testExecutor.startTest();
    }

};

module.exports = TestExecutor;