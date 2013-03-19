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
var coverage = require("../util/coverage");
var libscanner = require("../util/sharelibscanner");

/**
 * Driver wrapping nodejs that can only run javascript unit tests
 *
 * @param config options at the global level
 * @param args parameters passed to the test session
 */
function NodeDriver(config, args) {
    Driver.call(this, config, args);
    coverage.configure(config);

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
        shareLibServerSeed,
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

    // in server side(run with nodejs),we can always enable yui loader to load server seed.
    // Unlike client side, we don't need to inject src code.
    shareLibServerSeed=libscanner.scannerUtil.getShareLibServerSideModulesMeta();

    nodeArgs = {
        "seed": seed,
        "shareLibServerSeed": shareLibServerSeed,
        "runner": runner,
        "test" : testJs,
        "libs": libs,
        "coverage": self.config.coverage,
        "coverageExclude": self.config.coverageExclude
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
        child;

    nodeArgs = this.createNodeArgs(testParams, callback);
    if (false === nodeArgs) {
        return;
    }

    nodeArgsStr = JSON.stringify(nodeArgs);
    testParamsStr = JSON.stringify(testParams);
    self.logger.debug("node args: " + nodeArgsStr);
    self.logger.debug("node test config: " + testParamsStr);

    report = "";
    child = childProcess.fork(global.appRoot + "/nodejs/node.js", [encodeURI(nodeArgsStr), encodeURI(testParamsStr)], {});
    child.on('message', function (m) {
        if (m.results) {
            report = m.results;
            self.addReport(report, caps);
        }

        if (m.coverage) {
            coverage.addCoverage(m.coverage);
        }

        callback(null, report);
    });
    child.on("exit", function () {
        if (0 === report.length) {
            self.errorCallback(logger, "Failed to get the test report", callback);
        }
    });
};

module.exports = NodeDriver;

