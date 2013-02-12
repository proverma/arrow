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
//var passCount = 0,failCount = 0,skipCount = 0,timeCount = 0, totalCount = 0;
//var util = require('util');

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

    xw = new XMLWriter(); // TODO - Is this needed
    this.xw = xw; // TODO - done this for unit testing .. Is it a right approach ??

//    console.log('<<\n\nIn reportmanager constructor..'+this.xw.toString()+",passcount:"+this.passCount);

//    console.log('<<\n\nIn reportManager..'+global.color);
//    console.log('<<\n\nIn reportManager 1..reportObj:'+JSON.stringify(reportObj));
//    console.log('<<\n\nIn reportManager 2..'+util.inspect(reportObj.arrTestSessions,false,null));
//    console.log('<<\n\nIn reportManager 2..'+reportObj.arrTestSessions);
//    console.log('<<\n\nIn reportManager 2..'+reportObj.arrWDSessions);
//    console.log('<<\n\nIn reportManager 3..'+reportObj.reportFolder);

    //checking if we need to do colorless reporting.
    if (global.color === false) {
        colors.mode = "none";
    } else {
        if (!process.stdout.isTTY){
            colors.mode = "none";
        }
    }
    try {
        if (reportObj.arrTestSessions) {
//            console.log('\n\n<<arrTestSessions...'+JSON.stringify(reportObj.arrTestSessions));
            this.testSessions = reportObj.arrTestSessions;
        } else {
            this.testSessions = [];
        }
//        console.log('<<\narrTestSessions::'+this.testSessions.length);
        if (reportObj.arrWDSessions) {
//            console.log('\n\n<<arrWDSessions...'+JSON.stringify(reportObj.arrWDSessions));
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
        console.log(ex);
    }
}

ReportManager.prototype.addProperty = function(name, val) {
//    console.log('<<In addProperty..'+name+':'+val);
    if (val) {
//        console.log('\n<<In val condition.'+val);
//        console.log('\n<<this.xw::'+this.xw.toString());
        val += '';  // convert to string, since XMLWriter is picky
        this.xw.startElement('property');
        this.xw.writeAttribute('name', name);
        this.xw.writeAttribute('value', val);
        this.xw.endElement();
//        console.log('\n<<this.xw::'+this.xw.toString());
    }
}


ReportManager.prototype.addTest = function(time, className, name, failureMessage) {
//    console.log('<<In addTest..'+time+','+className+','+name+','+failureMessage);
    this.xw.startElement('testcase');
    this.xw.writeAttribute('time', (time / 1000).toFixed(2));
    this.xw.writeAttribute('classname', className);
    this.xw.writeAttribute('name', name);

    if (failureMessage) {
        if (failureMessage === "skip") {
            this.xw.writeAttribute('executed', 'false');
        } else {
            this.xw.startElement('failure');
            this.xw.text("<![CDATA[" + failureMessage + "]]>");
            this.xw.endElement();
        }
    }

    this.xw.endElement();
}

