/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true, continue:true*/
/*jslint undef: true*/
/*
 * Copyright (c) 2012, Yahoo! Inc. All rights reserved.
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
var EngineManager = require("../util/enginemanager");
var uglifyParser = require("uglify-js").parser;
var uglify = require("uglify-js").uglify;
var ErrorManager = require("../util/errormanager"), em = ErrorManager.getInstance();

/**
 * Driver wrapping web driver
 */
function SeleniumDriver(config, args) {
    Driver.call(this, config, args);
    coverage.configure(config);

    this.logger = log4js.getLogger("SeleniumDriver");



    //CONFIG Params
    this.attemptInterval = 500; // millisec

    //storing hasTest property
    if (this.args.hasTest === null || this.args.hasTest === undefined) {
        this.hasTest = true;
    } else {
        this.hasTest = this.args.hasTest;
    }


    //checking if user has given a testTimeOut ar descriptor
    if (this.args.testTimeOut) {
        this.maxAttempt = this.args.testTimeOut / this.attemptInterval;
    //checking if user has given a global testTimeOut at commandline
    } else if (this.config.testTimeOut) {
        this.maxAttempt = this.config.testTimeOut / this.attemptInterval;
    // default timeout
    } else {
        this.maxAttempt = 30000 / this.attemptInterval;
    }

    this.logger.debug("Test Timeout :" + this.maxAttempt * this.attemptInterval / 1000 + " Seconds");
    // timing out page load at one minute
    this.pageLoadTimeout = 60000;

}

util.inherits(SeleniumDriver, Driver);

SeleniumDriver.wdAppPath = "../../ext-lib/webdriver";

SeleniumDriver.prototype.errorCheck = function (e, callback) {
    var self = this, errorMessage = e.toString(), match = false,
        matchErrorMessage = function (regex, group) {
            var m = errorMessage.match(/([^\n\r]*)[\n|\r]?([\w\W]*)/), line, ret;
            if (group) {
                ret = m ? m[group].match(regex) : undefined;
            } else {
                ret = regex ? errorMessage.match(regex) : m;
            }
            return ret;
        },
        handleIssueWithPageLoading = function (currentUrl) {
            match = matchErrorMessage(/Issue with loading testing page/) ||
                matchErrorMessage(/Issue with loading testing page[\w\W]*?ARROW\.testReport[\n|\r]?/, 1) ||
                matchErrorMessage(/Script execution failed[\w\W]*?ARROW\.testReport[\n|\r]?/, 1);
            if (match) {
                em.errorCallback(1004, currentUrl, callback);
            }
        },

        handleUnknownError = function (currentUrl) {
            match = matchErrorMessage();
            if (match) {
                em.errorCallback(1002, match[1], currentUrl, match[2], callback);
            } else {
                em.errorCallback(1002, undefined, currentUrl, errorMessage, callback);
            }
        },
        matchError = function (handleError) {
            return function(currentUrl) {
                if (!match) {
                    handleError(currentUrl);
                }
                return currentUrl;
            };
        };

    if (errorMessage) {
        if (matchErrorMessage(new RegExp("(ECONNREFUSED|" +
                "Error communicating with the remote browser. It may have died|" +
                "Unable to send request: socket hang up)"))) {
            handleUnknownError();
        } else {
            callback(errorMessage);
//            self.webdriver.getCurrentUrl()
//                .then(matchError(handleIssueWithPageLoading))
//                .then(matchError(handleUnknownError)) // keep handleUnknownError as last error handler
//                .then(null,callback);
        }
    }
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
        wd,
        timeOut,
        cm = new CapabilityManager();

    capabilities = cm.getCapabilities(self.args, self.config);

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

    //storing browserName
    self.browserName = capabilities.browserName;

    // deleting module cache to ensure async wd object
    delete require.cache[require.resolve(SeleniumDriver.wdAppPath)];
    delete require.cache[require.resolve('../../ext-lib/webdriver/_base.js')];

    wd = require(SeleniumDriver.wdAppPath);

    self.webdriver = new wd.Builder().
        usingServer(wdHubHost).
        usingSession(self.sessionId).
        withCapabilities(capabilities).build();

    self.webdriver.By = wd.By;

    // Dummy object to ignore uncaught exception at custom controller level
    self.webdriver.listener = function () {

    };
    self.webdriver.listener.on = function () {
        self.logger.warn("Please stop using uncaught-exception event handler at custom controller, Arrow automatically handles all uncaught-exceptions.");
    };

    // private listener for uncaught exception
    wd.promise.controlFlow().on('uncaughtException', function (e) {
        self.errorCheck(e, self.callback);
    });

    //Setting Timeouts
    //TODO : We may need to expose 'pageLoadTimeout' param at descriptor or CLI level.

    self.webdriver.manage().timeouts().pageLoadTimeout(self.pageLoadTimeout);

    callback(null);
};


