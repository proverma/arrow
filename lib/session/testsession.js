/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var log4js = require("log4js");
var Arrow = require("../interface/arrow");
var fs = require('fs');
var path = require('path');
var FileUtil = require("../util/fileutil");
var SessionUtil = require("./sessionUtil");
var SauceLabsUtil = require("../util/sauceLabsUtil");
var CapabilityManager = require("../util/capabilitymanager");
var existsSync = fs.existsSync || path.existsSync;
var PhantomJsSetup = require("../util/phantomJsSetup.js");

function TestSession(config, args, sessionId) {
    this.logger = log4js.getLogger("TestSession");
    this.args = args;
    this.config = config;
    this.sessionId = sessionId;
    this.driverName = args.driver;
    this.controller = args.controller;
    this.testConfig = args.config || {};
    this.retryCount = 0;
    this.screenShotPaths = [];
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

    if (args.qualifiedDescriptorPath) {
        this.qualifiedDescriptorPath = args.qualifiedDescriptorPath;
    }

    this.startTime = 0;
    this.endTime = 0;
    if (args.resolvedProxyConfigPath) {
        this.resolvedProxyConfigPath = args.resolvedProxyConfigPath;
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
    this.logger.debug("driver: " + this.driverName + ", browser: " + this.args.browser);
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
    if (this.resolvedProxyConfigPath) {
        this.logger.debug("ResolvedProxyConfig path for " + this.qualifiedDescriptorPath + " is :" + this.resolvedProxyConfigPath);
        this.args.proxyUrl = global.routerMap[this.resolvedProxyConfigPath];
        try {
            this.args.proxyConfig = require(this.resolvedProxyConfigPath);
        } catch (e) {
            this.logger.error("Exception in resolving " + this.resolvedProxyConfigPath + " : " + e);
        }

    }
    this.driver = new DriverClass(this.config, this.args);
    this.driver.setSessionId(this.sessionId);

    //checking if its a mobile browser
    this.driver.isMobile = this.isMobile(this.args.browser);

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
            self.logger.error("Error while setting up selenium :" + error);
            self.retryTest(callback, error);
            //return;
        } else {
            self.driver.start(function (error) {
                if (error) {
                    self.logger.error("Error while starting test :" + error);
                    self.retryTest(callback, error);
                    //return;
                } else {
                    arrow.runController(self.controller, self.testConfig, self.testParams, self.driver, function (error, data, controller) {
                        if (error) {
                            self.logger.error("Error while running controller :" + error);
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

/**
 * Record test failure and rerun the failed test
 * @param callback
 * @param error
 */
TestSession.prototype.retryTest = function (callback, error) {

    var self = this,
        isTestPassed,
        isSauceLabs;

    self.retryCount += 1;

    isTestPassed = error || self.isFail();
    isSauceLabs = self.config.isSauceLabs;

    var cm = new CapabilityManager();
    var browser = self.args["browser"]
        || self.config["browser"];

    var capabilities = cm.getCapabilities(self.args, self.config);

    // checking if there is a test failures : self.isFail()
    // or if there is a failure at controller level : error
    if (isTestPassed) {
        // if retryCount is provided, and retries are left for this test, lets record the failure and retry the test
        if (global.retryCount - self.retryCount >= 0) {
            self.logger.debug('Recording failure before retrying');
            self.recordFailure(self.retryCount, function() {
                self.logger.debug('Before stopping');
                self.driver.stop(function() {
                    self.logger.info("\nRetrying Test, Attempt #" + self.retryCount);
                    self.reRunSetup(function(){
                        self.runTest(callback);
                    });

                });
            });
        } else {
            self.logger.debug('Recording failure');
            self.recordFailure(self.retryCount, function() {
                if (isSauceLabs) {

                    self.updateSauceLabs(false, self.args.testName,
                        self.driver.sauceLabsSessionId,
                        capabilities.username,
                        capabilities.accessKey,
                        self.logger,
                        function(){
                            self.driver.stop(callback, error);
                        });

                } else {
                    self.driver.stop(callback, error);
                }
            });
        }
    } else {
        if (isSauceLabs) {

            self.updateSauceLabs(true, self.args.testName,
                self.driver.sauceLabsSessionId,
                capabilities.username,
                capabilities.accessKey,
                self.logger,
                function(){
                    self.driver.stop(callback, error);
                });

        } else {
            self.driver.stop(callback);
        }
    }
};

/**
 * Update sauce labs result
 * @param passed
 * @param testName
 * @param sessionId
 * @param username
 * @param accessKey
 * @param callback
 */
TestSession.prototype.updateSauceLabs = function(result,
                                                 testName,
                                                 sessionId,
                                                 username,
                                                 accessKey,
                                                 logger,
                                                 callback) {

    var sauceLabsUtil = new SauceLabsUtil();

    sauceLabsUtil.updateJobStatus({"passed":result, "name": testName},
        sessionId,
        username,
        accessKey,
        function(err){
            if (err) {
                logger.debug('Error in updating sauce labs pass result status - ' + err);
            } else {
                logger.debug('Successfully updated sauce labs pass result status');
            }
            // If failed to update sauce labs , log it but don't pass back
            callback(null);
            return;
        });
};

/**
 * Check for failures in test report
 * @returns {boolean}
 */
TestSession.prototype.isFail = function () {
    var
        rep,
        self = this,
        sessionUtil = new SessionUtil();

    //checking if there was any failure
    rep = self.driver.getReports();
    return sessionUtil.isFail(rep);
};

/**
 *
 * @param artifactsObj : fields - testName ,count , qualifiedDescriptorPath , reportDir , screenShotsDir , artifactsUrl
 * @returns {{}} - Object of Img and Html paths for screenshots - both relative and absolute
 */
TestSession.prototype.getArtifactPaths = function (artifactsObj){

    var
        self = this,
        dirPath,
        screenShotsPath,
        screenShotFilename,
        screenShotImgPath,
        screenShotHtmlPath,
        artifactPaths = {};

    try {

        dirPath = artifactsObj.qualifiedDescriptorPath ? artifactsObj.qualifiedDescriptorPath : "";
        dirPath = path.resolve(artifactsObj.reportDir, artifactsObj.screenShotsDir, dirPath);

        screenShotsPath = artifactsObj.screenShotsDir;
        artifactPaths.screenShotDirAbsPath = path.resolve(dirPath);

        screenShotFilename = artifactsObj.testName + "-" + artifactsObj.count;
        screenShotImgPath = screenShotFilename + ".png";
        screenShotHtmlPath = screenShotFilename + ".html";

        artifactPaths.screenShotImgAbsPath = path.resolve(dirPath, screenShotImgPath);
        artifactPaths.screenShotHtmlAbsPath = path.resolve(dirPath, screenShotHtmlPath);

        if (artifactsObj.artifactsUrl) {
            // Note - artifactsUrl comes appended with reportFolder ( from ArrowSetup ). So no need to append reportDir again
            artifactPaths.pngPath = artifactsObj.artifactsUrl + path.sep + path.join(screenShotsPath, artifactsObj.qualifiedDescriptorPath, screenShotImgPath);
            artifactPaths.pngPath = encodeURI(artifactPaths.pngPath);

            artifactPaths.htmlPath = artifactsObj.artifactsUrl + path.sep + path.join(screenShotsPath, artifactsObj.qualifiedDescriptorPath, screenShotHtmlPath);
            artifactPaths.htmlPath = encodeURI(artifactPaths.htmlPath);

        } else {
            artifactPaths.pngPath = artifactPaths.screenShotImgAbsPath;
            artifactPaths.htmlPath = artifactPaths.screenShotHtmlAbsPath;
        }

    } catch (e) {
        self.logger.error('Error while getting artifact paths:' + e);
    }

    return artifactPaths;

};

/**
 *
 * @param count
 * @param callback
 */
TestSession.prototype.recordFailure = function (count, callback) {

    var webdriver = this.driver.webdriver,
        self = this,
        fileUtil = new FileUtil(),
        screenShotsDir = "screenshots",
        arrowTargetDir = "arrow-target",
        screenShotImgAbsPath,
        screenShotHtmlAbsPath,
        screenShotMsg = '',
        pngPath,
        htmlPath,
        paths,
        artifactPaths,
        reportDir,
        testName,
        artifactsObj = {};

    try {

        reportDir = ( global.reportFolder === '') ? arrowTargetDir :global.reportFolder;

        testName = "arrow-";

        if (self.args && self.args.testName) {
            testName = "arrow-" + self.args.testName;
        } else {
            testName = "arrow";
        }

        // Instantiate artifactsObj
        artifactsObj.testName = testName;
        artifactsObj.count = count;
        artifactsObj.descriptorPath = self.descriptorPath;
        artifactsObj.qualifiedDescriptorPath = self.qualifiedDescriptorPath;
        artifactsObj.reportDir = reportDir;
        artifactsObj.screenShotsDir = screenShotsDir;
        artifactsObj.artifactsUrl = global.artifactsUrl;

        artifactPaths = self.getArtifactPaths(artifactsObj);

        if (artifactPaths) {
            screenShotImgAbsPath = artifactPaths.screenShotImgAbsPath;
            screenShotHtmlAbsPath = artifactPaths.screenShotHtmlAbsPath;
            pngPath = artifactPaths.pngPath;
            htmlPath = artifactPaths.htmlPath;

            // Create screenshot directory if it doesnt exist
            if (!existsSync(artifactPaths.screenShotDirAbsPath)) {
                fileUtil.createDirectory(artifactPaths.screenShotDirAbsPath);
            }

        }

        if (webdriver) {
            //recording screenshot

            self.logger.debug('Recording screenshot at ' + screenShotImgAbsPath);

            webdriver.takeScreenshot().then(function(img) {

                paths = {};

                try {

                    fs.writeFileSync(screenShotImgAbsPath, new Buffer(img, 'base64'));

                    if (existsSync(screenShotImgAbsPath)) {
                        paths.png = pngPath;
                    }

                } catch (ex) {
                    self.logger.error('Error while recording screenshot - ' + screenShotImgAbsPath);
                }

                self.logger.debug('Recording HTML pagesource at ' + screenShotHtmlAbsPath);

                //recording html source
                webdriver.getPageSource().then(function(src) {

                    try {

                        fs.writeFileSync(screenShotHtmlAbsPath, src);

                        if (existsSync(screenShotHtmlAbsPath)) {
                            paths.html = htmlPath;
                        }

                    } catch (ex) {
                        self.logger.error('Error while recording HTML source - ' + screenShotHtmlAbsPath);
                    }

                    if (paths.png) {
                        screenShotMsg += '\nScreenshot: ' + paths.png + '\n';
                    } else {
                        screenShotMsg += '\nCould not find screenshot\n';
                    }

                    if (paths.html) {
                        screenShotMsg += '\nHTML: ' + paths.html + '\n';
                    } else {
                        screenShotMsg += '\nCould not find HTML source\n';
                    }

                    if (paths.png || paths.html) {
                        screenShotMsg = "\nPlease find the artifacts for the failed test - " + self.args.testName + " - \n" + screenShotMsg;
                    } else {
                        screenShotMsg = "\nCould not find the artifacts for the failed test - " + self.args.testName + " - \n";
                    }

                    self.logger.info(screenShotMsg);
                    self.screenShotPaths.push(paths);
                    callback();
                }, function(err) {
                    self.logger.error('Error while capturing HTML source: ' + err);
                    callback();
                });

            }, function(err) {
                self.logger.error('Error while capturing HTML screenshot: ' + err);
                callback();
            });

        } else {
            callback();
        }
    } catch (e) {
        self.logger.error(e.toString());
        callback();
    }
};

/**
 *
 * @param callback
 */
TestSession.prototype.reRunSetup = function(callback) {

    var self = this,
        phantomJsSetup = PhantomJsSetup.getInstance();
    // If phantomJs is crashed, restart it and continue with tests
    if (self.args.browser === "phantomjs") {
        self.logger.debug('Check if PhantomJs is running');

        phantomJsSetup.isPhantomJsRunning(function(isPhantomJsRunning){
            if (isPhantomJsRunning === false) {
                // Start phantomJs before running the test
                phantomJsSetup.startPhantomJs(self.config.ignoreSslErrorsPhantomJs, function(phantomHost){

                    // Exit if phantomJs could not be started
                    if (!phantomHost) {
                        self.logger.fatal('Could not start phantomjs. Exiting.');
                        process.exit(1);
                    }

                    self.config["phantomHost"] = phantomHost;
                    callback();
                })
            } else {
                callback();
            }
        })

    } else {
        callback();
    }
}

TestSession.prototype.isMobile = function (browserName) {

    var supportedMobileBrowserNames = ["iphone", "ipad", "android", "androidphone", "androidtablet"],
        count;

    if (browserName) {
        count = supportedMobileBrowserNames.indexOf(browserName.toLowerCase());
        if (count >= 0) {
            return true ;
        } else {
            return false ;
        }
    } else {
        return false ;
    }



}

module.exports = TestSession;

