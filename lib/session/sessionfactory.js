/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var log4js = require("log4js");
var DataProvider = require("../util/dataprovider");
var ReportManager = require("../util/reportmanager");
var LibManager = require('../util/libmanager');
var SessionUtil = require('./sessionUtil');
var TestExecutor = require("../session/testexecutor");
var coverage = require("../util/coverage");
var fs = require("fs");
var path = require("path");
var Servermanager = require("../../arrow_server/arrowservermanager.js");
var PhantomJsSetup = require("../util/phantomJsSetup.js");

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
    this.useSSL = args.useSSL;
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
    this.proxyConfig = undefined;
    this.startProxy = false;

    // Contains information about the descriptor - No. of tests in descriptor, test suite name etc
    this.descriptorObj = {};

    this.testSessionMap = {};

    this.proxyConfigList = [];

    this.phantomJsSetup = PhantomJsSetup.getInstance();

    /*  timeReportObj stores total time taken ,time taken for each descriptor as well as time taken for each test within the descriptor
     {
     "descriptors":[
     {
     "descriptor":"descriptor-1.json",
     "time":"9 seconds",
     "tests":[
     {
     "Testname":"Test 1",
     "Time":"9 seconds"
     }
     ]
     }
     ],
     "Total time":"9 seconds"  }
     */
    this.timeReportObj = {}; // TODO - Decide if descriptorObj can be used instead of timeReportObj

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

SessionFactory.prototype.setSSL = function (descriptorJson) {
    this.testJson = descriptorJson;
    var strJson = JSON.stringify(this.testJson);
    var strFinalJson = strJson.replace(/http:/g,"https:");
    this.testJson =  JSON.parse(strFinalJson);

    return this.testJson;
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
        j,
        descFile,
        relativePath,
        testJsonArr,
        isDataDriven,
        qualifiedDescriptorPath,
        descriptorPath;


    // Iterate over all descriptor files and get the tests
    for (i = 0; i < this.arrDescriptor.length; i += 1) {
        descFile = this.arrDescriptor[i];
        //TODO : use path module here
        relativePath = descFile.substring(0, descFile.lastIndexOf(global.pathSep));
        dpreader = new DataProvider(this.config, this.args,descFile);
        testJsonArr = dpreader.getTestData();

        for (j = 0; j < testJsonArr.length; j+=1) {

            testJson = testJsonArr[j];
            isDataDriven = testJson && (testJson.dataDriver || (testJson.config instanceof Array));
            descriptorPath = descFile;

            qualifiedDescriptorPath = descriptorPath;
            if (isDataDriven){
                qualifiedDescriptorPath += (' - ' + testJson.dataDriverKey);
            }

            if (!this.descriptorObj[qualifiedDescriptorPath]) {
                this.descriptorObj[qualifiedDescriptorPath] = {};
                this.descriptorObj[qualifiedDescriptorPath].testSessionCount = 0;
            }

            this.descriptorObj[qualifiedDescriptorPath].dataDriverKey = testJson.dataDriverKey;
            this.descriptorObj[qualifiedDescriptorPath].testSuiteName = testJson.name;

            //Check if the useSSL flag is set from either commandline or at descriptor level
            if (testJson.useSSL) {
                testJson =  this.setSSL(testJson);
            } else if (this.useSSL && testJson.useSSL != false) {
                testJson =  this.setSSL(testJson);
            }

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
                    descLib += "," + this.libManager.getAllTest(this.args.lib, "");
                } else {
                    descLib = this.libManager.getAllTest(this.args.lib, "");
                }
            }

            for (testName in dp) {
                testData = dp[testName];

                if (testData.enabled === null || false === testData.enabled ||  "false" === testData.enabled) {
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
                testData.proxyConfig = testJson.routerProxyConfig;
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
                // Store relativePath of the json file, if not already set [ Will be set already in case of imported descriptor ]
                if (!testData.relativePath) {
                    testData.relativePath = path.dirname(descFile);
                }

                // Store the descriptor file name ( with path and  test name & keys ( if data drive)) in testSession object
                testData.qualifiedDescriptorPath = qualifiedDescriptorPath;
                testData.descriptorPath = descriptorPath;

                if (this.descriptorObj[qualifiedDescriptorPath]) {
                    this.descriptorObj[qualifiedDescriptorPath].testSessionCount = 0;
                }

                // Initialize the share area
                testData.params.shared = {};

                if (testData.config && testData.config.descriptorSharedParams) {
                    testData.params.descriptorSharedParams = testData.config.descriptorSharedParams;
                } else {
                    testData.params.descriptorSharedParams = {};
                }

                tests.push(testData);

            }

        }

    }

    return tests;
};