/**
 * Driver interface method
 * Tidy up the driver
 *
 * @param callback
 */
SeleniumDriver.prototype.stop = function (callback, error) {

    if (this.sessionId) {
        if (callback) {
            callback(null);
        }
    } else {
        // we were not given a session id
        if (this.webdriver) {
            this.webdriver.quit().then(function () {
                if (callback) {
                    callback(error);
                }
            });
        } else {
            if (callback) {
                callback(error);
            }
        }
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
        yuiruntime = "",
        appSeedUrl,
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
        trunkdriverJs,
        libCode,
        instCode,
        i,
        shareLibClientSeedJs,
        enableYUILoader,
        depLibs = [],
        hasBeenLoaded,
        engineMgr,
        engine,
        engineConfig,
        enableYUISandbox,
        yuiDepLibs = [],
        urlDepLibs = [],
        allDeps,
        addToDependency,
        needYUILoaderCheck,
        resolvePath;

    resolvePath = function (prepath) {
        if (typeof prepath !== "string") {
            return prepath;
        }
        if (self.args.relativePath) {
            return path.resolve(global.workingDirectory, self.args.relativePath, prepath);
        } else {
            return path.resolve(global.workingDirectory, prepath);
        }
    };

    testJs = testParams.test;
    actionJs = testParams.action;
    if (!testJs && !actionJs) {
        return callback("The test or the action js must be specified");
    }
    if (actionJs) {
        scriptType = "action";
    }
    appSeedUrl = self.config["defaultAppSeed"];

    // change for test engine
    engine = testParams.engine || self.config['engine'];
    engine = engine || "yui";
    engineMgr = new EngineManager(self.config);

    seed = engineMgr.getEngineSeed();
    runner = engineMgr.getEngineRunner();
    if (seed) {
        seedJs = fs.readFileSync(seed, "utf-8");
    }
    if (runner) {
        runnerJs = fs.readFileSync(runner, "utf-8");
    }

    seed = engineMgr.getTestSeed(engine);
    runner = engineMgr.getTestRunner(engine);
    seedJs += fs.readFileSync(seed, "utf-8");
    runnerJs += fs.readFileSync(runner, "utf-8");

    engineConfig = testParams.engineConfig || self.config['engineConfig'];
    engineConfig = resolvePath(engineConfig);
    engineConfig = JSON.stringify(engineMgr.getConfigJason(engineConfig));

    /*
     make the whole driverjs to a closure and use defined yui instance
     make sure engine must be yui and use sandbox set to true
     */
    enableYUISandbox = engine === "yui" && self.config["useYUISandbox"] === true;
    enableYUILoader = self.config["enableShareLibYUILoader"] || false;

    libs = testParams.lib;

    if (libs) {
        arrLib = libs.split(",");
    } else {
        arrLib = [];
    }

    testParamsJs = JSON.stringify(testParams);

    // get client side share lib modules meta to let yui loader load share lib
    shareLibClientSeedJs = "";

    // not using sandbox and use yui loader to loader external yui modules.
    needYUILoaderCheck = !enableYUISandbox && enableYUILoader;
    if (needYUILoaderCheck) {
        // concat client to check yui loader
        shareLibClientSeedJs += libscanner.scannerUtil.createYuiLoaderCheckerJS();
        shareLibClientSeedJs += "function startArrowTest() {\n";
        this.logger.trace("share lib client js: " + shareLibClientSeedJs);
    }
    testLibsJs += shareLibClientSeedJs;

    // html tests run themselves
    if (testJs && (".html" === path.extname(testJs))) {
        autoTest = true;
    } else {
        // // if arrow server is not running, we inject the entire script else inject the URL and
        // // let the browser pull in from the arrow server (helps with debugging and injection size
        // // is manageable).
        // serverBase = self.getArrowServerBase();
        // if (false === serverBase) {
        addToDependency = function (alldeps) {
            if (alldeps.yuiDepLibs && alldeps.yuiDepLibs.length > 0) {
                yuiDepLibs = yuiDepLibs.concat(allDeps.yuiDepLibs);
            }
            if (alldeps.shareDepLibs && alldeps.shareDepLibs.length > 0) {
                depLibs = depLibs.concat(allDeps.shareDepLibs);
            }
            if (alldeps.urlDepLibs && alldeps.urlDepLibs.length > 0) {
                urlDepLibs = urlDepLibs.concat(allDeps.urlDepLibs);
            }
        }
        try {
            for (i = 0; i < arrLib.length; i += 1) {
                lib = arrLib[i];
                if (0 === lib.length) {
                    continue;
                }

                self.logger.info("Loading dependency: " + lib);
                libCode = fs.readFileSync(lib, "utf-8");

                if (self.config.coverage) {
                    instCode = coverage.instrumentCode(libCode, lib);
                    testLibsJs += instCode;
                } else {
                    testLibsJs += libCode;
                }
                // if use yui sandbox,then use yui loader to resolve all yui dependencies and get all src through http
                allDeps = libscanner.scannerUtil.getSrcDependencyByPath(lib, "client");
                addToDependency(allDeps);
            }

            if (testJs) {
                self.logger.info("Loading test: " + testJs + " from " + this.args.relativePath);
                testJs = resolvePath(testJs);
            } else {
                self.logger.info("Loading action: " + actionJs + " from " + this.args.relativePath);
                testJs = resolvePath(actionJs);
            }
            testLibsJs += fs.readFileSync(testJs, "utf-8");
            allDeps = libscanner.scannerUtil.getSrcDependencyByPath(testJs, "client");
            addToDependency(allDeps);

            // get all share lib src,that's when using yui sandbox or not using yuisandbox but also not using yui loader
            if (!needYUILoaderCheck && depLibs && depLibs.length > 0) {
                // Remove Duplicates
                hasBeenLoaded = function (arr, lib) {
                    if (!arr || arr.length === 0) {
                        return false;
                    }
                    var libmeta,
                        sharelibmeta;
                    for (i = 0; i < arr.length; i = i + 1) { // (share)lib has full path,libs maybe relative path
                        try {

                            // for libs passed as commonlib or lib or cmdline --lib, they have higher priority
                            // then share lib , so if it has been loaded( same yui module name), then ignore that in share lib

                            if (fs.realpathSync(arr[i]) === fs.realpathSync(lib)) {
                                self.logger.debug(lib + " has been loaded , will be ignored");
                                return true;
                            }

                            sharelibmeta = libscanner.scannerUtil.captureYUIModuleDetails(arr[i]);
                            libmeta = libscanner.scannerUtil.captureYUIModuleDetails(lib);
                            if (sharelibmeta !== null &&
                                sharelibmeta !== null &&
                                libmeta.name &&
                                libmeta.name === sharelibmeta.name) {
                                self.logger.debug(lib + " has been loaded , will be ignored");
                                return true;
                            }

                        } catch (e) {
                            return false;
                        }
                    }
                    return false;
                };

                self.logger.debug("Auto-Detected libs for this test :" + depLibs);

                depLibs = depLibs.filter(function (elem, pos) {
                    return depLibs.indexOf(elem) === pos && !hasBeenLoaded(arrLib, elem);
                });

                self.logger.info("Auto-Detected libs to load for this test :" + depLibs);

                for (i = 0; i < depLibs.length; i = i + 1) {
                    try {
                        libCode = fs.readFileSync(depLibs[i], 'utf8');
                        if (self.config.coverage) {
                            instCode = coverage.instrumentCode(libCode, depLibs[i]);
                            testLibsJs += instCode;
                        } else {
                            testLibsJs += libCode;
                        }
                        testLibsJs += "\n";
                    } catch (e) {
                        self.logger.info("Can't read file : " + depLibs[i]);
                    }
                }

            }

        } catch (ex) {
            self.logger.debug("Exception while loading dependencies.." + ex);
            return callback(ex);
        }
    }

    /*
     Sometimes we should retrieve the modules that on the page but not resolved in the sandbox
     Not clear if there're dangerous to do this.so comment it .
     */
    //if (enableYUISandbox) {
    //    testLibsJs += ";(function(){try{var Y=YUI();if(Y.config.global && Y.config.global.YUI)YUI.Env.mods=Y.merge(Y.config.global.YUI.Env.mods,YUI.Env.mods);}catch(e){}}());";
    //}

    if (needYUILoaderCheck) {
        testLibsJs += runnerJs + "}\n";
    } else {
        testLibsJs += runnerJs;
    }

    trunkdriverJs =
        "ARROW = {};" +
            "ARROW.autoTest = " + autoTest + ";" +
            "ARROW.useYUISandbox = " + enableYUISandbox + ";" +
            "ARROW.testParams = " + testParamsJs + ";" +
            "ARROW.appSeed = \"" + appSeedUrl + "\";" +
            "ARROW.libUrls = \"" + urlDepLibs.join() + "\";" +
            "ARROW.testLibs = " + testLibsUrl + ";" +
            "ARROW.scriptType = \"" + scriptType + "\";" +
            "ARROW.testScript = \"" + testJsUrl + "\";" +
            "ARROW.actionScript = \"" + actionJsUrl + "\";" +
            "ARROW.engineConfig = " + engineConfig + ";" +
            "ARROW.onSeeded = function() { " + testLibsJs + " };" + seedJs;

    // get all yui-core modules src if use yui sandbox
    if (enableYUISandbox) {
        if (yuiDepLibs && yuiDepLibs.length > 0) {
            yuiruntime = "var YUI;\n"; // make undefined YUI
            yuiDepLibs = yuiDepLibs.filter(function (elem, pos) {
                return yuiDepLibs.indexOf(elem) === pos;
            });
            self.logger.info("Auto-Detected yui modules to resolve for this test :" + yuiDepLibs);
            libscanner.scannerUtil.resolveYUIDenpendency(yuiDepLibs, {version: self.config['sandboxYUIVersion']}, function (err, yuisrc) {
                if (err) {
                    self.logger.error("Resolve YUI dependency error: " + err + " ,Will use default YUI runtime js:" + self.config['yuiSandboxRuntime']);
                    yuiruntime += fs.readFileSync(self.config['yuiSandboxRuntime'], 'utf8'); // default runtime code
                } else {
                    yuiruntime += yuisrc;
                }
                driverJs =
                    ";(function () {\n" + yuiruntime + "\n" + // use sandbox-ed yui if config
                        trunkdriverJs +
                        "}());";

//                self.logger.trace("Driver js: " + driverJs);
                callback(null, driverJs);
            });
        }
    } else {
        driverJs =
            ";(function () {\n" +
                trunkdriverJs +
                "}());";
//        this.logger.trace("Driver js: " + driverJs);
        callback(null, driverJs);
    }
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
            } else if (retryCount > self.maxAttempt) {
                self.errorCallback(logger, "Failed to execute the action", callback);
            } else {
                setTimeout(collectActionReport, self.attemptInterval);
            }
        });
    }

    function initAction() {
        webdriver.executeScript(driverJs).then(function () {
            setTimeout(collectActionReport, self.attemptInterval);
        });
    }

    this.createDriverJs(testParams, function (err, driverjs) {
        if (err) {
            return callback(err);
        }
        driverJs = driverjs;
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
    });
};

