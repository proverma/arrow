/*jslint forin:true sub:true anon:true sloppy:true stupid:true nomen:true node:true continue:true*/
/*jslint undef: true*/
/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require('fs');
var path = require('path');
var log4js = require("log4js");
var logger = log4js.getLogger("runNodejsTest");
var coverage = require('../lib/util/coverage');

ARROW = {};
var testReport = null;
var args = process.argv;
console.log(args);
var testSpecStr = decodeURI(args[2]);
console.log(testSpecStr);
var testSpec = JSON.parse(testSpecStr);
if (!testSpec) {
    logger.error("Invalid node test args: " + testSpecStr);
    process.exit();
}

var engineConfig = testSpec.engineConfig;
var seed = testSpec.seed;
var shareLibServerSeed = testSpec.shareLibServerSeed;
var runner = testSpec.runner;
var libs = testSpec.libs;
var testFile = testSpec.test;
var coverageFlag = testSpec.coverage;
var testParams = decodeURI(args[3]);
var waitForExitTimeout = 1000;
var receivedShareData = undefined;
var waitForShareDataTimeout = 1000;
var waitForShareDataInterval = 100;

process.on('message', function(m) {
    if (m.shared) {
        logger.debug("Received shared data.");
        // logger.trace(JSON.stringify(m.shared));
        receivedShareData = m.shared;
    } else if (m.exit) {
        process.exit(0);
    }
});
var depFiles = libs.split(",");
var testTimeOut = testSpec.testTimeOut;
testTimeOut = typeof testTimeOut === "string" ? parseInt(testTimeOut) : testTimeOut;
coverage.configure(testSpec);

// Set logLevel passed from parent process
setLogLevel(testSpec.logLevel);

function getReportStatus() {
    logger.info("Waiting for the test report");
    if ((null === ARROW.testReport) || ARROW.testReport == undefined || (0 === ARROW.testReport.length)) {
        return false;
    }
    return true;
}

function onReportReady(result) {
    if ((null === ARROW.testReport) || (0 === ARROW.testReport.length)) {
        logger.error("Test failed to execute/timedout");
        process.exit(1);
    } else {
        try {
            process.send({
                results: ARROW.testReport,
                testParams: ARROW.testParams,
                coverage: coverage.getFinalCoverage()
            });
            setTimeout(function() {process.exit(0);}, waitForExitTimeout);
        } catch (e) {
            logger.error('Failed to send test report: ' + e.message);
            process.exit(1);
        }
    }
}

// Wait until the test condition is true or a timeout occurs.
function waitFor(testFx, onReady, timeOutMillis, newInterval) {
    var timeoutInterval = newInterval || 500,
        maxtimeOutMillis = timeOutMillis || testTimeOut || 25000,
        start = (new Date()).getTime(),
        interval;

    if (testFx()) {
        onReady(true);
    } else {
        interval = setInterval(function () {
            if (testFx()) {
                clearInterval(interval);
                onReady(true);
            } else if (((new Date()).getTime() - start) > maxtimeOutMillis) {
                onReady(false); // timedout
            }
        }, timeoutInterval);
    }
}

function runTest() {
    ARROW.testParams = JSON.parse(testParams);
    ARROW.testParams.shared = receivedShareData;
    ARROW.testLibs = [];
    ARROW.testScript = "";
    ARROW.scriptType = "test";
    ARROW.shareLibServerSeed = shareLibServerSeed;
    ARROW.testfile = testFile;
    ARROW.engineConfig = engineConfig;
    // we must add candidate before require seed/runner for sometimes if you require seed ,the test will be required too:
    // like in mocha seed,the mocha.loadFiles() will require these file then it would be late to add candidate
    for (i in depFiles) {
        depFile = depFiles[i];
        if (0 === depFile.length) {
            continue;
        }
        coverage.addInstrumentCandidate(depFile);
    }
    ARROW.onSeeded = function () {
        var depFile,
            i;
        for (i in depFiles) {
            depFile = depFiles[i];
            if (0 === depFile.length) {
                continue;
            }
            logger.info("Loading dependency: " + depFile);
            depFile = path.resolve("", depFile);
            ARROW.testLibs.push(depFile);
            require(depFile);
        }
        logger.info("Executing test: " + testFile);
        //TODO - Why global.workingDirectory is not working here ( instead of process.cwd())
        require(path.resolve(process.cwd(), testFile));
        require(runner);
        waitFor(getReportStatus, onReportReady);
    };

    require(seed);

}

/**
 * set logLevel passed from parent process
 * @param logLevel
 */
function setLogLevel(logLevel){
    log4js.setGlobalLogLevel(logLevel);
    log4js.restoreConsole();
}

if (coverageFlag) {
    coverage.hookRequire();
}

//runTest();
waitFor(function(){
    return receivedShareData !== undefined;
}, runTest, waitForShareDataTimeout, waitForShareDataInterval);

