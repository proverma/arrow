/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 *
 * Library which supports opening , closing  and listing open sessions
 */

var fs = require("fs");
var util = require("util");
var log4js = require("log4js");
var WdSession = require("../lib/session/wdsession");
var wd = require("../lib/util/wd-wrapper");
var CapabilityManager = require("../lib/util/capabilitymanager");
var logger = log4js.getLogger("selLib");

/**
 *
 * @param config
 * @constructor
 */
function SelLib(config) {
    this.config = config;
    this.hub = new WdSession(config);
}

/**
 *  Build webdriver object based on properties set in webdriverConfObj
 * @param webdriverConfObj
 * @returns webdriver object
 */
SelLib.prototype.buildWebDriver = function(webdriverConfObj) {

    var webdriver;

    if (webdriverConfObj) {

        webdriver = new wd.Builder().
            usingServer(webdriverConfObj.seleniumHost).
            usingSession(webdriverConfObj.sessionId).
            withCapabilities(webdriverConfObj.capabilities).
            build();
    }

    return webdriver;
};

/**
 * Lists the open sessions
 * @param arrSessions
 * @param cb
 */
SelLib.prototype.listSessions = function (arrSessions, cb) {

    if (!arrSessions) {
        logger.info('No sessions found');
        cb();
    }

    if (arrSessions.length > 0) {

        var sessionId = arrSessions[0],
            self = this,
            webdriver,
            webdriverConfObj = {};

        arrSessions.shift();

        // Build webdriver object
        webdriverConfObj.seleniumHost = self.config.seleniumHost;
        webdriverConfObj.sessionId = sessionId;
        webdriver = self.buildWebDriver(webdriverConfObj);

        webdriver.getCapabilities().then(function(sessionCaps) {

            if (sessionCaps) {
                console.log('\n');
                console.log(sessionCaps.toJSON());
            }
            self.listSessions(arrSessions, cb);

        }, function(err) {
            logger.error('Error while listing sessions:' + err);
            self.listSessions(arrSessions, cb);
        });

    } else {
        cb();
    }

};

/**
 * Help !!
 */
SelLib.prototype.listHelp = function () {
    console.info("\nCommandline Options :" + "\n" +
        "--list : Lists all selenium browser sessions" + "\n" +
        "--open=<browser1[, browser2]> : Comma seperated list of browsers to launch" + "\n" +
        "--open=<browser> : browser to choose from capabilities.json" + " --capabilities= path to capabilities.json" + "\n" +
        "--close : Close all selenium controller browser sessions" + "\n\n" +
        "Examples:\n" +
        "Open Firefox and Chrome browser instances:\n" +
        "arrow_selenium --open=firefox,chrome\n"  +
        "Open Firefox with given capabilities:\n" +
        "arrow_selenium --open=firefox --capabilities=./cap.json\n"
        );
};

/**
 *
 * @param capabilities
 * @param browserName
 * @returns capability object based on pass capabilities and browser
 */
SelLib.prototype.getCapabilityObject = function(capabilities, browserName) {

    var caps,
        cm;

    // If user has passed capabilities
    if (capabilities) {
        caps = {
            "platform": "ANY",
            "javascriptEnabled": true,
            "seleniumProtocol": "WebDriver"
        };
        caps.browserName = browserName;

        if (!caps.browserName) {
            logger.error("No Browser is specified");
            process.exit(1);
        }

        cm = new CapabilityManager();
        capabilities = cm.getCapability(capabilities, caps.browserName);

        if (capabilities === null) {
            logger.error("No related capability for " + caps.browserName + " in " + capabilities);
            process.exit(1);
        }
    } else {
        // default capabilities
        capabilities = {
            "browserName": browserName,
            "version": "",
            "platform": "ANY",
            "javascriptEnabled": true
        };
    }
    return capabilities;

};

/**
 *
 * @param browserList - Browsers to open
 * @param openBrowserList - Already open browsers
 * @param capabilities - capabilities object
 * @param cb
 */
SelLib.prototype.openBrowsers = function(browserList, openBrowserList, capabilities, cb) {

    var webdriver,
        browserToOpen,
        self = this,
        webdriverConfObj = {},
        caps;

    if (browserList && browserList.length > 0) {

        browserToOpen = browserList[0];

        browserList.shift();

        if (openBrowserList.indexOf(browserToOpen) !== -1) {
            logger.info('Browser ' + browserToOpen + ' is already open');
            self.openBrowsers(browserList, openBrowserList, capabilities, cb);
        } else {
            logger.info('Opening browser..' + browserToOpen);
//            logger.info('capabilities..' + JSON.stringify(capabilities));

            caps = self.getCapabilityObject(capabilities, browserToOpen);
            logger.info('Capabilities::' + JSON.stringify(caps));

            // Build webdriver object
            webdriverConfObj.seleniumHost = self.config.seleniumHost;
            webdriverConfObj.capabilities = caps;
            webdriver = self.buildWebDriver(webdriverConfObj);

            webdriver.getCapabilities().then(function(sessionCaps) {
                console.log(sessionCaps);

                openBrowserList.push(browserToOpen);
                logger.info('Session created for the browser ' + browserToOpen);
                // Open another browser, if asked for
                self.openBrowsers(browserList, openBrowserList, capabilities, cb);

            }, function(err) {
                logger.error('Error encountered while opening browser ' + browserToOpen +  ' - Error :'  + err);
                // Open another browser, if asked for
                self.openBrowsers(browserList, openBrowserList, capabilities, cb);
            });

        }

    } else {
        cb();
    }

};

