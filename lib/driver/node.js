/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var util = require("util");
var childProcess = require("child_process");
var log4js = require("log4js");
var Driver = require("../interface/driver");

/**
 * Driver wrapping nodejs that can only run javascript unit tests
 *
 * @param config options at the global level
 * @param args parameters passed to the test session
 */
function NodeDriver(config, args) {
    Driver.call(this, config, args);

    this.logger = log4js.getLogger("NodeDriver");
}

util.inherits(NodeDriver, Driver);

/**
 * Creates json object containing test spec for nodejs
 * @private
 *
 * @param testParams parameters for this test
 * @params callback function to call if failed to validate the paramters
 *
 * @return json test spec or false on error
 */
NodeDriver.prototype.createNodeArgs = function (testParams, callback) {
    var self = this,
        logger = this.logger,
        testJs,
        libs,
        seed,
        runner,
        nodeArgs;

    testJs = testParams.test;
    if (!testJs) {
        self.errorCallback(logger, "The test js must be specified", callback);
        return false;
    }

    if (!testParams.lib && self.args.params && self.args.params.lib) { testParams.lib = self.args.params.lib; }

    seed = self.config["testSeed"];
    runner = self.config["testRunner"];
    libs = testParams.lib;

    nodeArgs = {
        "seed": seed,
        "runner": runner,
        "test" : testJs,
        "libs": libs
    };

    return nodeArgs;
};

/**
 * Driver interface method, called by controllers to execute a test
 *
 * @param testConfig values from the config section in the descriptor ycb
 * @param testParams parameters for this test
 * @params callback function to call at the end of the test with errorMsg
 */
NodeDriver.prototype.executeTest = function (testConfig, testParams, callback) {
    var self = this,
        logger = this.logger,
        caps = {"browserName": "nodejs"},
        nodeArgs,
        nodeArgsStr,
        testParamsStr,
        report,
        processName,
        child,
        logMsg,
        testResultPrefix = "TEST RESULT: ",
        trIndex,
        i;

    nodeArgs = this.createNodeArgs(testParams, callback);
    if (false === nodeArgs) {
        return;
    }

    nodeArgsStr = JSON.stringify(nodeArgs);
    testParamsStr = JSON.stringify(testParams);
    self.logger.debug("node args: " + nodeArgsStr);
    self.logger.debug("node test config: " + testParamsStr);

    report = "";
    processName = "node";
    child = childProcess.spawn(processName, [global.appRoot + "/nodejs/node.js", encodeURI(nodeArgsStr), encodeURI(testParamsStr)]);
    child.stdout.on("data", function (data) {
        logMsg = data.toString(null, 0, data.length - 1);
        // TODO: Report is fetched using stdout and looking for a prefix
        // Find a better way to communicate the report back
        trIndex = logMsg.indexOf(testResultPrefix);
        if (-1 === trIndex) {
            self.logger.info(logMsg);
        } else {
            report = logMsg.substr(trIndex + testResultPrefix.length);
            self.addReport(report, caps);
        }
    });
    child.stderr.on("data", function (data) {
        console.log(data.toString(null, 0, data.length - 1));
    });
    child.on("exit", function () {
        if (0 === report.length) {
            self.errorCallback(logger, "Failed to get the test report", callback);
        } else {
            callback(null, report);
        }
    });
};

module.exports = NodeDriver;

