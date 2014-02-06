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
var existsSync = fs.existsSync || path.existsSync;

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
        this.logger.debug("ResolvedProxyConfig path for " + this.descriptorPath + " is :" + this.resolvedProxyConfigPath);
        this.args.proxyUrl = global.routerMap[this.resolvedProxyConfigPath];
        try {
            this.args.proxyConfig = require(this.resolvedProxyConfigPath);
        } catch (e) {
            this.logger.debug("Exception in resolving " + this.resolvedProxyConfigPath + " : " + e);
        }

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

    // checking if there is a yui test failures : self.isFail()
    // or if there is a failure at controller level : error
    if (error || self.isFail()) {
        // if retryCount is provided, and retries are left for this test, lets record the failure and retry the test
        if (global.retryCount - self.retryCount >= 0) {
            self.recordFailure(self.retryCount, function() {
                self.driver.stop(function() {
                    self.logger.info("\nRetrying Test, Attempt #" + self.retryCount);
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

/**
 *
 * @param testName
 * @param count
 * @param descriptorPath
 * @param reportDir
 * @param screenShotsDir
 * @param artifactsUrl
 * @returns {{}} - Object of Img and Html paths for screenshots - both relative and absolute
 */
TestSession.prototype.getArtifactPaths = function (artifactsObj){

    var
        self = this,
        fileUtil = new FileUtil(),
        dirPath,
        screenShotsPath,
        screenShotFilename,
        screenShotImgPath,
        screenShotHtmlPath,
        artifactPaths = {};

//    console.log('*****Object::' + JSON.stringify(artifactsObj));

    try {

        dirPath = artifactsObj.descriptorPath ? artifactsObj.descriptorPath : "";
        dirPath = path.resolve(artifactsObj.reportDir, artifactsObj.screenShotsDir, dirPath);

        // Create path till the directory eg arrow-target/screenshots/descriptorPath
        if (!existsSync(dirPath)) {
            fileUtil.createDirectory(dirPath);
        }

        screenShotsPath = artifactsObj.screenShotsDir;
        screenShotFilename = artifactsObj.testName + "-" + artifactsObj.count;
        screenShotImgPath = screenShotFilename + ".png";
        screenShotHtmlPath = screenShotFilename + ".html";

//        console.log('\n***screenShotImgPath::' + screenShotImgPath);
//        console.log('***dirPath::' + dirPath);

        artifactPaths.screenShotImgAbsPath = path.resolve(dirPath, screenShotImgPath);
        artifactPaths.screenShotHtmlAbsPath = path.resolve(dirPath, screenShotHtmlPath);

        if (artifactsObj.artifactsUrl) {
//            console.log('*****screenShotsPath::  ' + screenShotsPath);
//            console.log('*****obj.descriptorPath::  ' + artifactsObj.descriptorPath);
//            console.log('*****screenShotImgPath::  ' + screenShotImgPath);
//            console.log('*****obj.artifactsUrl::  ' + artifactsObj.artifactsUrl);
//            console.log('***Png path to form :' + path.join(screenShotsPath, artifactsObj.descriptorPath, screenShotImgPath));

            // Note - artifactsUrl comes appended with reportFolder ( from ArrowSetup ). So no need to append reportDir again
            artifactPaths.pngPath = artifactsObj.artifactsUrl + path.sep + path.join(screenShotsPath, artifactsObj.descriptorPath, screenShotImgPath);
            artifactPaths.pngPath = encodeURI(artifactPaths.pngPath);

            artifactPaths.htmlPath = artifactsObj.artifactsUrl + path.sep + path.join(screenShotsPath, artifactsObj.descriptorPath, screenShotHtmlPath);
            artifactPaths.htmlPath = encodeURI(artifactPaths.htmlPath);

        } else {
            artifactPaths.pngPath = artifactPaths.screenShotImgAbsPath;
            artifactPaths.htmlPath = artifactPaths.screenShotHtmlAbsPath;
        }

//        console.log('\n\n');
//        console.log('**screenShotImgAbsPath::' + artifactPaths.screenShotImgAbsPath);
//        console.log('**screenShotHtmlAbsPath::' + artifactPaths.screenShotHtmlAbsPath);
//        console.log('**pngPath::' + artifactPaths.pngPath);
//        console.log('**htmlPath::' + artifactPaths.htmlPath);
//        console.log('\n\n');

    }
    catch(e) {
        self.logger.error('Error while getting artifact paths:' + e);
    }

    return artifactPaths;

}

TestSession.prototype.recordFailure = function (count, callback) {

    var webdriver = this.driver.webdriver,
        self = this,
        screenShotsDir = "screenshots",
        arrowTargetDir = "arrow-target",
        screenShotImgAbsPath,
        screenShotHtmlAbsPath,
        screenShotMsg,
        pngPath,
        htmlPath,
        paths,
        artifactPaths,
        reportDir,
        testName,
        artifactsObj = {};

    try {

        reportDir = ( global.reportFolder === '') ? arrowTargetDir : path.basename(global.reportFolder);
//        console.log('***global.reportFolder::' + global.reportFolder);
//        console.log('***ReportDir::' + reportDir);
//        console.log('****XXXX::' + path.resolve(process.cwd(),global.reportFolder));

        if (testName) {
            testName = "arrow-" + this.args.testName;
        } else {
            testName = "arrow";
        }

        // Instantiate artifactsObj
        artifactsObj.testName = testName;
        artifactsObj.count = count;
        artifactsObj.descriptorPath = self.descriptorPath;
        artifactsObj.reportDir = reportDir;
        artifactsObj.screenShotsDir = screenShotsDir;
        artifactsObj.artifactsUrl = global.artifactsUrl;

        artifactPaths = self.getArtifactPaths(artifactsObj);

        if (artifactPaths) {
            screenShotImgAbsPath = artifactPaths.screenShotImgAbsPath;
            screenShotHtmlAbsPath = artifactPaths.screenShotHtmlAbsPath;
            pngPath = artifactPaths.pngPath;
            htmlPath = artifactPaths.htmlPath;
        }

        screenShotMsg = "\nPlease find the artifacts for the failed test - " + this.args.testName + " -  \nScreenshot: " + pngPath +
            "\n\nHTML: " + htmlPath + '\n';

        self.logger.info(screenShotMsg);

        if (webdriver) {
            //recording screenshot
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
                        screenShotMsg += '\nHTML Source: ' + paths.html + '\n';
                    } else {
                        screenShotMsg += '\nCould not find HTML source\n';
                    }

                    if (paths.png || paths.html) {
                        screenShotMsg = "\nPlease find the artifacts for the failed test - " + self.args.testName + " - \n" + screenShotMsg;
                    } else {
                        screenShotMsg = "\nCould not find the artifacts for the failed test - " + self.args.testName + " - \n";
                    }

                    self.screenShotPaths.push(paths);
                    callback();
                }, function(err) {
                    self.logger.error('Error while recording HTML source: ' + err);
                    callback();
                });

            }, function(err) {
                self.logger.error('Error while recording HTML screenshot: ' + err);
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

module.exports = TestSession;

