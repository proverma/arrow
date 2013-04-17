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
var async = require("async");

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
//        console.log('\n\n\n****-In testExecutor..runNextTest');
        var testSession;

        if (testQueue.curIndex === testQueue.sessions.length) {
            return; // all done with this queue
        }

        testSession = testQueue.sessions[testQueue.curIndex];
        testQueue.curIndex += 1;

        testSession.runTest(function () {

            self.logger.trace("Run Test :" + curSessionCount + "==" + totalSessionCount);
            testSession.endTime = Date.now();
            // Write report per descriptor ( if all testsessions for the descriptor ( to which the current test session belongs ) are run )
//            console.log('***Testsession started at::' + testSession.startTime + ' and ended at::' + testSession.endTime);
//            console.log('Time taken::' + ((testSession.endTime - testSession.startTime) / 1000).toFixed(2));

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
//                                '. Start writing reports now to..' + global.reportFolder);
//                            console.log('****self.args.report:::' + self.args.report);
                            // TODO - Check for anything wrong in reportObj or missing or extraneous information
                            reportObj = {
                                "reportFolder" :  global.reportFolder,
                                "arrTestSessions" : self.testSessionMap[descriptor],
                                "descriptor" : testSession.descriptorPath,
                                "reuseSession" : self.reuseSession,
                                "testSuiteName" : self.testSuiteName,
                                "driver" : self.driver,
                                "browser" : self.browser,
                                "group" : self.args.group,
                                "testName" : self.args.testName,

                            };
                            //console.log('****Report Object to write:' + JSON.stringify(reportObj));
//                            console.log('****\n');
                            reportManager = new ReportManager(reportObj);
                            reportManager.totalTimeTaken = ((testSession.endTime - testSession.startTime) / 1000).toFixed(2);
                            reportFile = reportManager.writeReports();

//                            console.log('***TestExecutor..After writing reports ..In writeReportForDescriptor');

                        }

                    }
                }
//                console.log('***TestExecutor..In writeReportForDescriptor..Invoking callback');
                callback();
            }

            writeReportForDescriptor(function() {

//                console.log('***-In callback of writeReportForDescriptor..');

                curSessionCount += 1;

//                console.log('****-CurrentSessionCount:' + curSessionCount);
//                console.log('\n\n\n******************************************************************************************');

                if (curSessionCount === totalSessionCount) {
//                    console.log('***Done with all sessions..Calling tearDown..');
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


        function runTests(testQueues, parallelCount) {
            var i, j, key;

            for (key in global.routerMap) {
                console.log('***For router config -' + key + ', proxy host is ' + global.routerMap[key]);
            }


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
            proxyManager,
            testSessionArr = [];

        if (self.arrDescriptor) {
//            console.log('****Getting tests..');
            tests = self.getFactoryTests();
//            console.log('****Got tests..');
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

        // Get how many unique proxy servers we need to start

//        console.log('****-Tests length::' + tests.length);
        console.log('****-Router config list::' + self.routerConfigList);
//        console.log('****-self.args.routerProxyConfig::' + self.args.routerProxyConfig);

//        console.log('****-Self.routerConfigList::' + self.routerConfigList);

        function startProxy(routerConfigPath, callback) {

            if (os.type() === "Darwin") {
                global.hostname = "localhost";
            } else {
                global.hostname = os.hostname();
            }

            console.log('*****-Starting proxy server : ' + routerConfigPath);

            proxyManager = new ProxyManager(path.resolve(global.workingDirectory, routerConfigPath));

            proxyManager.runRouterProxy(self.config.minPort, self.config.maxPort, global.hostname,  function(proxyHost) {

                if (proxyHost) {
                    if (proxyHost.indexOf("Error") === -1) {
                        console.log("****Running Proxy Server at " + proxyHost + ' for :::' + routerConfigPath);

                        global.routerMap[routerConfigPath] = proxyHost;
//                        console.log('****ProxyHost::' + global.routerMap[routerConfigPath]);

                        //self.config.proxyUrl = proxyHost; TODO this needs to go at test session level
                    } else {
                        console.log("Unable to Start Proxy, " + proxyHost);
                        console.log("Running Tests Without Proxy! ");
                    }
                } else {
                    console.log("Some error while starting proxy");
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
//                        console.log('****-Creating testsession 1..' + test.resolvedRouterConfigPath);
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
//                        console.log('****-Creating testsession 2..' + test.resolvedRouterConfigPath);
                        test.browser = browsers[j];
                        testQueues[0].sessions.push(new TestSession(self.config, test));
                    }
                    totalSessionCount += browsers.length;
                }
            }
            self.logger.info("Total test sessions: " + totalSessionCount);
            callback();

        }


        // If set from command line
        if (self.args.startProxyServer === true || self.args.startProxyServer === undefined) {

//            console.log('***-Before finding ports..' + self.routerConfigList);
//            console.log('****-In test executor startTest..Getting count of proxy servers needed');

            for (i = 0; i < tests.length; i += 1) {

                testSessionArr = [];

                //setting proxyConfig
                if (tests[i].routerProxyConfig) {
                    proxyConfig = self.routerProxyConfig;
                } else if (self.args.routerProxyConfig) {
                    proxyConfig = self.args.routerProxyConfig;
                }

                if (tests[i].startProxyServer === false) {
//                    console.log('****Startproxyserver set to false..No need to start proxy');
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
                    tests[i].resolvedRouterConfigPath = proxyConfig;

                } else if (self.args.routerProxyConfig) { // If routerProxyConfig is passed as an argument

//                    console.log('****-RouterProxyConfig passed in arguments...');
                    proxyConfig = path.resolve(global.workingDirectory, self.args.routerProxyConfig);
//                    console.log('****-RouterProxyConfig...' + proxyConfig);
                    tests[i].resolvedRouterConfigPath = proxyConfig;
                }

                if (proxyConfig) {
                    // Add routerConfig to the list ,if not already added
                    if (self.routerConfigList.indexOf(proxyConfig) === -1) {
//                        console.log('***Adding 1::' + proxyConfig);
                        self.routerConfigList.push(proxyConfig);
                    }
                }
            }

            if (self.routerConfigList && self.routerConfigList.length > 0) {

                self.logger.info('Number of Proxy servers needed to start:' + self.routerConfigList.length);
//                console.log('****-In test executor startTest.. Proxy servers needed:' + self.routerConfigList.length);

                async.eachSeries(self.routerConfigList, startProxy, function(err) {

                    if (err) {
                        self.logger.info('ERROR !! Failed to start proxy servers..');
//                        console.log('****-Failed to start proxy servers..');
                    } else {
                        self.logger.info('Started all proxy servers..Now running tests\n\n');
//                        console.log('*****-Started all proxy servers..');
//                        console.log('*****-Continuing with tests now..\n\n\n');

                        setupTestQueues(function() {
                            runTests(testQueues, parallelCount);
                        });
                    }

                });

            } else {
//                console.log('****-In test executor startTest..No Proxy servers needed');

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
