/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require('fs');
var colors = require("colors");
var UserAgent = require('useragent');

/**
 *
 * @param reportObj includes all information about testSessions, wsSessions and the test report itself
 * @constructor
 */
function ReportManager(reportObj) {
    var stats;
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
        if (reportObj.reportFolder) {
            stats = fs.lstatSync(reportObj.reportFolder);
            if (stats.isDirectory()) {
                this.reportFolder = reportObj.reportFolder;
            }
        }
    } catch (ex) {
        //console.log(ex);
    }
}

ReportManager.prototype.showReportOnConsole = function (result, verbose) {

//    console.log("Result: " + JSON.stringify(result));
//    console.log("Verbose " + verbose);

    var lastSuite, suite, k, k1, test, msg, m, browser,
        log = console.log;

    log("");
    browser = result.ua;
    if (result.failed) {
        log("Failed ".red +  result.name.blue + " on"  + browser);
    } else {
        log("Passed ".green + result.name.blue + " on"  + browser);
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
        log = console.log;
        resultPresent = false;
        errorCount = 0;

    function writeFile(fileName, data) {

        if (self.reportFolder) {
            fileName = self.reportFolder  + fileName;
        }
        fs.writeFileSync(fileName, data, 'utf8');
        log(("Report Created: " + fileName).inverse);
    }

    function addProperty(name, val) {
        if (val) {
            strReport += "<property name='" + name + "' value='" + val + "' />";
        }
    }
    function addTest(time, className, name, failureMessage, log) {
        strReport += "<testcase time='" + (time / 1000).toFixed(2) + "' classname='" + className  + "' name='" + name + "'";
        if (failureMessage) {
            strReport += "><failure><![CDATA[" + failureMessage + "]]></failure>" + log + "</testcase>";
        } else {
            strReport += "/>";
        }
    }

    function parseYUIResults(testJson, dtName) {
        var l, m;

        yuiUserAgent = testJson.ua;
        yuiSuiteName = testJson.name;
        browser = UserAgent.parse(yuiUserAgent).toAgent();
        if (browser === "Other 0.0.0") {
            browser = "NodeJS";
        }
        descTestName = dtName;
        sessionId = testJson.sessionId;
        for (l in testJson) {
            if (testJson[l]) {
                if (testJson[l].type === "testcase") {
                    yuiTestCaseName = testJson[l].name;
                    timePerTest = testJson[l].duration / testJson[l].total;
                    passCount += testJson[l].passed;
                    failCount += testJson[l].failed;
                    skipCount += testJson[l].ignored;
                    timeCount += testJson[l].duration;
                    totalCount += testJson[l].total;
                    for (m in testJson[l]) {
                        if (testJson[l][m].type === "test") {
                            className = browser + "." + descTestName;
                            testName = yuiSuiteName + "::" + yuiTestCaseName + "::" + testJson[l][m].name;
                            if (testJson[l][m].result === "pass") {
                                addTest(timePerTest, className, testName);
                            } else {
                                addTest(timePerTest, className, testName, testJson[l][m].message);
                            }
                        }
                    }
                }
            }
        }
    }
    strReport = "<properties>";
    addProperty("descriptor", this.reportObj.descriptor);
    addProperty("parallel", this.reportObj.parallel);
    addProperty("driver", this.reportObj.driver);
    addProperty("browser", this.reportObj.browser);
    addProperty("reuseSession", this.reportObj.reuseSession);
    addProperty("activeSeleniumSessionCount", wdSessions.length);
    addProperty("seleniumSessionIds", wdSessions.join());
    addProperty("group", this.reportObj.group);
    addProperty("testName", this.reportObj.testName);
    addProperty("reportFolder", this.reportObj.reportFolder);
    strReport += "</properties>";

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
                    if(testJson.type === "report") {
                        resultPresent = true;
                        parseYUIResults(testJson, testSessions[i].driver.testName);
                    }
                }


            } else {
                testJson = arrReport[j];
                if(testJson.type === "report") {
                    resultPresent = true;
                    parseYUIResults(testJson, testSessions[i].driver.testName);
                }
            }
        }

        if(!resultPresent) {
            errorCount = errorCount + 1;
           var errorRep = arrReport[arrReport.length-1];

           if(errorRep.results) {
               //console.log("Error :" + errorRep.results[0].error);
               addTest(0, "Error." +  testSessions[i].driver.testName,"Error" , errorRep.results[0].error);

           } else if (errorRep.error) {
              // console.log("Error : " +errorRep.error)
               addTest(0, "Error." +  testSessions[i].driver.testName,"Error" , errorRep.error);
           } else{
               console.log("Error : UNKOWN");
           }


            console.log("Test Session dint have any report");
        }
    }
    log();
    log("Test Report Summary".bold.magenta);
    log();
    log(("Total Number of Executed Tests: " + (totalCount + errorCount) ).blue);
    log(("Total Number of Passed Tests: " + passCount).green);
    log(("Total Number of Failed Tests: " + ( errorCount + failCount) ).red);
    log(("Total Number of Skipped Tests: " + skipCount).cyan);
    log();
    log(("Total Test Execution Time Inside Browser: " + (timeCount / 1000).toFixed(2) + " seconds").green.bold);
    totalTimeTaken = Date.now() - global.startTime;
    log(("Total Test Execution Time:" + (totalTimeTaken / 1000).toFixed(2) + " seconds").green.bold);
    log();

    errorCount = totalCount - passCount - failCount - skipCount;

    testSuiteName = "";
    if (this.reportObj.testSuiteName) {
        testSuiteName = this.reportObj.testSuiteName;
    } else {
        testSuiteName = "TestSuite";
    }

    //writing xml file
    strJunitReport = "<testsuite failures='" + failCount + "' time='" + (totalTimeTaken / 1000).toFixed(2) + "' errors='" + errorCount + "' skipped='" + skipCount + "' tests='" + totalCount + "' name='" + testSuiteName + "'>";
    strJunitReport += strReport;
    strJunitReport += "</testsuite>";
    if (this.reportObj.descriptor) {

        xmlReportName = this.reportObj.descriptor.split(".")[0] + "-report.xml";
        jsonReportName = this.reportObj.descriptor.split(".")[0] + "-report.json";
    } else {
        xmlReportName = "report.xml";
        jsonReportName = "report.json";
    }
    writeFile(xmlReportName, strJunitReport);

    //writing json file
    for (i = 0; i < testSessions.length; i = i + 1) {
        jsonReport[testSessions[i].driver.testName] = JSON.parse(JSON.stringify(testSessions[i].driver.getReports()));
    }
    jsonReport.testSuiteName =  testSuiteName;
    writeFile(jsonReportName, JSON.stringify(jsonReport));
};

module.exports = ReportManager;
