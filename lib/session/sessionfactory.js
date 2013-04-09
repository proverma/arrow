/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var log4js = require("log4js");
var TestSession = require("../session/testsession");
var DataProvider = require("../util/dataprovider");
var ReportManager = require("../util/reportmanager");
var LibManager = require('../util/libmanager');
var WdSession = require("../session/wdsession");
var clone = require('clone');
var coverage = require("../util/coverage");
var fs = require("fs");
var path = require("path");
var os = require("os");
var ProxyManager = require("../proxy/proxymanager");

/**
 * SessionFactory is the main entry point for all Arrow Tests.
 *
 * This class parses descriptor or commandline call, and checks
 * how many tests need to be executed, and then creates one
 * TestSession Object for each test, and then executes them sequentially
 * or in parallel based on params.
 *
 * This class also interfaces with selenium server and gets
 * the activeSessions if reuseSession option is passed.
 *
 * @constructor
 *
 * @param config : config object ( default value : arrow/node/config/config.js, this could be overridden by user )
 * @param args : commandline args ( parsed through nopt )
 */
function SessionFactory(config, args) {
    var configName, argsName;
    this.logger = log4js.getLogger("SessionFactory");
    coverage.configure(config);

    for (configName in config) {
        this.logger.trace("config:" + configName + "=" + config[configName]);
    }
    for (argsName in args) {
        this.logger.trace("args:" + argsName + "=" + args[argsName]);
    }


    this.config = config;
    this.args = args;

    this.reuseSession = args.reuseSession;
    this.driver = args.driver;
    this.descriptor = args.descriptor;
    this.arrDescriptor = config.arrDescriptor;
    this.tests = args.tests;

    this.browser = "";
    if (args.browser) {
        this.browser = args.browser;
    }
    this.parallel = config.parallel;
    this.group = "";
    if (args.group) {
        this.group = args.group;
    }
    this.testName = "";
    if (args.testName) {
        this.testName = args.testName;
    }

    this.libManager = new LibManager();

    //proxy properties
    this.startProxyServer = undefined;
    this.routerProxyConfig = undefined;
    this.startProxy = false;

    // Object of key value pairs -  Key = descriptor name, value = No. of tests in descriptor
    this.descriptorMap = [];

    this.testSessionMap = {};

    this.reportFolder = args.reportFolder;

}

