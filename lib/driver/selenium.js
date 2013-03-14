/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require("fs");
var util = require("util");
var path = require("path");
var log4js = require("log4js");
var Driver = require("../interface/driver");
var CapabilityManager = require("../util/capabilitymanager");
var coverage = require("../util/coverage");
var libscanner = require("../util/sharelibscanner");
var servermanager = require("../util/arrowservermanager");
var uglifyParser = require("uglify-js").parser;
var uglify = require("uglify-js").uglify;

/**
 * Driver wrapping web driver
 */
function SeleniumDriver(config, args) {
    Driver.call(this, config, args);
    coverage.configure(config);

    this.logger = log4js.getLogger("SeleniumDriver");
}

util.inherits(SeleniumDriver, Driver);

SeleniumDriver.maxAttempt = 60; // will amount to 30 secs
SeleniumDriver.attemptInterval = 500; // millisec
SeleniumDriver.wdAppPath = "../util/webdriver";

/**
 * Calculate capabilities for the test session
 *
 * @private

 * @return capablities required for the test session or false on error
 */
SeleniumDriver.prototype.getCapabilities = function () {

    var self = this,
        caps = {
            "platform":"ANY",
            "javascriptEnabled":true,
            "seleniumProtocol":"WebDriver"
        },
        tmpCaps,
        browserInfo,
        versionKey,
        cm;

    if (self.config.proxyUrl) {

        if (self.args.proxy || self.args.proxy === undefined) {
            self.logger.debug("Adding Proxy Setting to the Browser");
            caps.proxy = {"httpProxy":self.config.proxyUrl, "proxyType":"manual"};
        } else {
            self.logger.debug("Descriptor overridden proxy param. Not setting proxy in browser");
        }

    }

    caps.browserName = self.args["browser"] || self.config["browser"];
    if (!caps.browserName) {
        caps.error = "Browser is not specified";
        return caps;
    }

    // if the user has passed capabilities as json
    if (self.config.capabilities) {
        cm = new CapabilityManager(self.config.capabilities);
        tmpCaps = cm.getCapability(caps.browserName);
        if (tmpCaps === null) {
            caps.error = "No related capability for " + caps.browserName + " in " + self.config.capabilities;
            return caps;
        }
        caps = tmpCaps;
    } else {
        // this is the case where user just provides browser as "firefox-10.0"
        browserInfo = caps.browserName.split("-", 2);
        if (browserInfo.length > 1) {
            caps.browserName = browserInfo[0];
            caps.version = browserInfo[1];
        } else {
            versionKey = caps.browserName + "Version";
            if (self.config[versionKey]) {
                caps.version = self.config[versionKey];
            }
        }
    }

    return caps;
};

/**
 * Driver interface method
 * Start the driver before it can execute test. Perform task such as connecting to selenium.
 *
 * @param callback function to call when the driver is ready to be used, with errorMsg if failed
 */
SeleniumDriver.prototype.start = function (callback) {
    var self = this,
        capabilities,
        wdHubHost,
        errorMsg,
        wd;

    capabilities = this.getCapabilities();
    if (capabilities.error) {
        self.errorCallback(self.logger, capabilities.error, callback);
        return;
    }
    self.logger.trace("Capabilities :");
    self.logger.trace(capabilities);

    if ("phantomjs" === capabilities.browserName) {
        wdHubHost = self.config["phantomHost"];
        self.sessionId = "";
    } else {
        wdHubHost = self.config["seleniumHost"];
    }


    // android flag for minifying JS
    if ("android" === capabilities.browserName) {
        self.minifyJS = true;
    } else {
        self.minifyJS = false;
    }


    if (!wdHubHost) {
        self.errorCallback(self.logger, "Could not determine selenium host", callback);
        return;
    }

    if (self.sessionId) {
        self.logger.info("Connecting to selenium: " + wdHubHost);
    } else {
        self.logger.info("Connecting to selenium: " + wdHubHost + ", browser: " + capabilities.browserName + ", version: " + capabilities.version);
    }

    // deleting module cache to ensure async wd object
    delete require.cache[require.resolve('../../ext-lib/webdriver')];
    delete require.cache[require.resolve('../../ext-lib/webdriver/promise.js')];
    delete require.cache[require.resolve('../../ext-lib/webdriver/_base.js')];

    wd = require('../../ext-lib/webdriver');

    wd.promise.Application.getInstance().on("uncaughtException", function (e) {
        errorMsg = "Uncaught exception: " + e.message;
        if (self.testCallback) {
            self.errorCallback(self.logger, errorMsg, self.testCallback);
        } else {
            self.logger.error(errorMsg);
        }
    });

    self.webdriver = new wd.Builder().
        usingServer(wdHubHost).
        usingSession(self.sessionId).
        withCapabilities(capabilities).build();

    self.webdriver.By = wd.By;
    self.webdriver.listener = wd.promise.Application.getInstance();

    callback(null);
};

