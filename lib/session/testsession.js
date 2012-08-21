/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var http = require("http");
var log4js = require("log4js");
var Arrow = require("../interface/arrow");

function TestSession(config, args, sessionId) {
    this.logger = log4js.getLogger("TestSession");
    this.args = args;
    this.config = config;
    this.sessionId = sessionId;
    this.driverName = args.driver;
    this.controller = args.controller;
    this.testConfig = args.config;
    if (args.params) {
        this.testParams = args.params;
    } else {
        this.testParams = {};
    }
}

TestSession.prototype.setup = function (callback) {
    var DriverClass = null;

    if (!this.driverName) {
        if (this.controller || this.testParams.page || this.args.browser || this.sessionId) {
            this.driverName = "selenium";
        } else {
            this.driverName = "nodejs";
        }
    }

    // if descriptor has defined driver, that overrides everything else.
    if (this.testParams.driver) {
        this.driverName = this.testParams.driver;
    }



    this.logger.debug("driver: " + this.driver + ", browser: " + this.args.browser);

    if ("selenium" === this.driverName) {
        this.logger.info("Using selenium driver");
        DriverClass = require("../driver/selenium");
    } else if ("nodejs" === this.driverName) {
        this.logger.info("Using node driver");
        DriverClass = require("../driver/node");
    } else {
        this.logger.fatal("ERROR :" + this.driverName + " is not a supported test driver, Please provide \"selenium\" or \"nodejs\" as driver.");
        callback("ERROR :" + this.driverName + " is not a supported test driver, Please provide \"selenium\" or \"nodejs\" as driver.");
        return;
    }

    this.driver = new DriverClass(this.config, this.args);
    this.driver.setSessionId(this.sessionId);

    //setting default page
    if (!this.testParams.page) {
        this.testParams.page = this.config["defaultTestHost"];
    }
    callback(null);
};

TestSession.prototype.runTest = function (callback) {
    var self = this,
        arrow = Arrow.getInstance();

    if (this.args.testName) {
        self.logger.info("Running test: " + this.args.testName);
    }

    self.setup(function (error) {
        if (error) {
            callback(error);
            //return;
        } else {
            self.driver.start(function (error) {
                if (error) {
                    callback(error);
                    //return;
                } else {
                    arrow.runController(self.controller, self.testConfig, self.testParams, self.driver, function () {
                        self.driver.stop();
                        callback();
                    });
                }
            });
        }
        return;
    });

};

module.exports = TestSession;

