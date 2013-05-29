/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var http = require("http");
var log4js = require("log4js");
var Arrow = require("../interface/arrow");
var fs = require('fs');
var path = require('path');
var FileUtil = require("../util/fileutil");

function TestSession(config, args, sessionId) {
    this.logger = log4js.getLogger("TestSession");
    this.args = args;
    this.config = config;
    this.sessionId = sessionId;
    this.driverName = args.driver;
    this.controller = args.controller;
    this.testConfig = args.config || {};
    this.retryCount = 0;
    if (args.params) {
        this.testParams = args.params;
    } else {
        this.testParams = {};
    }

    if (args.relativePath) {
        this.testConfig.relativePath = args.relativePath;
    }

    if (args.descriptorPath) {
        this.descriptorPath = args.descriptorPath;
    }

    this.startTime = 0;
    this.endTime = 0;
    if (args.resolvedRouterConfigPath) {
        this.resolvedRouterConfigPath = args.resolvedRouterConfigPath;
        this.config.proxyUrl = global.routerMap[this.resolvedRouterConfigPath];
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
    if (this.resolvedRouterConfigPath) {
        this.config.proxyUrl = global.routerMap[this.resolvedRouterConfigPath];
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
    this.startTime = Date.now();
    var self = this,
        arrow = Arrow.getInstance();

    if (this.args.testName) {
        self.logger.info("Running test: " + this.args.testName);
    }

    self.setup(function (error) {
        if (error) {
            self.logger.debug("Error while setting up selenium :" + error);
            self.retryTest(callback, error);
            //return;
        } else {
            self.driver.start(function (error) {
                if (error) {
                    self.logger.debug("Error while starting test :" + error);
                    self.retryTest(callback, error);
                    //return;
                } else {
                    arrow.runController(self.controller, self.testConfig, self.testParams, self.driver, function (error, data, controller) {
                        if (error) {
                            self.logger.debug("Error while running controller :" + error);
                        }
                        self.driver.callback = callback;
                        self.retryTest(callback, error);
                    });
                }
            });
        }
        return;
    });

};

TestSession.prototype.retryTest = function (callback, error) {

    var self = this;
    self.retryCount += 1;

    // checking if there is a yui test failues : self.isFail()
    // or if there is a failure at controller level : error
    if (self.isFail() || error) {
        // if retryCount is provided, and retries are left for this test, lets record the failure and retry the test
        if (global.retryCount - self.retryCount >= 0) {
            self.logger.info("Retrying Test, Attempt #" + self.retryCount);
            self.recordFailure(self.retryCount, function() {
                self.driver.stop(function() {
                    self.runTest(callback);
                });
            });
        } else {
            self.recordFailure(self.retryCount, function() {
                self.driver.stop(callback, error);
            });
        }
    } else {
        self.driver.stop(callback);
    }
};

TestSession.prototype.isFail = function () {
    var arrReport,
        rep,
        j,
        k,
        isFail = false,
        self = this,
        results,
        testJson;

    //checking if there was any failure
    rep = self.driver.getReports();
    if (rep.scenario) {
        arrReport = rep.scenario;
    } else {
        arrReport = rep.results;
    }

    if (arrReport) {
        if (arrReport.length === 0) {
            isFail = true;
        } else {
            for (j = 0; j < arrReport.length; j = j + 1) {
                if (rep.scenario) {
                    results = arrReport[j].results;
                    for (k = 0; k < results.length; k = k + 1) {
                        testJson =  results[k];
                        if (testJson.type === "report" && testJson.failed > 0) {
                            isFail = true;
                        }
                    }
                } else {
                    testJson = arrReport[j];
                    if (testJson.type === "report" && testJson.failed > 0) {
                        isFail = true;
                    }
                }
            }
        }
    }
    return isFail;
};

TestSession.prototype.recordFailure = function (count, callback) {

    var webdriver = this.driver.webdriver,
        testName,
        self = this,
        fileUtil = new FileUtil();

    try {
        fileUtil.createDirectory(path.resolve(global.reportFolder, "screenshots"));

        if (this.args.testName) {
            testName = path.resolve(global.reportFolder, "screenshots", "arrow-" + this.args.testName);
        } else {
            testName = path.resolve(global.reportFolder, "screenshots", "arrow");
        }

        if (webdriver) {
            //recording screenshot
            webdriver.takeScreenshot().then(function(img) {

                fs.writeFileSync(testName + "-" + count + ".png", new Buffer(img, 'base64'));
                //recording html source
                webdriver.getPageSource().then(function(src) {
                    fs.writeFileSync(testName + "-" + count + ".html", src);
                    callback();
                });
            });
        } else {
            callback();
        }
    } catch (e) {
        self.logger.error(e.toString());
        callback();
    }
};

module.exports = TestSession;