/**
 * Get browser name for the webdriver object
 * @param webdriver
 * @param cb
 */
SelLib.prototype.getBrowserName = function(webdriver, cb) {

    if (webdriver) {

        webdriver.getCapabilities().then(function(val) {

            if (val) {
                var browserName = val.get("browserName");
                cb(browserName);
            }

        }, function(err) {
            logger.error('Error in getBrowserName getting browser name :' + err);
            cb();
        });
    } else {
        cb();
    }

};

/**
 *
 * @param arrSessions - Already open sessions
 * @param openBrowserList - List of open browsers
 * @param cb
 */
SelLib.prototype.getListOfOpenBrowsers = function(arrSessions, openBrowserList, cb) {

    var
        webdriver,
        self = this,
        sessionId,
        webdriverConfObj = {};

    if (arrSessions.length === 0) {
        cb(openBrowserList);
    } else {

        sessionId = arrSessions[0];
        arrSessions.shift();

        // Build webdriver object
        webdriverConfObj.seleniumHost = self.config.seleniumHost;
        webdriverConfObj.sessionId = sessionId;
        webdriver = self.buildWebDriver(webdriverConfObj);

        self.getBrowserName(webdriver, function(browserName) {
            if (browserName) {
                openBrowserList.push(browserName);
            }
            self.getListOfOpenBrowsers(arrSessions, openBrowserList, cb);
        });
    }
};

/**
 *
 * @param arrSessions
 * @param cb
 */
SelLib.prototype.closeBrowsers = function (arrSessions, cb) {

    var
        sessionId,
        self = this,
        webdriver,
        webdriverConfObj = {};

    if (arrSessions) {

        if (arrSessions.length === 0) {
            cb();
        } else {

            sessionId = arrSessions[0];
            arrSessions.shift();

            // Build webdriver object
            webdriverConfObj.seleniumHost = self.config.seleniumHost;
            webdriverConfObj.sessionId = sessionId;
            webdriver = self.buildWebDriver(webdriverConfObj);

            logger.info("Killing Session ID :" + sessionId);

            webdriver.quit().then(function() {
                self.closeBrowsers(arrSessions, cb);
            }, function(err) {
                logger.info("Error in Killing Session ID :" + sessionId + " , error :" + err);
                self.closeBrowsers(arrSessions, cb);
            });

        }

    }

};

/**
 *
 * @param browsers - comma separated list of arguments to --open e.g firefox,chrome
 * @param capabilities - passed by the user
 */
SelLib.prototype.open = function (browsers, capabilities, cb) {

    var self = this;

    self.hub.getSessions(function (error, arrSessions) {

        if (error) {
            logger.info('Error:' + error);
            if (cb) {
                cb(error);
            }
        } else {
            var browserList = browsers.split(","),
                openBrowserList = [];

            if (arrSessions) {
                logger.info("Found " + arrSessions.length + " browsers.");
            }
            self.getListOfOpenBrowsers(arrSessions, openBrowserList, function(openBrowserList) {

                self.openBrowsers(browserList, openBrowserList, capabilities, function() {
                    logger.info('Done opening all browsers...' + browsers.split(","));

                    if (cb) {
                        cb();
                    }
                });

            });

        }

    }, true);

};

/**
 * Close all open browsers
 */
SelLib.prototype.close = function (cb) {
    var self = this;
    self.hub.getSessions(function (error, arrSessions) {

        if (error) {
            logger.info(error);
        } else if (arrSessions && arrSessions.length > 0) {

            logger.info("Found " + arrSessions.length + " browsers.");
            self.closeBrowsers(arrSessions, function() {
                logger.info('Closed all open browsers on host ' + self.config.seleniumHost);
                if (cb) {
                    cb();
                }
            });
        }
    });

};

/**
 * List all open sessions
 */
SelLib.prototype.list = function () {

    var self = this;
    self.hub.getSessions(function (error, arrSessions) {
        if (error) {
            logger.info(error);
        } else {
            self.listSessions(arrSessions, function() {
                logger.info('Listed all sessions');
            });
        }
    }, false);

};

module.exports = SelLib;