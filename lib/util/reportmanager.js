/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require('fs');
var colors = require("colors");
var UserAgent = require('useragent');
var path = require('path');
var XMLWriter = require('xml-writer');
var xw;

/**
 *
 * @param reportObj includes all information about testSessions, wsSessions and the test report itself
 * @constructor
 */
function ReportManager(reportObj) {
    var stats;

    this.passCount = 0;
    this.failCount = 0;
    this.skipCount = 0;
    this.timeCount = 0;
    this.totalCount = 0;
    this.totalTimeTaken = 0;

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
            this.xw.text(failureMessage);
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
        sessionId = testJson.sessionId,
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
        log("Failed ".red +  result.name.blue + " on "  + browser);
    } else {
        log("Passed ".green + result.name.blue + " on "  + browser);
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
                                    log(" in " +  suite.name.bold);
                                    lastSuite = suite.name;
                                }
                                msg = test.message.split('\n');
                                log(" " +  test.name.bold.red + ":" +  msg[0]);
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

    var i, j, k, strJunitReport, strReport, rep, results, testJson, yuiUserAgent, yuiSuiteName, browser, descTestName, sessionId, yuiTestCaseName, timePerTest,
        className, testName, totalTimeTaken, errorCount, testSuiteName, arrReport, xmlReportName, jsonReportName, errorRep,
        self = this,
        wdSessions = self.wdSessions,
        testSessions = self.testSessions,
        passCount = 0,
        failCount = 0,
        skipCount = 0,
        timeCount = 0,
        totalCount = 0,
        jsonReport = {},
        log = console.log,
        resultPresent = false,
        missingErrorCount = 0,
        currentUrl,
        xwRoot = new XMLWriter(),
        reportDirPath,
        stats,
        reportFilePath;

    function writeFile(fileName, data) {
        fs.writeFileSync(fileName, data, 'utf8');
        log(("Report Created: " + fileName).inverse.toString());
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

                for (k = 0; k < results.length; k = k + 1) {

                    testJson =  results[k];
                    if (testJson.type === "report") {
                        resultPresent = true;
                        this.parseYUIResults(testJson, testSessions[i].driver.testName, this);
                    }
                }
            } else {
                testJson = arrReport[j];
                if (testJson.type === "report") {
                    resultPresent = true;
                    this.parseYUIResults(testJson, testSessions[i].driver.testName, this);
                }
            }
        }
        if (!resultPresent) {
            missingErrorCount = missingErrorCount + 1;
            errorRep = arrReport[arrReport.length - 1];
            if (errorRep.results) {
                this.addTest(0, "Error." +  testSessions[i].driver.testName, "Error", errorRep.results[0].error);
            } else if (errorRep.error) {
                this.addTest(0, "Error." +  testSessions[i].driver.testName, "Error", errorRep.error);
            } else {
                console.log("Error : UNKOWN");
            }
        }
    }
    this.totalCount = this.totalCount + missingErrorCount;
    this.failCount = this.failCount + missingErrorCount;

    if (this.reportObj.descriptor) {
        reportFilePath = path.basename(this.reportObj.descriptor);
        xmlReportName = path.basename(reportFilePath, '.json') + "-report.xml";
        jsonReportName = path.basename(reportFilePath, '.json') + "-report.json";
    } else {
        // For consolidated report , use this
        log("\n*************************************************************************************");
        log("                            Consolidated Report                                          ");

        xmlReportName = "report.xml";
        jsonReportName = "report.json";
    }


    log();
    if (this.reportObj.descriptor) {
        log(("Test Report Summary for the descriptor::" + this.reportObj.descriptor).bold.magenta.toString());
    } else {
        log("Test Report Summary".bold.magenta.toString());
    }

    log();
    log(("Total Number of Executed Tests: " + this.totalCount).blue.toString());
    log(("Total Number of Passed Tests: " + this.passCount).green.toString());
    log(("Total Number of Failed Tests: " + this.failCount).red.toString());
    log(("Total Number of Skipped Tests: " + this.skipCount).cyan.toString());
    log();
    log(("Total Test Execution Time Inside Browser: " + (this.timeCount / 1000).toFixed(2) + " seconds").green.bold.toString());
    log(("Total Test Execution Time:" + this.totalTimeTaken + " seconds").green.bold.toString());
    log();
    this.errorCount = this.totalCount - this.passCount - this.failCount - this.skipCount;

    if (!this.reportObj.descriptor) {
        log("\n*************************************************************************************");
    }

    testSuiteName = "";
    if (this.reportObj.testSuiteName) {
        testSuiteName = this.reportObj.testSuiteName;
    } else {
        testSuiteName = "TestSuite";
    }

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

        writeFile(xmlReportName, strJunitReport);

        //writing json file
        for (i = 0; i < testSessions.length; i = i + 1) {
            jsonReport[testSessions[i].driver.testName] = JSON.parse(JSON.stringify(testSessions[i].driver.getReports()));
        }
        jsonReport.testSuiteName =  testSuiteName;
        writeFile(jsonReportName, JSON.stringify(jsonReport));
        console.log('\n');

    }

    return path.resolve(xmlReportName); // Is this return statement required ??
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
        timeReportJsonStr += ('"time": ' + ' "' + this.timeReport[descriptor].timeTaken  + ' seconds' + '",');

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

    timeReportJsonStr += ('] ,"Total time":' + ' "' + this.totalTimeTaken  + ' seconds' + '" ');
    timeReportJsonStr += ' }';

    fs.writeFileSync(path.resolve(global.reportFolder, 'arrow-report', 'timeReport.json'), timeReportJsonStr, 'utf8');

}

module.exports = ReportManager;