/**
 * Driver interface method
 * Tidy up the driver
 *
 * @param callback
 */
SeleniumDriver.prototype.stop = function (callback) {
    if (this.sessionId) {
        if (callback) {
            callback(null);
        }
    } else {
        // we were not given a session id
        this.webdriver.quit().then(function () {
            if (callback) {
                callback(null);
            }
        });
    }
};

/**
 * creates javascript that will be injected in the browser to run the test
 *
 * @private
 *
 * @param testParams parameters for this test
 * @params callback function to call if there was an error
 *
 * @return injectable javascript or false on error
 */
SeleniumDriver.prototype.createDriverJs = function (testParams, callback) {
    var self = this,
        logger = this.logger,
        scriptType = "test",
        testJs,
        testJsUrl = "",
        actionJs,
        actionJsUrl = "",
        testParamsJs,
        appSeedUrl,
        shareLibClientSeedJs,
        seed,
        runner,
        seedJs,
        runnerJs,
        libs,
        arrLib,
        testLibsUrl = "[]",
        testLibsJs = "",
        testLibs = [],
        lib,
        autoTest = false,
        serverBase,
        driverJs,
        libCode,
        instCode,
        i,
        enableYUILoader;

    testJs = testParams.test;
    actionJs = testParams.action;
    if (!testJs && !actionJs) {
        self.errorCallback(logger, "The test or the action js must be specified", callback);
        return false;
    }
    if (actionJs) {
        scriptType = "action";
    }

    appSeedUrl = self.config["defaultAppSeed"];

    enableYUILoader = self.config["enableShareLibYUILoader"] || false;

    seed = self.config["testSeed"];
    runner = self.config["testRunner"];
    seedJs = fs.readFileSync(seed, "utf-8");
    runnerJs = fs.readFileSync(runner, "utf-8");
    libs = testParams.lib;
    if (libs) {
        arrLib = libs.split(",");
    } else {
        arrLib = [];
    }

    testParamsJs = JSON.stringify(testParams);

    // get client side share lib modules meta to let yui loader load share lib

    shareLibClientSeedJs = "";
    if (enableYUILoader) {
        // concat client to check yui loader
        shareLibClientSeedJs += libscanner.scannerUtil.createYuiLoaderCheckerJS(self.config["yuiloaderchecker"]);
        shareLibClientSeedJs += "function startArrowTest() {\n" ;
        this.logger.trace("share lib client js: " + shareLibClientSeedJs);
    }
    testLibsJs +=shareLibClientSeedJs;

    // html tests run themselves
    if (testJs && (".html" === path.extname(testJs))) {
        autoTest = true;
    } else {
//        // if arrow server is not running, we inject the entire script else inject the URL and
//        // let the browser pull in from the arrow server (helps with debugging and injection size
//        // is manageable).
//        serverBase = self.getArrowServerBase();
//        if (false === serverBase) {

        try {
            var deplibs=[];
            for (i = 0; i < arrLib.length; i += 1) {
                lib = arrLib[i];
                if (0 === lib.length) {
                    continue;
                }
                self.logger.info("Loading dependency: " + lib);
                libCode = fs.readFileSync(lib, "utf-8");

                if (!enableYUILoader){
                    deplibs = deplibs.concat(libscanner.scannerUtil.getShareLibSrcByPath(lib, "client"));
                }

                if (self.config.coverage) {
                    instCode = coverage.instrumentCode(libCode, lib);
                    testLibsJs += instCode;
                } else {
                    testLibsJs += libCode;
                }
            }

            if (testJs) {
                self.logger.info("Loading test: " + testJs);
                testLibsJs += fs.readFileSync(testJs, "utf-8");
                if (!enableYUILoader){
                    deplibs = deplibs.concat(libscanner.scannerUtil.getShareLibSrcByPath(testJs, "client"));
                }

            } else {
                self.logger.info("Loading action: " + actionJs);
                testLibsJs += fs.readFileSync(actionJs, "utf-8");
                if (!enableYUILoader){
                    deplibs = deplibs.concat(libscanner.scannerUtil.getShareLibSrcByPath(actionJs, "client"));
                }
            }
            if (deplibs && deplibs.length > 0){

                // Remove Duplicates
                deplibs = deplibs.filter(function (elem, pos) {
                    return deplibs.indexOf(elem) == pos;
                });

                self.logger.debug("Found share libs to load are:");
                self.logger.debug(deplibs);

                for (var i = 0; i < deplibs.length; i++) {
                    try {
                        testLibsJs += fs.readFileSync(deplibs[i], 'utf8');
                        testLibsJs += "\n";
                    } catch (e) {
                        self.logger.debug("Can't read file : " + deplibs[i]);
                    }
                }
            };

        } catch (e) {
            callback(e);
            return false;
        }
//        } else {
//            for (i = 0; i < arrLib.length; i += 1) {
//                lib = arrLib[i];
//                if (0 === lib.length) { continue; }
//                self.logger.info("Loading dependency: " + lib);
//                testLibs.push(self.getRemoteUrl(lib));
//            }
//            testLibsUrl = JSON.stringify(testLibs);
//
//            if (testJs) {
//                self.logger.info("Loading test: " + testJs);
//                testJsUrl = self.getRemoteUrl(testJs);
//            } else {
//                self.logger.info("Loading action: " + actionJs);
//                actionJsUrl = self.getRemoteUrl(actionJs);
//            }
//        }
    }


    if(enableYUILoader){
        testLibsJs += runnerJs + "}\n";
    }else{
        testLibsJs += runnerJs;
    }

    driverJs =
        "ARROW = {};" +
            "ARROW.autoTest = " + autoTest + ";" +
            "ARROW.testParams = " + testParamsJs + ";" +
            "ARROW.appSeed = \"" + appSeedUrl + "\";" +
            "ARROW.testLibs = " + testLibsUrl + ";" +
            "ARROW.scriptType = \"" + scriptType + "\";" +
            "ARROW.testScript = \"" + testJsUrl + "\";" +
            "ARROW.actionScript = \"" + actionJsUrl + "\";" +
            "ARROW.onSeeded = function() { " +testLibsJs+ " };" + seedJs;


    this.logger.trace("Driver js: " + driverJs);
    return driverJs;
};