SessionFactory.prototype.runAllTestSessions = function () {
    var self = this,
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
            for (descriptor in self.descriptorMap) {
                if (descriptor === testSession.descriptorPath) {

                    console.log('****Testsession belongs to Descriptor-' + descriptor);
                    console.log('****-Pushing testSession in ');

                    // Store testSessions array for each descriptor in testSessionMap
                    if (self.testSessionMap[descriptor]) {
                        testSessionsArr = self.testSessionMap[descriptor];
                    } else {
                        testSessionsArr = [];
                    }
                    testSessionsArr.push(testSession);

                    self.testSessionMap[descriptor] = testSessionsArr;

                    console.log('****-Key matches with ..' + testSession.descriptorPath + ' ,decrementing test count..');
                    self.descriptorMap[descriptor] = self.descriptorMap[descriptor] - 1;

                    if (self.descriptorMap[descriptor] === 0) {
                        self.logger.info('****-All tests over for descriptor:' + testSession.descriptorPath);
                        console.log('****-All tests over for descriptor:' + testSession.descriptorPath +
                            '. Start writing reports now to..' + self.reportFolder);

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
                        reportManager = new ReportManager(reportObj);
                        reportFile = reportManager.writeReports();
                        console.log('****\n\n\n');

                    }

                }
            }

            curSessionCount += 1;
            if (curSessionCount === totalSessionCount) {
                self.logger.trace("Done with all the sessions");
                self.tearDown(testQueue, wdSessions);
            } else {
                self.logger.trace("Calling Next Test : " + curSessionCount);
                runNextTest(testQueue);
            }
        });
    }

    function startTest() {

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
                console.log('\n\n****-Wdsessions > 0.. Incrementing totalSessionCount..');
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
                console.log('\n\n****-Wdsessions <=0.. Incrementing totalSessionCount..');
                totalSessionCount += browsers.length;
            }
        }

        self.logger.info("Total test sessions: " + totalSessionCount);


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
    if (this.reuseSession) {
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

SessionFactory.prototype.getBrowsers = function (test) {
    var browsers = test.browser,
        browserList,
        browser,
        i;

    if (!browsers || (0 === browsers.length)) {
        return [""];
    }

    browsers = browsers.split(",");
    browserList = [];
    for (i = 0; i < browsers.length; i += 1) {
        browser = browsers[i];
        if (0 === browser.length) { continue; }

        if (this.browser && (-1 === this.browser.indexOf(browser))) {
            this.logger.info("Browser filtering. Skipping test/browser: " + test.name + "/" + browser);
            continue;
        }

        browserList.push(browser);
    }

    return browserList;
};

SessionFactory.prototype.getFactoryTests = function () {
    var dpreader,
        testJson,
        dp,
        commonLib,
        testConfig,
        descLib,
        tests = [],
        testName,
        testData,
        testInstanceLib,
        arrTestGroup,
        arrCommandLineGroup,
        blnGroup = false,
        x,
        y,
        i,
        descFile;

    // Iterate over all descriptor files and get the tests
    for (i = 0; i < this.arrDescriptor.length; i += 1) {

        descFile = this.arrDescriptor[i];

        dpreader = new DataProvider(this.config, descFile);
        testJson = dpreader.getTestData();

        //setting proxy properties
        this.startProxyServer = testJson.startProxyServer;
        this.routerProxyConfig = testJson.routerProxyConfig;

        this.testSuiteName = testJson.name;
        console.log('****-For descriptor - ' + descFile + ' ...testSuiteName : ' + this.testSuiteName);
        dp = testJson.dataprovider;
        commonLib = testJson.commonlib;
        testConfig = testJson.config;
        if (this.browser) {
            testJson.browser = this.browser;
        }

        this.logger.trace("runDataDrivenTest :");
        this.logger.trace(dp);
        this.logger.trace("controller config :");
        this.logger.trace(testConfig);

        this.descLib = "";
        if (commonLib) {
            descLib = this.libManager.getAllTest(commonLib);
        }
        this.logger.trace("Desc Lib :" + descLib);
        if (this.args.lib) {
            if (descLib) {
                descLib += "," + this.args.lib;
            } else {
                descLib = this.args.lib;
            }
        }

        for (testName in dp) {
            console.log('****-TestName:::' + testName);
            testData = dp[testName];
            if (false === testData.enabled || "false" === testData.enabled) {
                this.logger.info("Disabled, skipping test: " + testName);
                continue;
            }

            if (this.group && !testData.group) {
                this.logger.info("Group filtering : no group defined for test, skipping test: " + testName);
                continue;
            }

            if (this.group && testData.group) {

                arrTestGroup = testData.group.split(",");
                arrCommandLineGroup = this.group.split(",");

                for (x in arrCommandLineGroup) {
                    for (y in arrTestGroup) {
                        if (arrCommandLineGroup[x] === arrTestGroup[y]) {
                            blnGroup = true;
                        }
                    }
                }

                if (blnGroup) {
                    //console.log("MATCH");
                    blnGroup = false;
                } else {
                    this.logger.info("Test Group :" + testData.group);
                    this.logger.info("CommandLine Group :" + this.group);
                    this.logger.info("Group filtering, skipping test: " + testName);
                    continue;
                }
            }

            if (this.testName && (this.testName !== testName)) {
                this.logger.info("TestName filtering, skipping Test :" + testName);
                continue;
            }

            testData.testName = testName;
            testData.config = testConfig;
            if (!testData.params) {
                testData.params = {};
            }
            testData.driver = this.driver; // if passed by the user
            if (!testData.browser) {
                testData.browser = testJson.browser;
            }

            if (testData.params.lib) {
                testInstanceLib = this.libManager.getAllTest(testData.params.lib);
                if (testInstanceLib) {
                    if (descLib) {
                        testData.params.lib = descLib + "," + testInstanceLib;
                    } else {
                        testData.params.lib = testInstanceLib;
                    }
                } else {
                    testData.params.lib = descLib;
                }
            } else {
                testData.params.lib = descLib;
            }

            // Added to store relativePath of the json file
            testData.relativePath = descFile.substring(0, descFile.lastIndexOf(path.sep));
            console.log('Relative Path for ' + descFile + ' :::' + testData.relativePath);

            // To store the descriptor file name ( with path ) in testSession object
            //TODO: Parikh change descriptor to descriptorPath
            testData.descriptorPath = descFile;

            // Store the no. of test sessions in the descriptor
            if (this.descriptorMap[descFile]) {
                this.descriptorMap[descFile] = this.descriptorMap[descFile] + 1;
            } else {
                this.descriptorMap[descFile] = 1;
            }

            tests.push(testData);
        }



    }

    return tests;
};

SessionFactory.prototype.tearDown = function (testQueue, wdSessions) {
    console.log('\n\n****-In sessionfactory teardown..');
    var reportObj,
        reportManager,
        reportFile,
        covFile,
        obj,
        i,
        failed,
        s,
        session,
        r,
        reports;

    //adding this for unit testing
    this.testQueue = testQueue;
    this.logger.trace("SessionFactory:TearDown");
    console.log("****-SessionFactory:TearDown: Descriptor-" + this.descriptorPath);
    console.log("****-SessionFactory:TearDown: ReportFolder-" + this.args.reportFolder);
    console.log("****-SessionFactory:TearDown: reuseSession-" + this.reuseSession);
    console.log("****-SessionFactory:TearDown: reuseSession-" + this.reuseSession);
    console.log("****-SessionFactory:TearDown: driver-" + this.args.driver);
    console.log("****-SessionFactory:TearDown: browser-" + this.args.browser);
    console.log("****-SessionFactory:TearDown: group-" + this.args.group);
    console.log("****-SessionFactory:TearDown: testName-" + this.args.testName);
    console.log("****-SessionFactory:TearDown: testSuiteName-" + this.testSuiteName);

    if (this.args.report && testQueue.sessions) {
        reportObj = {
            "reportFolder" :  this.args.reportFolder,
            "arrTestSessions" : testQueue.sessions,
            "arrWDSessions" : wdSessions,
            "descriptor" : this.descriptor,
            "reuseSession" : this.reuseSession,
            "testSuiteName" : this.testSuiteName,
            "driver" : this.args.driver,
            "browser" : this.args.browser,
            "group" : this.args.group,
            "testName" : this.args.testName
        };

        reportManager = new ReportManager(reportObj);
        reportFile = reportManager.writeReports();

    }

    if (this.config.coverage) {
        try {
            covFile = path.resolve(this.descriptor.split(".")[0] + "-coverage.json");
        } catch (e) {
            covFile = path.resolve(global.workingDirectory, "arrow-coverage.json");
        }
        fs.writeFileSync(covFile, JSON.stringify(coverage.getFinalCoverage()), 'utf8');
        global.coverageMap.push(covFile);

    }


    if (this.startProxy) {
        this.logger.debug("closing proxy server");
        if (global.proxyManager.proxyServer) {
            global.proxyManager.proxyServer.close();
        }
    }

    if (this.args["arrowChildProcess"]) {
        this.logger.trace("Detected Child Process TearDown : Notifying Master ");
        obj = {};
        obj.SessionFactory = "Done";

        if (this.config.coverage) {
            obj.covReport = covFile;
        }

        if (reportFile) {
            obj.reportFile = reportFile;
        }

        process.send(obj);

    } else {
        if (global.workingDirectory) {
            process.chdir(global.workingDirectory);
        }

        if (this.config.coverage) {
            //console.log(global.coverageMap);
            coverage.writeReportsFor(global.coverageMap, "coverage");

            if (global.keepIstanbulCoverageJson === false) {
                //now deleting temp coverage files
                for (i = 0; i < global.coverageMap.length; i += 1) {
                    fs.unlinkSync(global.coverageMap[i]);
                }
            }
        }

        if (global.workingDirectory) {
            failed = false;
            if (this.args.exitCode) {
                for (s in reportObj.arrTestSessions) {
                    if (reportObj.arrTestSessions.hasOwnProperty(s)) {
                        session = reportObj.arrTestSessions[s];
                        reports = session.driver.reports.report.results || [];
                        for (r = 0; r < reports.length; r += 1) {
                            if (reports[r].failed) {
                                failed = true;
                            }
                        }
                    }
                }
            }
            process.exit(failed ? 1 : 0);
        }
    }
};

module.exports = SessionFactory;

