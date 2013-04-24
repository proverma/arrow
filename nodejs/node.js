/*jslint forin:true sub:true anon:true sloppy:true stupid:true nomen:true node:true continue:true*/
/*jslint undef: true*/
/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require('fs');
var path = require('path');
var log4js = require("log4js").getLogger("runNodejsTest");
var coverage = require('../lib/util/coverage');

ARROW = {};
var testReport = null;
var args = process.argv;
//console.log(args);
var testSpecStr = decodeURI(args[2]);
//console.log(testSpecStr);
var testSpec = JSON.parse(testSpecStr);
if (!testSpec) {
    console.log("Invalid node test args: " + testSpecStr);
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
var depFiles = libs.split(",");
var testTimeOut = testSpec.testTimeOut;
testTimeOut = typeof testTimeOut === "string" ? parseInt(testTimeOut) : testTimeOut;
coverage.configure(testSpec);

function getReportStatus() {
    console.log("Waiting for the test report");
    if ((null === ARROW.testReport) || ARROW.testReport == undefined || (0 === ARROW.testReport.length)) {
        return false;
    }
    return true;
}

function onReportReady(result) {
    if ((null === ARROW.testReport) || (0 === ARROW.testReport.length)) {
        console.log("Test failed to execute/timedout");
        process.exit(1);
    } else {
        try {
            process.send({
                results: ARROW.testReport,
                coverage: coverage.getFinalCoverage()
            });
            process.exit(0);
        } catch (e) {
            console.log('Failed to send test report: ' + e.message);
            process.exit(1);
        }
    }
}

// Wait until the test condition is true or a timeout occurs.
function waitFor(testFx, onReady, timeOutMillis) {
    var timeoutInterval = 500,
        maxtimeOutMillis = testTimeOut || 25000,
        start = (new Date()).getTime(),
        interval;

    interval = setInterval(function () {
        if (testFx()) {
            clearInterval(interval);
            onReady(true);
        } else if (((new Date()).getTime() - start) > maxtimeOutMillis) {
            onReady(false); // timedout
        }
    }, timeoutInterval);
}

function runTest() {
    ARROW.testParams = JSON.parse(testParams);
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
            console.log("Loading dependency: " + depFile);
            depFile = path.resolve("", depFile);
            ARROW.testLibs.push(depFile);
            require(depFile);
        }
        console.log("Executing test: " + testFile);
        require(path.resolve("", testFile));
        require(runner);
        waitFor(getReportStatus, onReportReady);
    };

    require(seed);

}

if (coverageFlag) {
    coverage.hookRequire();
}

runTest();


