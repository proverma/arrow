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
var TestExecutor = require("../session/testexecutor");
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

    // Object of key value pairs - key = descriptor name, value = time taken to run the descriptor
    this.descriptorTimeMap = [];

    this.testSessionMap = {};

    this.routerConfigList = [];

    this.timeReportObj = {};


}

SessionFactory.prototype.runAllTestSessions = function () {
    var self = this,
        testExecutor = new TestExecutor(self);

    testExecutor.executeTests();
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
        if (0 === browser.length) {
            continue;
        }

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
        descFile,
        relativePath;

    // Iterate over all descriptor files and get the tests
    for (i = 0; i < this.arrDescriptor.length; i += 1) {

        descFile = this.arrDescriptor[i];

        relativePath = descFile.substring(0, descFile.lastIndexOf(global.pathSep));

        dpreader = new DataProvider(this.config, descFile);
        testJson = dpreader.getTestData();

        this.testSuiteName = testJson.name;
        dp = testJson.dataprovider;

        commonLib =  testJson.commonlib;
        testConfig = testJson.config;
        if (this.browser) {
            testJson.browser = this.browser;
        }

        this.logger.trace("runDataDrivenTest :");
        this.logger.trace(dp);
        this.logger.trace("controller config :");
        this.logger.trace(testConfig);

//        this.descLib = "";
        if (commonLib) {
            descLib = this.libManager.getAllTest(commonLib, relativePath);
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
            // Set proxy configuration in test session
            testData.startProxyServer = testJson.startProxyServer;
            testData.routerProxyConfig = testJson.routerProxyConfig;
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
                testInstanceLib = this.libManager.getAllTest(testData.params.lib, relativePath);
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

            // Store relativePath of the json file
            testData.relativePath = descFile.substring(0, descFile.lastIndexOf(global.pathSep));

            // Store the descriptor file name ( with path ) in testSession object
            testData.descriptorPath = descFile;
            // Store the no. of test sessions in the descriptor
            if (this.descriptorMap[descFile]) {
                this.descriptorMap[descFile] = this.descriptorMap[descFile] + 1;
            } else {
                this.descriptorMap[descFile] = 1;
            }
            // Initialize the share area
            testData.params.shared = {};

            tests.push(testData);

        }
    }
    return tests;
};

SessionFactory.prototype.tearDown = function (testQueue, wdSessions) {
    var reportObj,
        reportManager,
        reportFile,
        covFile,
        i,
        failed,
        s,
        session,
        r,
        reports,
        totalTimeTaken;

    //adding this for unit testing
    this.testQueue = testQueue;
    this.logger.trace("SessionFactory:TearDown");

    totalTimeTaken = ((Date.now() - global.startTime) / 1000).toFixed(2);
    if (this.args.report && testQueue.sessions) {

        reportObj = {
            "reportFolder" :  global.reportFolder,
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
        reportManager.totalTimeTaken = totalTimeTaken;
        reportFile = reportManager.writeReports();

    }
    if (global.reportFolder) {

        reportObj = {
            "timeReport" : this.timeReportObj
        };

        reportManager = new ReportManager(reportObj);
        reportManager.totalTimeTaken = totalTimeTaken;
        reportManager.writeTimeReport();

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

};

module.exports = SessionFactory;
