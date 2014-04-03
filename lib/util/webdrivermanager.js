/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var log4js = require("log4js");


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



/**
 * createWebDriver
 * Create webdriver instance
 *
 * @param capability webdriver capabilities
 * @param sessionId session Id to create webdriver
 *
 * @return webdriver object
 */
WebDriverManager.prototype.createWebDriver = function (capability, sessionId) {
    var self = this;
    var wd = require("./wd-wrapper.js");
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
    wd.promise.controlFlow().on('uncaughtException', function(e) {
        self.logger.error('Unhandled error: ' + e);
        if (self.callback) {
            self.callback(e.toString());
        } else {
            self.logger.fatal("Selenium Error caught with no callback.");
        }
    });

    return driver;
};

module.exports = WebDriverManager;