ReportManager.prototype.parseYUIResults = function(testJson, dtName,self) {
//    console.log('\n\n<<In parseYUIResults..testJson:'+JSON.stringify(testJson));
//    console.log('\n<<In parseYUIResults..dtName:'+JSON.stringify(dtName));

    var l, m, errorRep;

    var yuiUserAgent = testJson.ua;
    var yuiSuiteName = testJson.name;
    var browser = UserAgent.parse(yuiUserAgent).toAgent();
    if (browser === "Other 0.0.0") {
        browser = "NodeJS";
    }

    var descTestName = dtName;
    var sessionId = testJson.sessionId;
    var currentUrl = testJson.currentUrl;

//    console.log('\n\n<<<yuiUserAgent:'+yuiUserAgent+' ,yuiSuiteName:'+yuiSuiteName+",browser:"+browser+",descTestName:"+descTestName+',sessionId:'+sessionId+',currentUrl:'+currentUrl);
    // var passCount = 0,failCount = 0,skipCount = 0,timeCount = 0, totalCount = 0;

    for (l in testJson) {
//        console.log('<<In loop..parseyuiresults 1:::'+JSON.stringify(l));
        if (testJson[l]) {
//            console.log('<<In loop..parseyuiresults 2:'+testJson[l]);
//            console.log('<<In loop..parseyuiresults 2 type:'+testJson[l].type);
            if (testJson[l].type === "testcase") {
//                console.log('<<In loop..parseyuiresults 3');
                var yuiTestCaseName = testJson[l].name;
                var timePerTest = testJson[l].duration / testJson[l].total;
                self.passCount += testJson[l].passed;
                self.failCount += testJson[l].failed;
                self.skipCount += testJson[l].ignored;
                self.timeCount += testJson[l].duration;
                self.totalCount += testJson[l].total;

//                console.log('\nthis:::'+this);
                for (m in testJson[l]) {
                    if (testJson[l][m].type === "test") {
//                        console.log('<<In loop..parseyuiresults 4');
                        var className = browser + "." + descTestName;
                        var testName = yuiSuiteName + "::" + yuiTestCaseName + "::" + testJson[l][m].name;
                        if (testJson[l][m].result === "fail") {
//                            console.log('<<In loop..parseyuiresults 5');
                            self.addTest(timePerTest, className, testName, testJson[l][m].message + "." + "\n" + " URL :" + currentUrl);
                        } else if (testJson[l][m].result === "pass") {
//                            console.log('<<In loop..parseyuiresults 6...');
                            self.addTest(timePerTest, className, testName);
                        } else if (testJson[l][m].result === "ignore") {
//                            console.log('<<In loop..parseyuiresults 7');
                            self.addTest(timePerTest, className, testName, "skip");
                        }
                    }
                }
            }
        }
    }
}