/**
 * Driver interface method, called by controllers
 *
 * @param page
 * @params callback function to call once navigated
 */
SeleniumDriver.prototype.navigate = function (page, callback) {
    var self = this,
        logger = this.logger,
        webdriver = this.webdriver,
        url;

    self.logger.info("Loading page: " + page);

    // local paths need to be served via test server
    url = self.getRemoteUrl(page);
    if (false === url) {
        self.errorCallback(logger, "Cannot load a local file without arrow_server running: " + page, callback);
    } else {
        webdriver.get(url).then(function () {
            callback();
        });
    }
};

/**
 * Driver interface method, called by controllers
 *
 * @param testConfig values from the config section in the descriptor ycb
 * @param testParams parameters for this test
 * @params callback function to call at the end of the test with errorMsg
 */
SeleniumDriver.prototype.executeAction = function (testConfig, testParams, callback) {
    var self = this,
        logger = this.logger,
        webdriver = this.webdriver,
        actionJs,
        page,
        driverJs,
        retryCount = 0,
        url;

    actionJs = testParams.action;
    page = testParams.page;
    if (!testParams.lib && self.args.params && self.args.params.lib) {
        testParams.lib = self.args.params.lib;
    }
    self.testCallback = callback; // save it so that async wd exception can be reported back

    driverJs = this.createDriverJs(testParams, callback);
    if (false === driverJs) {
        return;
    }

    function finializeAction(actionData) {
        logger.debug("Finalizing action");
        webdriver.executeScript("ARROW.actionReported = true;").then(function () {
            webdriver.waitForNextPage().then(function () {
                callback(null, actionData);
            });
        });
    }

    function collectActionReport() {
        var reportJson;

        retryCount += 1;
        logger.debug("Waiting for the action to finish, attempt: " + retryCount);
        webdriver.executeScript("return ARROW.actionReport;").then(function (report) {
            if (report) {
                reportJson = JSON.parse(report);
                if (reportJson.error) {
                    self.logger.error("Action error: " + reportJson.error);
                    self.errorCallback(logger, "Failed to execute the action: " + actionJs, callback);
                } else {
                    finializeAction(report.data);
                }
            } else if (retryCount > SeleniumDriver.maxAttempt) {
                self.errorCallback(logger, "Failed to execute the action", callback);
            } else {
                setTimeout(collectActionReport, SeleniumDriver.attemptInterval);
            }
        });
    }

    function initAction() {
        webdriver.executeScript(driverJs).then(function () {
            setTimeout(collectActionReport, SeleniumDriver.attemptInterval);
        });
    }

    if (page) {
        self.logger.info("Loading page: " + page);

        // local paths need to be served via test server
        url = self.getRemoteUrl(page);
        if (false === url) {
            self.errorCallback(logger, "Cannot load a local file without arrow_server running: " + page, callback);
        } else {
            webdriver.get(url).then(function () {
                initAction();
            });
        }
    } else {
        initAction();
    }
};

