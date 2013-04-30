/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var fs = require("fs");
var log4js = require("log4js");
var DriverReportStack = require("../util/reportstack");
var ReportManager = require("../util/reportmanager");

// Drivers provide abstraction to control the browsers
function Driver(config, args) {
    this.logger = log4js.getLogger("Driver");
    this.config = config;
    this.sessionId = null;
    this.webdriver = null;
    this.testName = args.testName;
    this.args = args;
    this.reports = new DriverReportStack();
    this.arrowServerBase = "";
}

// Called before handing over the instance to the controller
Driver.prototype.start = function (callback) {
    callback(null);
};

// called after the controller is done executing all the tests
Driver.prototype.stop = function (callback) {
    if (callback) { callback(null); }
};

Driver.prototype.executeAction = function (testConfig, testArgs, callback) {
    this.errorCallback(this.logger, "executeAction is not supported", callback);
};

Driver.prototype.executeTest = function (testConfig, testArgs, callback) {
    this.errorCallback(this.logger, "executeTest must be implemented", callback);
};

Driver.prototype.getWebDriver = function (errorCallback) {
    if (null === this.webdriver) {
        this.logger.error("WebDriver is not supported");
    }
    this.testCallback = errorCallback;
    return this.webdriver;
};

Driver.prototype.setSessionId = function (id) {
    this.sessionId = id;
};

Driver.prototype.getArrowServerBase = function () {
    var statusFile,
        serverUrl;

    if (this.arrowServerBase.length > 0) { return this.arrowServerBase; }

    try {
        statusFile = global.appRoot + "/tmp/arrow_server.status";
        fs.statSync(statusFile).isFile();
        serverUrl = fs.readFileSync(statusFile);
        this.arrowServerBase = serverUrl + "/arrow/static";
        return this.arrowServerBase;
    } catch (ex) {
        this.logger.info("arrow_server is not running");
    }
    return false;
};

Driver.prototype.getRemoteUrl = function (file) {
    var base,
        path,
        url;

    file = file.trim();

    if ("http:" === file.substr(0, 5) || "https:" === file.substr(0, 6)) {
        url = file;
    } else {
        base = this.getArrowServerBase();
        if (false === base) { return false; }
        try {
            path = fs.realpathSync(file);
        } catch (e) {
            this.logger.error(e.toString());
        }
        url = base + path;
    }
    return url;
};

Driver.prototype.addReport = function (report, caps) {
    var reportJson, rm;
    this.logger.debug("Report :" + report);
    if (report) {
        reportJson = JSON.parse(report);
        if (!reportJson.ua) {
            reportJson.ua = caps["browserName"];
        }
        //reportJson.testName = this.testName;
        //reportJson.sessionId = this.sessionId;
        rm = new ReportManager();
        rm.showReportOnConsole(reportJson);
        this.reports.addReport(reportJson);

    } else {
        this.logger.error("Error : Unable to get report");
    }
};

Driver.prototype.getReports = function () {
    return this.reports.getReport();
};

// Convenient method to log and callback
Driver.prototype.errorCallback = function (logger, error, callback) {
    logger.error(error);
    callback(error, null);
};

module.exports = Driver;