ReportManager.prototype.showReportOnConsole = function (result, verbose) {

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

    //console.log('<<In writeReports..');
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
        xwRoot = new XMLWriter();

    function writeFile(fileName, data) {
//        console.log('<<In writeFile..');
        fs.writeFileSync(fileName, data, 'utf8');
        log(("Report Created: " + fileName).inverse.toString());
    }

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
    this.addProperty("reportFolder", this.reportObj.reportFolder);
    this.xw.endElement();
//    console.log('<<\nAdded properties..');

    for (i = 0; i < testSessions.length; i = i + 1) {
//        console.log('\n<<testsessions looppppp  -'+JSON.stringify(testSessions[i]));
//        console.log('\n<<testsessions looppppp 1..'+i+' , instanceofaaa -'+testSessions[i].driver);
//        console.log('<<\ntestsessions loopppp 1.1..'+JSON.stringify(testSessions[i].driver));

        rep = testSessions[i].driver.getReports();
//        console.log('\n\n<<testsessions loop 2..Reports:'+JSON.stringify(rep));
//        console.log('\n\nRep.scenario::'+rep.scenario);

        if (rep.scenario) {
            arrReport = rep.scenario;
        } else {
            arrReport = rep.results;
        }
//        console.log('<<\ntestsessions loop 5..'+i);
        resultPresent = false;
//        console.log('<<\ntestsessions loop 8..'+i);
//        console.log('<<\nthis..'+this instanceof ReportManager);

        for (j = 0; j < arrReport.length; j = j + 1) {
            if (rep.scenario) {
                results = arrReport[j].results;
                for (k = 0; k < results.length; k = k + 1) {

                    testJson =  results[k];
//                    console.log('\n<<testsessions loop 9..'+JSON.stringify(testJson));
                    if (testJson.type === "report") {
                        resultPresent = true;
                        this.parseYUIResults(testJson, testSessions[i].driver.testName,this);
                    }
                }
            } else {
                testJson = arrReport[j];
                if (testJson.type === "report") {
//                    console.log('\n\n<<testsessions loop 10..'+JSON.stringify(testJson))
                    resultPresent = true;
                    this.parseYUIResults(testJson, testSessions[i].driver.testName,this);
                }
            }
        }
//        console.log('<<\ntestsessions loop 12..'+i);
        if (!resultPresent) {
            missingErrorCount = missingErrorCount + 1;
            errorRep = arrReport[arrReport.length - 1];

            if (errorRep.results) {
                //console.log("Error :" + errorRep.results[0].error);
                this.addTest(0, "Error." +  testSessions[i].driver.testName, "Error", errorRep.results[0].error);

            } else if (errorRep.error) {
                // console.log("Error : " +errorRep.error)
                this.addTest(0, "Error." +  testSessions[i].driver.testName, "Error", errorRep.error);
            } else {
                console.log("Error : UNKOWN");
            }
        }
//        console.log('<<\ntestsessions loop 15..'+i);
    }
//    console.log('<<Here in reportmanager 1..');

    this.totalCount = this.totalCount + missingErrorCount;
    this.failCount = this.failCount + missingErrorCount;

//    console.log('<<Here in reportmanager 2..');
    log();
    log("Test Report Summary".bold.magenta.toString());
    log();
    log(("Total Number of Executed Tests: " + this.totalCount).blue.toString());
    log(("Total Number of Passed Tests: " + this.passCount).green.toString());
    log(("Total Number of Failed Tests: " + this.failCount).red.toString());
    log(("Total Number of Skipped Tests: " + this.skipCount).cyan.toString());
    log();
    log(("Total Test Execution Time Inside Browser: " + (this.timeCount / 1000).toFixed(2) + " seconds").green.bold.toString());
    this.totalTimeTaken = Date.now() - global.startTime;
    log(("Total Test Execution Time:" + (this.totalTimeTaken / 1000).toFixed(2) + " seconds").green.bold.toString());
    log();
//    console.log('<<Here in reportmanager 3..');
    this.errorCount = this.totalCount - this.passCount - this.failCount - this.skipCount;

    testSuiteName = "";
//    console.log('<<Here in reportmanager 4..');
    if (this.reportObj.testSuiteName) {
        testSuiteName = this.reportObj.testSuiteName;
    } else {
        testSuiteName = "TestSuite";
    }
    //console.log(totalCount + ":" + failCount + ":" + missingErrorCount + ":" + skipCount);
    //collecting all report
    strReport = xw.toString();

    //starting report root
    xwRoot.startDocument();
    xwRoot.startElement("testsuite");
    xwRoot.writeAttribute('failures', this.failCount.toString());
    xwRoot.writeAttribute('time', (this.totalTimeTaken / 1000).toFixed(2).toString());
    xwRoot.writeAttribute('errors', this.errorCount.toString());
    xwRoot.writeAttribute('skipped', this.skipCount.toString());
    xwRoot.writeAttribute('tests', this.totalCount.toString());
    xwRoot.writeAttribute('name', testSuiteName.toString());
    xwRoot.text("$$report$$");
    xwRoot.endElement();
    xwRoot.endDocument();
//    console.log('<<Here in reportmanager 5..');
    strJunitReport = xwRoot.toString().replace("$$report$$", strReport);

    if (this.reportObj.descriptor) {

        xmlReportName = this.reportObj.descriptor.split(".")[0] + "-report.xml";
        jsonReportName = this.reportObj.descriptor.split(".")[0] + "-report.json";
    } else {
        xmlReportName = "report.xml";
        jsonReportName = "report.json";
    }
//    console.log('<<Here in reportmanager 6..');
    if (self.reportFolder) {
        xmlReportName = self.reportFolder  + xmlReportName;
        jsonReportName = self.reportFolder  + jsonReportName;
    }
    writeFile(xmlReportName, strJunitReport);
//    console.log('<<Here in reportmanager 7..');
    //writing json file
    for (i = 0; i < testSessions.length; i = i + 1) {
        jsonReport[testSessions[i].driver.testName] = JSON.parse(JSON.stringify(testSessions[i].driver.getReports()));
    }
    jsonReport.testSuiteName =  testSuiteName;
    writeFile(jsonReportName, JSON.stringify(jsonReport));

    return path.resolve(xmlReportName);
};

module.exports = ReportManager;