/**
 * Driver interface method, called by controllers
 *
 * @param testConfig values from the config section in the descriptor ycb
 * @param testParams parameters for this test
 * @params callback function to call at the end of the test with errorMsg
 */
SeleniumDriver.prototype.executeTest = function (testConfig, testParams, callback) {
    var self = this,
        logger = this.logger,
        webdriver = this.webdriver,
        testJs,
        page,
        caps = [],
        driverJs,
        retryCount = 0,
        url,
        reportJson;

    testJs = testParams.test;
    page = testParams.page;
    if (!testParams.lib && self.args.params && self.args.params.lib) {
        testParams.lib = self.args.params.lib;
    }
    self.testCallback = callback; // save it so that async wd exception can be reported back

    driverJs = this.createDriverJs(testParams, callback);
    if (false === driverJs) {
        return;
    }

    if (self.minifyJS) {
        driverJs = uglifyParser.parse(driverJs); // parse code and get the initial AST
        driverJs = uglify.ast_mangle(driverJs); // get a new AST with mangled names
        driverJs = uglify.ast_squeeze(driverJs); // get an AST with compression optimizations
        driverJs = uglify.gen_code(driverJs); // compressed code here*
        this.logger.debug("Minified Driver js: " + driverJs);
    }


    function collectTestReport() {
        retryCount += 1;
        logger.debug("Waiting for the test report, attempt: " + retryCount);
        webdriver.executeScript("return ARROW.testReport;").then(function (report) {
            if (report && report !== "{}") {
                webdriver.getCurrentUrl().then(function (u) {
                    reportJson = JSON.parse(report);
                    reportJson.currentUrl = u;
                    self.addReport(JSON.stringify(reportJson), caps);
                });


                showYUIConsoleLog(function () {
                    if (self.config.coverage) {
                        try {
                            webdriver.executeScript("return window.__coverage__").then(function (cov) {
                                // console.log( cov);
                                coverage.addCoverage(cov);
                                callback(null, report);
                            });
                        } catch (e) {
                            self.logger.debug("Error :" + e.toString());
                            callback(null, report);
                        }
                    } else {
                        callback(null, report);
                    }
                });
            } else if (retryCount >= SeleniumDriver.maxAttempt) {
                showYUIConsoleLog(function () {
                    self.errorCallback(logger, "Failed to collect the test report", callback);
                });
            } else {
                setTimeout(collectTestReport, SeleniumDriver.attemptInterval);
            }
        });
    }

    function showYUIConsoleLog(callback) {
        try {
            webdriver.executeScript("return ARROW.consoleLog;").then(function (cLog) {
                if (cLog) {
                    self.logger.debug("Debug Messages from Browser Console :" + "\n" + cLog);
                    callback();
                } else {
                    self.logger.debug("No debug log found in browser.");
                    callback();
                }
            });
        } catch (e) {
            self.logger.trace("Error :" + e.toString());
            callback();
        }
    }

    function initTest() {

        webdriver.executeScript(driverJs).then(function () {
            setTimeout(collectTestReport, SeleniumDriver.attemptInterval);
        });
    }

    webdriver.session_.then(function (val) {
        logger.debug("Selenium session id: " + val.id);
        if (!val.id) {
            self.errorCallback(logger, "Unable to get a valid session, check your selenium config", callback);
            return;
        }

        caps = val.capabilities;
    });


    // in case of html test, we need to load the test as a page
    if (".html" === path.extname(testJs)) {
        page = path.resolve("", testJs);
    }

    // Making sure we have the page, and its not a custom controller.
    if (page && testParams.customController === false) {
        self.logger.info("Loading page: " + page);

        // local paths need to be served via test server
        url = self.getRemoteUrl(page);
        if (false === url) {
            self.errorCallback(logger, "Cannot load a local file without arrow_server running: " + page, callback);
        } else {
            webdriver.get(url).then(function () {
                initTest();
            });
        }
    } else {
        initTest();
    }
};

module.exports = SeleniumDriver;