SessionFactory.prototype.tearDown = function (testQueue, wdSessions) {
    var reportObj = {},
        reportManager,
        covFile,
        i,
        failed,
        totalTimeTaken,
        showConsolidatedReport;

    //adding this for unit testing
    this.testQueue = testQueue;
    this.logger.trace("SessionFactory:TearDown");

    totalTimeTaken = ((Date.now() - global.startTime) / 1000).toFixed(2);
    if (this.args.report && testQueue.sessions) {

        // Show consolidated reports only when more than 1 descriptors
        if (this.descriptorObj && Object.keys(this.descriptorObj).length > 1) {
            showConsolidatedReport = true;
        }

        reportObj = {
            "reportFolder" :  global.reportFolder,
            "arrTestSessions" : testQueue.sessions,
            "arrWDSessions" : wdSessions,
            "descriptor" : this.descriptor,
            "reuseSession" : this.reuseSession,
            "driver" : this.args.driver,
            "browser" : this.args.browser,
            "group" : this.args.group,
            "testName" : this.args.testName,
            "testSuiteName" : "ARROW TESTSUITE",
            "showConsolidatedReport" : showConsolidatedReport
        };

        reportManager = new ReportManager(reportObj);
        reportManager.totalTimeTaken = totalTimeTaken;
        reportManager.writeReports();

    }
    if (global.reportFolder) {

        reportObj.timeReport = this.timeReportObj;
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
        // get the coverage data from child processes
        // the dirname: child_process_coverage must be matched with defined in sharelib/lib/server/mock-child-process.js
        var glob = require("glob"),
            results = glob.sync("**/child_process_coverage/**/coverage.json");
        global.coverageMap.push.apply(global.coverageMap, results);
    }
    if (this.startProxy) {
        this.logger.debug("closing proxy server");
        if (global.proxyManager.proxyServer) {
            global.proxyManager.proxyServer.close();
        }
    }
    if (this.config.coverage) {
        coverage.writeReportsFor(global.coverageMap, "coverage");

        if (global.keepIstanbulCoverageJson === false) {
            //now deleting temp coverage files
            for (i = 0; i < global.coverageMap.length; i += 1) {
                fs.unlinkSync(global.coverageMap[i]);
            }
        }
    }

    if (this.config.startArrowServer === true) {
        Servermanager.stopArrowServer(true);
    }

    if (this.config.startPhantomJs === true || this.config['phantomHost']) {
        this.phantomJsSetup.stopPhantomJs();
    }

    if (global.workingDirectory) {

        failed = false;
        if (this.args.exitCode === true) {
            failed = this.isFailure(reportObj);
        }

        process.exit(failed ? 1 : 0);
    }
};

/**
 * Returns true, if a failure is found in the reportObj
 * @param reportObj
 * @returns {boolean}
 */
SessionFactory.prototype.isFailure = function (reportObj) {

    var s,
        session,
        report,
        self = this,
        sessionUtil = new SessionUtil(),
        isFail = false;

    if (reportObj && reportObj.arrTestSessions) {

        for (var s in reportObj.arrTestSessions) {

            try {
                session = reportObj.arrTestSessions[s];
                report = session.driver.reports.report;
                isFail = sessionUtil.isFail(report);
                if (isFail) {
                    self.logger.debug('Exiting with non-zero failure code');
                    return true;
                }
            }
            catch(e) {
                self.logger.error('Error while looking for failures in test report : ' + e);
            }

        }
    }
    return false;

};

module.exports = SessionFactory;
