/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require('fs');
var colors = require("colors");
var UserAgent = require('useragent');
var FileUtil = require("../util/fileutil");
var path = require('path');
var XMLWriter = require('xml-writer');
var util = require('util');
var xw;
var log4js = require("log4js");
var existsSync = fs.existsSync || path.existsSync;

/**
 *
 * @param reportObj includes all information about testSessions, wsSessions and the test report itself
 * @constructor
 */
function ReportManager(reportObj) {
    this.passCount = 0;
    this.failCount = 0;
    this.skipCount = 0;
    this.timeCount = 0;
    this.totalCount = 0;
    this.totalTimeTaken = 0;
    this.logger = log4js.getLogger("ReportManager");

    if (reportObj) {
        this.timeReport = reportObj.timeReport;
    }

    xw = new XMLWriter();
    this.xw = xw;

    //checking if we need to do colorless reporting.
    if (global.color === false) {
        colors.mode = "none";
    } else {
        if (!process.stdout.isTTY) {
            colors.mode = "none";
        }
    }
    try {
        if (reportObj.arrTestSessions) {
            this.testSessions = reportObj.arrTestSessions;
        } else {
            this.testSessions = [];
        }
        if (reportObj.arrWDSessions) {
            this.wdSessions = reportObj.arrWDSessions;
        } else {
            this.wdSessions = [];
        }
        this.reportObj = reportObj;

    } catch (ex) {
        //console.log(ex);
    }

}

ReportManager.prototype.addProperty = function (name, val) {
    if (val) {
        val += '';  // convert to string, since XMLWriter is picky
        this.xw.startElement('property');
        this.xw.writeAttribute('name', name);
        this.xw.writeAttribute('value', val);
        this.xw.endElement();
    }
};


ReportManager.prototype.addTest = function (time, className, name, failureMessage) {
    this.xw.startElement('testcase');
    this.xw.writeAttribute('time', (time / 1000).toFixed(2));
    this.xw.writeAttribute('classname', className);
    this.xw.writeAttribute('name', name);

    if (failureMessage) {
        if (failureMessage === "skip") {
            this.xw.writeAttribute('executed', 'false');
        } else {
            this.xw.startElement('failure');
            this.xw.text(util.format(failureMessage));
            this.xw.endElement();
        }
    }

    this.xw.endElement();
};

ReportManager.prototype.parseYUIResults = function (testJson, dtName, self) {

    var l, m, errorRep,
        yuiUserAgent = testJson.ua,
        yuiSuiteName = testJson.name,
        browser = UserAgent.parse(yuiUserAgent).toAgent(),
        descTestName = dtName,
        currentUrl = testJson.currentUrl,
        yuiTestCaseName,
        timePerTest,
        className,
        testName;

    if (browser === "Other 0.0.0") {
        browser = "NodeJS";
    }

    for (l in testJson) {
        if (testJson[l]) {
            if (testJson[l].type === "testcase") {
                yuiTestCaseName = testJson[l].name;
                timePerTest = testJson[l].duration / testJson[l].total;
                self.passCount += testJson[l].passed;
                self.failCount += testJson[l].failed;
                self.skipCount += testJson[l].ignored;
                self.timeCount += testJson[l].duration;
                self.totalCount += testJson[l].total;

                for (m in testJson[l]) {
                    if (testJson[l][m].type === "test") {
                        className = browser + "." + descTestName;
                        testName = yuiSuiteName + "::" + yuiTestCaseName + "::" + testJson[l][m].name;
                        if (testJson[l][m].result === "fail") {
                            self.addTest(timePerTest, className, testName, testJson[l][m].message + "." + "\n" + " URL :" + currentUrl);
                        } else if (testJson[l][m].result === "pass") {
                            self.addTest(timePerTest, className, testName);
                        } else if (testJson[l][m].result === "ignore") {
                            self.addTest(timePerTest, className, testName, "skip");
                        }
                    }
                }
            }
        }
    }
};

