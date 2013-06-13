/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var log4js = require("log4js");
var fs = require("fs");
var path = require("path");

/**
 * web driver manager
 *
 * @param seleniumHost the selenium server url
 *
 */
function WebDriverManager(seleniumHost) {
    this.logger = log4js.getLogger("WebDriverManager");
    this.seleniumHost = seleniumHost || "http://localhost:4444/wd/hub";
}

WebDriverManager.wdAppPath = "../../ext-lib/webdriver";

/**
 * createWebDriver
 * Create webdriver instance
 *
 * @param capability webdriver capabilities
 * @param sessionId session Id to create webdriver
 *
 * @return webdriver object
 */
WebDriverManager.prototype.createWebDriver= function (capability, sessionId) {
    var self = this;
    delete require.cache[require.resolve(WebDriverManager.wdAppPath)];
    delete require.cache[require.resolve('../../ext-lib/webdriver/promise.js')];
    delete require.cache[require.resolve('../../ext-lib/webdriver/_base.js')];

    var wd = require(WebDriverManager.wdAppPath);
    var wdHubHost = self.seleniumHost;
    var driver = new wd.Builder().
        usingServer(wdHubHost).
        usingSession(sessionId).
        withCapabilities(capability).build();

    driver.By = wd.By;

    // Dummy object to ignore uncaught exception at custom controller level
    driver.listener = function () {
    };

    driver.listener.on = function () {
        self.logger.warn("Please stop using uncaught-exception event handler at custom controller, Arrow automatically handles all uncaught-exceptions.");
    };

    // private listener for uncaught exception
    wd.promise.Application.getInstance().on('uncaughtException', function (e) {
        self.logger.error('Unhandled error: ' + e);
    });

    console.log("webdriver created");
    return driver;
};

module.exports = WebDriverManager;

