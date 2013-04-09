/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
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

function TestExecutor(sessionFactory) {

    this.sessionFactory = sessionFactory;
    this.logger = log4js.getLogger("TestExecutor");

}

TestExecutor.prototype.runTests = function () {

//    console.log('****-In testExecutor..runTests');
    var self = this.sessionFactory,
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
        var testSession;

        if (testQueue.curIndex === testQueue.sessions.length) {
            return; // all done with this queue
        }

        testSession = testQueue.sessions[testQueue.curIndex];
        testQueue.curIndex += 1;

        testSession.runTest(function () {

            self.logger.trace("Run Test :" + curSessionCount + "==" + totalSessionCount);
            // Write report per descriptor ( if all testsessions for the descriptor ( to which the current test session belongs ) are run )

            function writeReportForDescriptor(callback) {
//                console.log('****-In writeReportForDescriptor..' + testSession.descriptorPath);
                for (descriptor in self.descriptorMap) {
                    if (descriptor === testSession.descriptorPath) {

//                        console.log('****Testexecutor-Testsession belongs to Descriptor-' + descriptor);
//                        console.log('****Testexecutor-Pushing testSession in ');

                        // Store testSessions array for each descriptor in testSessionMap
                        if (self.testSessionMap[descriptor]) {
                            testSessionsArr = self.testSessionMap[descriptor];
                        } else {
                            testSessionsArr = [];
                        }
                        testSessionsArr.push(testSession);

                        self.testSessionMap[descriptor] = testSessionsArr;

//                        console.log('****-Testexecutor-Key matches with ..' + testSession.descriptorPath + ' ,decrementing test count..');
                        self.descriptorMap[descriptor] = self.descriptorMap[descriptor] - 1;

                        if (self.descriptorMap[descriptor] === 0) {
                            self.logger.info('****All tests over for descriptor:' + testSession.descriptorPath);
//                            console.log('****-Testexecutor-All tests over for descriptor:' + testSession.descriptorPath +
//                                '. Start writing reports now to..' + self.reportFolder);

                            // TODO - Check for anything wrong in reportObj or missing or extraneous information
                            reportObj = {
                                "reportFolder" :  self.reportFolder,
                                "arrTestSessions" : self.testSessionMap[descriptor],
                                "descriptor" : testSession.descriptorPath,
                                "reuseSession" : self.reuseSession,
                                "testSuiteName" : self.testSuiteName,
                                "driver" : self.driver,
                                "browser" : self.browser,
                                "group" : self.args.group,
                                "testName" : self.args.testName
                            };
                            //console.log('****Report Object to write:' + JSON.stringify(reportObj));
                            console.log('****\n\n\n');
                            reportManager = new ReportManager(reportObj);
                            reportFile = reportManager.writeReports();


                        }

                    }
                }
                callback();
            }

            writeReportForDescriptor(function() {
//                console.log('***-In callback of writeReportForDescriptor..');
                curSessionCount += 1;
                if (curSessionCount === totalSessionCount) {
                    self.logger.trace("Done with all the sessions");
                    self.tearDown(testQueue, wdSessions);
                } else {
                    self.logger.trace("Calling Next Test : " + curSessionCount);
                    runNextTest(testQueue);
                }
            });

        });
    }

    function startTest() {
//        console.log('****-In testExecutor..startTest');
        var tests = [],
            testParams,
            test,
            parallelCount,
            testQueues = [],
            browsers,
            i,
            j;

        if (self.arrDescriptor) {
            tests = self.getFactoryTests();
            if (tests.length === 0) {
                self.tearDown({}, null);
            }
        } else if (self.tests) {
            for (i = 0; i < self.tests.length; i += 1) {
                testParams = clone(self.args);
                testParams.test = self.tests[i];
                // convert the cmd line test to look like a descriptor test
                test = {
                    config : {},
                    params : testParams,
                    testName : "Default",
                    driver : self.args.driver,
                    controller : self.args.controller,
                    browser : self.browser
                };
                tests.push(test);
            }
        } else {
            // convert the cmd line test to look like a descriptor test
            test = {
                config: {},
                params : self.args,
                testName : "Default",
                driver : self.args.driver,
                controller : self.args.controller,
                browser : self.browser
            };
            test.params.lib = self.args.lib;
            tests.push(test);
        }
        parallelCount = parseInt(self.parallel, 10);
        if (isNaN(parallelCount) || (parallelCount <= 0)) {
            parallelCount = 1;
        }

        // there may be more than one independent queue that can always run in parallel
        if (wdSessions.length > 0) {
            parallelCount = 1; // when reusing sessions, items in a single queue cannot run in parallel

            // every wd session gets its own queue
            for (i = 0; i < wdSessions.length; i += 1) {
                testQueues[i] = {curIndex: 0, sessions: []};
                for (j = 0; j < tests.length; j += 1) {
                    test = clone(tests[j]);
                    testQueues[i].sessions.push(new TestSession(self.config, test, wdSessions[i]));
                }
//                console.log('\n\n****-Wdsessions > 0.. Incrementing totalSessionCount..');
                totalSessionCount += tests.length;
            }
        } else {
            // when not reusing sessions, a single queue contains all the items
            // parallelism is controlled by the "parallel" argument passed by the user
            testQueues[0] = {curIndex: 0, sessions: []};
            for (i = 0; i < tests.length; i += 1) {
                browsers = self.getBrowsers(tests[i]);
                for (j = 0; j < browsers.length; j += 1) {
                    test = clone(tests[i]);
                    test.browser = browsers[j];
                    testQueues[0].sessions.push(new TestSession(self.config, test));
                }
//                console.log('\n\n****-Wdsessions <=0.. Incrementing totalSessionCount..');
                totalSessionCount += browsers.length;
            }
        }

        self.logger.info("Total test sessions: " + totalSessionCount);
//        console.log("****-In testExecutor,Total test sessions: " + totalSessionCount);

        if (self.startProxyServer) {
            self.startProxy = true;
        } else if (self.startProxyServer === undefined && self.args.startProxyServer) {
            self.startProxy = true;
        }

        if (self.startProxy) {

            //setting proxyConfig
            if (self.routerProxyConfig) {
                proxyConfig = self.routerProxyConfig;
            } else if (self.args.routerProxyConfig) {
                proxyConfig = self.args.routerProxyConfig;
            }

            if (proxyConfig) {
                global.proxyManager = new ProxyManager(path.resolve(global.workingDirectory, proxyConfig));
            } else {
                global.proxyManager = new ProxyManager(null);
            }

            if (os.type() === "Darwin") {
                global.hostname = "localhost";
            } else {
                global.hostname = os.hostname();
            }
            global.proxyManager.runRouterProxy(self.config.minPort, self.config.maxPort, global.hostname,  function(proxyHost) {

                if (proxyHost) {
                    if (proxyHost.indexOf("Error") === -1) {
                        console.log("Running Proxy at " + proxyHost);
                        self.config.proxyUrl = proxyHost;
                    } else {
                        console.log("Unable to Start Proxy, " + proxyHost);
                        console.log("Running Tests Without Proxy! ");
                    }
                }

                for (i = 0; i < testQueues.length; i += 1) {
                    // start running as many sessions as we can in parallel as speicified
                    for (j = 0; j < parallelCount; j += 1) {
                        runNextTest(testQueues[i]);
                    }
                }
            });



        } else {
            for (i = 0; i < testQueues.length; i += 1) {
                // start running as many sessions as we can in parallel as speicified
                for (j = 0; j < parallelCount; j += 1) {
                    runNextTest(testQueues[i]);
                }
            }
        }

    }

    // get all wd sessions if applicable (based on reuseSession flag)
    if (self.reuseSession) {
        hub = new WdSession(self.config);
        hub.getSessions(self, function (error, self, arrSessions) {
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