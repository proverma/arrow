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
}

SessionFactory.prototype.runAllTestSessions = function () {
    var self = this,
        // counters to track all sessions
        curSessionCount = 0,
        totalSessionCount = 0,
        wdSessions = [],
        hub;

    function runNextTest(testQueue) {
        var testSession;

        if (testQueue.curIndex === testQueue.sessions.length) {
            return; // all done with this queue
        }

        testSession = testQueue.sessions[testQueue.curIndex];
        testQueue.curIndex += 1;
        testSession.runTest(function () {
            self.logger.trace("Run Test :" + curSessionCount + "==" + totalSessionCount);
            curSessionCount += 1;
            if (curSessionCount === totalSessionCount) {
                self.logger.debug("Done with all the sessions");
                self.tearDown(testQueue, wdSessions);
            } else {
                self.logger.debug("Calling Next Test : " + curSessionCount);
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

        if (self.descriptor) {
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
                totalSessionCount += browsers.length;
            }
        }

        self.logger.info("Total test sessions: " + totalSessionCount);
        for (i = 0; i < testQueues.length; i += 1) {
            // start running as many sessions as we can in parallel as speicified
            for (j = 0; j < parallelCount; j += 1) {
                runNextTest(testQueues[i]);
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
            this.logger.info("Browser filterting. Skipping test/browser: " + test.name + "/" + browser);
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
        testInstanceLib;

    dpreader = new DataProvider(this.config, this.descriptor);
    testJson = dpreader.getTestData();
    this.testSuiteName = testJson.name;
    dp = testJson.dataprovider;
    commonLib = testJson.commonlib;
    testConfig = testJson.config;
    if (this.browser) {
        testJson.browser = this.browser;
    }

    this.logger.debug("runDataDrivenTest :");
    this.logger.debug(dp);
    this.logger.debug("controller config :");
    this.logger.debug(testConfig);

    this.descLib = "";
    if (commonLib) {
        descLib = this.libManager.getAllTest(commonLib);
    }
    this.logger.debug("Desc Lib :" + descLib);
    if (this.args.lib) {
        if (descLib) {
            descLib += "," + this.args.lib;
        } else {
            descLib = this.args.lib;
        }
    }

    for (testName in dp) {
        testData = dp[testName];
        if (false === testData.enabled || "false" === testData.enabled) {
            this.logger.info("Disabled, skipping test: " + testName);
            continue;
        }

        if (this.group && !testData.group) {
            this.logger.info("Group filtering : no group defined for test, skipping test: " + testName);
            continue;
        }

        if (this.group && (-1 === testData.group.indexOf(this.group))) {
            this.logger.info("Group filtering, skipping test: " + testName);
            continue;
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
        tests.push(testData);
    }

    return tests;
};

SessionFactory.prototype.tearDown = function (testQueue, wdSessions) {
    var reportObj,
        reportManager,
        reportFile,
        covFile,
        obj,
        i;

    //adding this for unit testing
    this.testQueue = testQueue;
    this.logger.debug("SessionFactory:TearDown");
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
        covFile = path.resolve(this.descriptor.split(".")[0] + "-coverage.json");
        fs.writeFileSync(covFile, JSON.stringify(coverage.getFinalCoverage()), 'utf8');
        global.coverageMap.push(covFile);
       // console.log(global.coverageMap);
    }

    if (this.args["arrowChildProcess"]) {
        this.logger.debug("Detected Child Process TearDown : Notifying Master ");
        obj = {};
        obj.SessionFactory = "Done";

        if (this.config.coverage) {
            obj.covReport = covFile;
        }

        if (reportFile) {
            obj.reportFile = reportFile;
        }

        if (this.config.proxyUrl) {
            this.logger.debug("Closing Proxy Server : " + this.config.proxyUrl);
            global.proxyManager.proxyServer.close();
        }
        process.send(obj);

    } else {
        process.chdir(global.workingDirectory);

        if (this.config.proxyUrl) {
            global.proxyManager.proxyServer.close();
        }

        if (this.config.coverage) {
            //console.log(global.coverageMap);
            coverage.writeReportsFor(global.coverageMap, "coverage");

            //now deleting temp coverage files
            for (i = 0; i < global.coverageMap.length; i += 1) {
                fs.unlinkSync(global.coverageMap[i]);
            }
        }

        process.exit(0);
    }
};

module.exports = SessionFactory;