/**
 * Driver interface method, called by controllers
 *
 * @param testConfig values from the config section in the descriptor ycb
 * @param testParams parameters for this test
 * @param callback function to call at the end of the test with errorMsg
 * @param web_driver webdriver to execute test (to support multiple selenium sessions)
 */
SeleniumDriver.prototype.executeTest = function (testConfig, testParams, callback, web_driver) {
    var self = this,
        logger = this.logger,
        webdriver = web_driver || this.webdriver,
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

                collectTestParams(function () {

                    showYUIConsoleLog(function () {

                        if (self.config.coverage) {
                            // if client code coverage was set, then don't need to return __coverage__
                            // because client side will sent it back (the __coverage__  is usually a large size, "return" it will cause error)
                            if (self.config.proxyUrl &&
                                self.config.proxyConfig &&
                                self.config.proxyConfig.coverage &&
                                self.config.proxyConfig.coverage.clientSideCoverage == true) {
                                coverage.addCoverage({}); // just init collector
                                setTimeout(function () {
                                    callback(null, report);
                                }, self.config.proxyConfig.coverage.timeout || 5000);
                                return;
                            }

                                webdriver.executeScript("return window.__coverage__").then(function (cov) {
                                    //console.log( cov);
                                    coverage.addCoverage(cov);
                                    callback(null, report);
                                },
                                function(err){
                                    self.logger.debug('Error while executing script:' + err);
                                    callback(err, report);
                                });

                        } else {
                            callback(null, report);
                        }
                    });

                });

            } else if (retryCount >= self.maxAttempt) {
                showYUIConsoleLog(function () {
                    self.errorCallback(logger, "Test Timed Out. It can happen due to one of these three reasons :" +
                        "\n" +
                        "1) Your Test Script or page had a JS error, if you had --logLevel=debug in your command, you can see debug messages from browser console printed just before this error message." +
                        "\n" +
                        "2) The page got redirected before completing the test, this happens if your page has auto-redirects, or your tests perform some UI action resulting into page change event. Please use a custom controller for these kind of issues. " +
                        "\n" +
                        "3) Your test took more than " + self.maxAttempt * self.attemptInterval / 1000 + " Seconds.", callback)
                });
            } else {
                setTimeout(collectTestReport, self.attemptInterval);
            }
        },
        function(e){
            logger.debug("Error while executing script:" + e);
            callback(e);
        });

    }

    function collectTestParams(callback) {
        try {
            webdriver.executeScript("return ARROW.testParams;").then(function (params) {
                if (params && typeof params.shared === "object" && Object.keys(params.shared).length) {
                    self.logger.debug("Arrow.testParams:" + JSON.stringify(params.shared));
                    testParams.shared = params.shared;
                } else {
                    self.logger.trace("Arrow.testParams:" + "nothing" + "\n\n");
                }
                callback();
            },function(err) {
                self.logger.debug("Error while collecting test params:" + err);
                callback(err);
            });
        } catch (e) {
            self.logger.trace("Error :" + e.toString());
        }
    }

    function showYUIConsoleLog(callback) {
            webdriver.executeScript("return ARROW.consoleLog;").then(function (cLog) {
                if (cLog) {
                    self.logger.debug("Debug Messages from Browser Console :" + "\n" + cLog);
                    callback();
                } else {
                    self.logger.debug("No debug log found in browser.");
                    callback();
                }
            },
            function(err) {
                self.logger.debug('Error in showYUIConsoleLog:' + err);
                callback(err);
            });

    }

    function initTest() {
        webdriver.executeScript(driverJs).then(function () {
            setTimeout(collectTestReport, self.attemptInterval);
        },
        function(err){
            self.testCallback(err);
        });
    }

    this.createDriverJs(testParams, function (err, driverjs) {

        if (err) {
            return callback(err);
        }

        driverJs = driverjs;

        if (self.minifyJS) {
            driverJs = uglifyParser.parse(driverJs); // parse code and get the initial AST
            driverJs = uglify.ast_mangle(driverJs); // get a new AST with mangled names
            driverJs = uglify.ast_squeeze(driverJs); // get an AST with compression optimizations
            driverJs = uglify.gen_code(driverJs); // compressed code here*
            self.logger.debug("Minified Driver js: " + driverJs);
        }
        webdriver.session_.then(function (val) {
            logger.trace("Selenium session id: " + val.id);
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
            // for local page ,has to add relative path
            if ("http:" !== page.substr(0, 5) && "https:" !== page.substr(0, 6)) {
                if (self.args.relativePath) {
                    page = path.resolve(global.workingDirectory, self.args.relativePath, page);
                } else {
                    page = path.resolve(global.workingDirectory, page);
                }
            }
            self.logger.info("Loading page: " + page);

            // local paths need to be served via test server
            url = self.getRemoteUrl(page);
            if (false === url) {
                self.errorCallback(logger, "Cannot load a local file without arrow_server running: " + page, callback);
            } else {
                webdriver.get(url).then(function () {
                    initTest();
                },
                function(err){
                    callback(err);
                });
            }
        } else {
            initTest();
        }
    });
};

module.exports = SeleniumDriver;