ReportManager.prototype.showReportOnConsole = function (result, verbose) {

    var lastSuite, suite, k, k1, test, msg, m, browser,
        log = console.log;

    log("");
    browser = result.ua;
    if (result.failed) {
        log("Failed ".red + result.name.blue + " on " + browser);
    } else {
        log("Passed ".green + result.name.blue + " on " + browser);
    }
    log((result.passed + " Passed").green + ", " + (result.failed + " Failed ").red + ", " + (result.ignored + " skipped ").grey);
    if (result.failed) {
        for (k in result) {
            suite = result[k];
            if ("object" === typeof suite) {

                if (suite.failed) {
                    for (k1 in suite) {
                        test = suite[k1];
                        if ("object" === typeof test) {
                            if ("fail" === test.result) {

                                if (!lastSuite || lastSuite !== suite.name) {
                                    log(" in " + suite.name.bold);
                                    lastSuite = suite.name;
                                }
                                msg = test.message.split('\n');
                                log(" " + test.name.bold.red + ":" + msg[0]);
                                for (m = 1; m < msg.length; m = m + 1) {
                                    log(" " + msg[m]);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    log("");
};

ReportManager.prototype.writeReports = function () {

    var i, j, k, strJunitReport, strReport, rep, results, testJson, browser,
        testName, testSuiteName, arrReport, xmlReportName, jsonReportName, errorRep,
        self = this,
        wdSessions = self.wdSessions,
        testSessions = self.testSessions,
        jsonReport = {},
        log = console.log,
        resultPresent = false,
        missingErrorCount = 0,
        xwRoot = new XMLWriter(),
        fileUtil = new FileUtil(),
        dirPath,
        relPath;
    function writeFile(fileName, data) {
        fs.writeFileSync(fileName, data, 'utf8');
        log(("Report Created: " + fileName).inverse.toString());
    }

    /**
     * log test results on console
     */
    function logTestResults(reportObj) {
        log();
        log(("Total Number of Executed Tests: " + reportObj.totalCount).blue.toString());
        log(("Total Number of Passed Tests: " + reportObj.passCount).green.toString());
        log(("Total Number of Failed Tests: " + reportObj.failCount).red.toString());
        log(("Total Number of Skipped Tests: " + reportObj.skipCount).cyan.toString());
        log();
        log(("Total Test Execution Time Inside Browser: " + (reportObj.timeCount / 1000).toFixed(2) + " seconds").green.bold.toString());
        log(("Total Test Execution Time:" + reportObj.totalTimeTaken + " seconds").green.bold.toString());
        log();
    }


    for (i = 0; i < testSessions.length; i = i + 1) {

        rep = testSessions[i].driver.getReports();

        if (rep.scenario) {
            arrReport = rep.scenario;
        } else {
            arrReport = rep.results;
        }
        resultPresent = false;
        for (j = 0; j < arrReport.length; j = j + 1) {
            if (rep.scenario) {
                results = arrReport[j].results;
                try {
                    for (k = 0; k < results.length; k = k + 1) {
                        testJson = results[k];
                        if (testJson.type === "report") {
                            if (!(testJson.passed === 0 && testJson.failed === 0 && testJson.total === 0)) {
                                resultPresent = true;
                                this.parseYUIResults(testJson, testSessions[i].driver.testName, this);
                            }
                        }
                    }
                } catch (e) {

                }
            } else {
                testJson = arrReport[j];
                if (testJson.type === "report") {
                    if (!(testJson.passed === 0 && testJson.failed === 0 && testJson.total === 0)) {
                        resultPresent = true;
                        this.parseYUIResults(testJson, testSessions[i].driver.testName, this);
                    }
                }
            }
        }

        if (this.reportObj.descriptor) {
            console.log('\n*****Result present for descriptor ' + this.reportObj.descriptor + ' \'s test ' + testSessions[i].driver.testName + ': ' + resultPresent);
        }

        if (!resultPresent) {
            try {
                errorRep = arrReport[arrReport.length - 1];
                if (errorRep) {

                    console.log('ErrorRep present::' + JSON.stringify(errorRep));

                    missingErrorCount = missingErrorCount + 1;
                    if (errorRep.results && errorRep.results.length > 0) {
                        console.log('ErrorRep results::');
                        this.addTest(0, "Error." + testSessions[i].driver.testName, "Error", errorRep.results[0].error);
                    } else if (errorRep.error) {
                        console.log('ErrorRep error::');
                        this.addTest(0, "Error." + testSessions[i].driver.testName, "Error", errorRep.error);
                    } else {
                        self.logger.debug("Test Report Error : UNKOWN");
                        this.addTest(0, "Error." + testSessions[i].driver.testName, "Error", "Test failed without any error message !!!!");
                    }
                    console.log('****Missing Error Count:' + missingErrorCount);
                } else {
                    if (!testSessions[i].driver.hasTest) {
                        self.logger.info("No TestReport found, but passing the test because 'hasTest' was passed as 'false'");
                        self.passCount += 1;
                        self.totalCount += 1;
                        this.addTest(0, testSessions[i].driver.browserName + "." + testSessions[i].driver.testName, "NoTestClass");
                    } else {
                        self.logger.error("Test failed without any error message");
                    }
                }
            } catch (err) {
                self.logger.debug('***Exception if result not present: ' + err);
            }
        }
    }
    this.totalCount = this.totalCount + missingErrorCount;
    this.failCount = this.failCount + missingErrorCount;
    console.log('****Fail Count:' + this.failCount);

    if (this.reportObj.descriptor) {

        dirPath = path.dirname(this.reportObj.descriptor);
        if (global.reportFolder) {

            // if condition to keep unit tests happy on node10
            if (global.workingDirectory) {
                //Get relative path to the descriptor
                relPath = path.relative(global.workingDirectory, dirPath);
            } else {
                relPath = dirPath;
            }

            dirPath = path.resolve(global.reportFolder, 'arrow-report', relPath);
            // Create directory if it doesnt exist
            // This check helps when keepTestReport is set to true ( If its not set to true, arrow-report would have been cleaned up as part of setup anyways
            if (!existsSync(dirPath)) {
                fileUtil.createDirectory(dirPath);
            }

        }

        xmlReportName = path.resolve(dirPath, path.basename(this.reportObj.descriptor, '.json') + "-report.xml");
        jsonReportName = path.resolve(dirPath, path.basename(this.reportObj.descriptor, '.json') + "-report.json");

        if (this.failCount > 0) {
            console.log('Pushing to failed descriptors for the descriptor....' + this.reportObj.descriptor);
            global.failedDescriptors.push({"desc" : this.reportObj.descriptor, "failures" : this.failCount});
        }

        log(("Test Report Summary for the descriptor::" + this.reportObj.descriptor).bold.magenta.toString());

        logTestResults(this);

    } else {

        xmlReportName = "arrow-test-summary.xml";
        jsonReportName = "arrow-test-summary.json";

        if (this.reportObj.showConsolidatedReport) {

            log("\n*************************************************************************************");
            log("                            Consolidated Report                                          ");

            log("Test Report Summary".bold.magenta.toString());
            logTestResults(this);

            log("\n*************************************************************************************");

        }

        if (global.failedDescriptors.length > 0) {

            log("\n*************************************************************************************");
            log("                           List of failed descriptors                                  ");

            for (i = 0; i < global.failedDescriptors.length; i += 1) {
                log('\nFailed Descriptor Path : ' + global.failedDescriptors[i].desc);
                log('Total Number of Failed Tests : ' + global.failedDescriptors[i].failures);
                log("-----------------------------------------------------------------------");
            }
            log('\n');

        }


    }

    testSuiteName = "";
    if (this.reportObj.testSuiteName) {
        testSuiteName = this.reportObj.testSuiteName;
    } else {
        testSuiteName = "TestSuite";
    }
    this.errorCount = this.totalCount - this.passCount - this.failCount - this.skipCount;

    // Store report files in user specified location, if explicitly specified, otherwise store in arrow-target/arrow-report
    if (global.reportFolder) {

        this.xw.startElement("properties");
        this.addProperty("descriptor", this.reportObj.descriptor);
        this.addProperty("parallel", this.reportObj.parallel);
        this.addProperty("driver", this.reportObj.driver);
        this.addProperty("browser", this.reportObj.browser);
        this.addProperty("reuseSession", this.reportObj.reuseSession);
        this.addProperty("activeSeleniumSessionCount", wdSessions.length);
        this.addProperty("seleniumSessionIds", wdSessions.join());
        this.addProperty("group", this.reportObj.group);
        this.addProperty("testName", this.reportObj.testName);
        this.xw.endElement();
        //collecting all report
        strReport = xw.toString();

        //starting report root
        xwRoot.startDocument();
        xwRoot.startElement("testsuite");
        xwRoot.writeAttribute('failures', this.failCount.toString());
        xwRoot.writeAttribute('time', this.totalTimeTaken.toString());
        xwRoot.writeAttribute('errors', this.errorCount.toString());
        xwRoot.writeAttribute('skipped', this.skipCount.toString());
        xwRoot.writeAttribute('tests', this.totalCount.toString());
        xwRoot.writeAttribute('name', testSuiteName.toString());
        xwRoot.text("$$report$$");
        xwRoot.endElement();
        xwRoot.endDocument();
        strJunitReport = xwRoot.toString().replace("$$report$$", strReport);


        xmlReportName = path.resolve(global.reportFolder, 'arrow-report', xmlReportName);
        jsonReportName = path.resolve(global.reportFolder, 'arrow-report', jsonReportName);

        log('\n');
        writeFile(xmlReportName, strJunitReport);

        //writing json file
        for (i = 0; i < testSessions.length; i = i + 1) {
            jsonReport[testSessions[i].driver.testName] = JSON.parse(JSON.stringify(testSessions[i].driver.getReports()));
        }
        jsonReport.testSuiteName = testSuiteName;
        writeFile(jsonReportName, JSON.stringify(jsonReport));
        log('\n');

    }

};

ReportManager.prototype.writeTimeReport = function () {

    var timeReportJsonStr,
        descriptor,
        testSessionTimeArr,
        testName;

    timeReportJsonStr = '{ "descriptors" : [';

    for (descriptor in this.timeReport) {

        timeReportJsonStr += "{";
        timeReportJsonStr += ('"descriptor": ' + ' "' + descriptor + '"' + ' ,');
        timeReportJsonStr += ('"time": ' + ' "' + this.timeReport[descriptor].timeTaken + ' seconds' + '",');

        testSessionTimeArr = this.timeReport[descriptor].testSessionTimeArr;

        timeReportJsonStr += '"tests": [';

        for (testName in testSessionTimeArr) {
            timeReportJsonStr += '{';
            timeReportJsonStr += ('"Testname" :' + ' "' + testName + '"' + ',');
            timeReportJsonStr += ('"Time" :' + ' "' + testSessionTimeArr[testName].timeTaken + ' seconds' + '"');
            timeReportJsonStr += '} ,';
        }

        if (timeReportJsonStr.charAt(timeReportJsonStr.length - 1) === ",") {
            timeReportJsonStr = timeReportJsonStr.slice(0, -1);
        }

        timeReportJsonStr += " ] } ,";
    }

    if (timeReportJsonStr.charAt(timeReportJsonStr.length - 1) === ",") {
        timeReportJsonStr = timeReportJsonStr.slice(0, -1);
    }

    timeReportJsonStr += ('] ,"Total time":' + ' "' + this.totalTimeTaken + ' seconds' + '" ');
    timeReportJsonStr += ' }';

    fs.writeFileSync(path.resolve(global.reportFolder, 'arrow-report', 'timeReport.json'), timeReportJsonStr, 'utf8');

};

module.exports = ReportManager;
