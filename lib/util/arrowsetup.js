/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require("fs");
var glob = require("glob");
var path = require('path');
var async = require('async');
var Properties = require("../util/properties");
var log4js = require("log4js");
var LibManager = require('../util/libmanager');
var FileUtil = require("../util/fileutil");
var ErrorManager = require("../util/errormanager");
var PhantomJsSetup = require("./phantomJsSetup.js");
var Servermanager = require("../../arrow_server/arrowservermanager.js");
var errorHandled = false;

function ArrowSetup(config, argv) {
    var __dirname = global.appRoot;
    this.config = config;
    this.argv = argv;
}

//TODO - Async doesnt work here - errorCheck gets invoked before startArrowServer ends
ArrowSetup.prototype.setup2 = function (cb) {

    var self = this;

    async.series(
        [
            self.setuplog4js(),
            self.setupReportDir(),
            self.setupDefaultDriverName(),
            self.setupTestEngine(),
            self.setupDefaultLib(),
            self.setupHeadlessParam(),
            self.setupCapabilities(),
            self.setupMisc(),
            self.setupReplaceParam(),
            self.setupDefaultParam(),
            self.startArrowServer(),
            self.errorCheck()
        ],
        cb

    );

};

ArrowSetup.prototype.setup = function (cb) {

    var self = this;

    self.setuplog4js(function() {
        self.setupReportDir(function() {
            self.setupDefaultDriverName(function() {
                self.setupTestEngine(function() {
                    self.setupDefaultLib(function() {
                        self.setupHeadlessParam(function() {
                            self.setupCapabilities(function() {
                                self.setupMisc(function() {
                                    self.setupReplaceParam(function() {
                                        self.setupDefaultParam(function() {
                                            self.startArrowServer(function() {
                                                self.startPhantomJs(function() {
                                                    self.errorCheck(function() {
                                                        cb();
                                                    }); // keep this as last function call for checking errors.
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

};

ArrowSetup.prototype.setupReplaceParam = function (cb) {
    this.logger.trace('setupReplaceParam starts');
    if (this.argv.replaceParamJSON) {
        this.config.replaceParamJSON = this.argv.replaceParamJSON;
    }
    this.logger.trace('setupReplaceParam ends');
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.setupDefaultParam = function (cb) {
    this.logger.trace('setupDefaultParam starts');
    if (this.argv.defaultParamJSON) {
        this.config.defaultParamJSON = this.argv.defaultParamJSON;
    }
    this.logger.trace('setupDefaultParam ends');
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.errorCheck = function (cb) {
    this.logger.trace('errorCheck starts');
    var self = this, em = ErrorManager.getInstance(),
        Environment = function() {
            if (self.argv.argv.cooked) {
                // em.errorLog("self.argv.argv.cooked {0}",  JSON.stringify(self.argv.argv.cooked));
                var cooked = JSON.stringify(self.argv.argv.cooked), proc = self.mock || process;
                cooked.replace(/"--context","([\w\W]*?)"/, function (match, context) {
                // em.errorLog("match is {0}, context is {1}", match, context);
                    context.replace(/environment:([\w\W]*)/, function (match, env) {
                        // em.errorLog("match is {0}, env is {1}", match, env);
                        if (self.dimensions[0].environment[env] === undefined) {
                            em.errorLog(1000, env, self.dimensionsFile);
                            proc.exit(1);
                        } else {
                            self.environment = env;
                        }
                    });
                });
            }
        },
        Dimensions = function() {
            // To Do : should check dimensions file with Json schema
            // em.errorLog("config {0} argv {1}", JSON.stringify(self.config), JSON.stringify(self.argv));
            var dimensions = self.argv.dimensions || self.config.dimensions || "", dimJson, i = 0, proc = self.mock || process,
                errorMessage, argv = self.argv.argv || {}, remain = JSON.stringify(argv.remain) || "",
                dimensionsExist = function () {
                    return remain.match(/"[\w\W]*\.json"/) && dimensions.length > 0;
                };

            if (dimensionsExist()) {
                try {
                    self.dimensionsFile = dimensions;
                    dimJson = JSON.parse(fs.readFileSync(dimensions, "utf-8"));
                } catch (e) {
                    errorMessage = e.message;
                }
                if (dimJson && dimJson.length > 0 && dimJson[i].dimensions) {
                    self.dimensions = dimJson[i].dimensions;
                    // em.errorLog("dimensions {0}", JSON.stringify(self.dimensions));
                } else {
                    em.errorLog(1001, dimensions, errorMessage || JSON.stringify(dimJson));
                    proc.exit(1);
                }
                Environment();
            }
    };

    em.logger = self.mock || em.logger;
    Dimensions();
    this.logger.trace('errorCheck ends');
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.setupReportDir = function (cb) {
    this.logger.trace('setupReportDir starts');
    global.reportFolder = "";
    // To generate the reports, if either report is true or reportFolder is passed
    if (this.argv.reportFolder || true === this.argv.report) {

        var fileUtil = new FileUtil(),
            targetFolderPath,
            reportFolderPath;

        // If reportFolder is passed in the argument,
        if (this.argv.reportFolder) {
            targetFolderPath =  path.resolve(global.workingDirectory, this.argv.reportFolder, 'arrow-target');
        } else {
            // Report folder not passed by the user
            // By default, reports shall go under arrow-target/reports
            targetFolderPath =  path.resolve(global.workingDirectory, 'arrow-target');
        }

        // Cleanup report folder if keepTestReport set to false or undefined
        if (this.argv.keepTestReport === undefined || false === this.argv.keepTestReport) {
            fileUtil.removeDirectory(targetFolderPath);
        }

        reportFolderPath = path.resolve(targetFolderPath, 'arrow-report');

        fileUtil.createDirectory(reportFolderPath);

        this.argv.reportFolder = targetFolderPath;
        global.reportFolder = this.argv.reportFolder || "";
        this.logger.trace('setupReportDir ends');
        if (cb) {
            cb();
        }


    } else {
        this.logger.trace('setupReportDir ends');
        if (cb) {
            cb();
        }

    }

};

ArrowSetup.prototype.setupMisc = function (cb) {
    this.logger.trace('setupMisc starts');
    if (this.argv.coverage !== undefined) {
        this.config.coverage = this.argv.coverage;
    }

    if (this.argv.report === undefined && this.config.report) {
        this.argv.report = this.config.report;
    }

    if (this.argv.dimensions) {
        this.argv.dimensions = path.resolve(global.workingDirectory, this.argv.dimensions);
        this.config.dimensions = this.argv.dimensions;
    }
    this.logger.trace('setupMisc ends');
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.setuplog4js = function (cb) {

    var logLevel;
    logLevel = this.config["logLevel"];
    log4js.setGlobalLogLevel(logLevel);
    log4js.restoreConsole();
    this.logger = log4js.getLogger("ArrowSetup");
    this.logger.trace('setuplog4js starts');
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.setupDefaultDriverName = function (cb) {

    var self = this;

    self.logger.trace('setupDefaultDriverName starts');
    // turn on reuseSession, if browser is being reused
    // adding support for "reuse-" too, just in case if a null version is passed with browser.
    if ("reuse" === this.argv.browser || "reuse-" === this.argv.browser) {
        self.argv.reuseSession = true;

        if (!self.argv.driver) {
            self.argv.driver = "selenium";
        }
        delete self.argv.browser;
    }

    // setup the selenium host using the auto hookup if possible
    self.setupSeleniumHost(function() {
        self.logger.trace('setupDefaultDriverName ends');
        if (cb) {
            cb();
        }

    });
};

ArrowSetup.prototype.setupSeleniumHost = function (cb) {
    this.logger.trace('setupSeleniumHost starts');
    var wdHubHost,
        wdStatusFile = "/tmp/arrow_sel_server.status";

    // setup the selenium host using the auto hookup if possible
    wdHubHost = this.config["seleniumHost"];
    if (0 === wdHubHost.length) {
        // check if we have a hooked up server
        try {
            fs.statSync(wdStatusFile).isFile();
            wdHubHost = fs.readFileSync(wdStatusFile, "utf-8");
        } catch (ex) {
        }

        // final default
        if (wdHubHost.length === 0) {
            wdHubHost = "http://localhost:4444/wd/hub";
        }
        this.config["seleniumHost"] = wdHubHost;
        this.logger.trace('setupSeleniumHost ends');
        if (cb) {
            cb();
        }

    } else {
        this.logger.trace('setupSeleniumHost ends');
        if (cb) {
            cb();
        }

    }


};

ArrowSetup.prototype.setupDefaultLib = function (cb) {
    this.logger.trace('setupDefaultLib starts');
    this.argv.lib = new LibManager().getAllCommonLib(this.config, this.argv.lib);
    this.logger.debug("Commandline + Common Libs for Test :" + this.argv.lib);
    this.logger.trace('setupDefaultLib ends');
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.setupHeadlessParam = function (cb) {
    this.logger.trace('setupHeadlessParam starts');
    var hd,
        results,
        ext;

    if (!this.argv.argv.remain[0]) {
        this.logger.trace('setupHeadlessParam ends');
        if (cb) {
            cb();
        }

    }

    hd = this.argv.argv.remain[0];

    results = glob.sync(hd);
    this.logger.info("Glob result: " + results);

    if (0 === results.length) {
        this.logger.error("ERROR : No Test or Descriptor Found, while looking for : " + hd);
        process.exit(1);
    }

    ext = path.extname(results[0]);
    // check the first file to determine the type
    if (".json" === ext) {
        this.config.arrDescriptor = results;
    } else if ((".js" === ext) || (".html" === ext)) {
        if (results.length > 1) {
            this.argv.tests = results;
        } else {
            this.argv.test = results[0];
        }
    } else {
        this.logger.fatal("Unknown test file type " + results[0]);
        process.exit(0);
    }
    this.logger.trace('setupHeadlessParam ends');
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.setupCapabilities = function (cb) {
    this.logger.trace('setupCapabilities starts');
    if (this.argv.capabilities) {
        this.config.capabilities = this.argv.capabilities;
    }
    this.logger.trace('setupCapabilities ends');
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.setupTestEngine = function (cb) {
    this.logger.trace('setupTestEngine starts');
    this.config.engine = "yui";
    if (this.argv.engine) {
        this.config.engine = this.argv.engine;
    }
    if (this.argv.engineConfig) {
        try {
            this.config.engineConfig = this.argv.engineConfig;
            if (fs.statSync(this.argv.engineConfig).isFile()) {
                //get absolute path before chdir
                this.config.engineConfig = path.resolve("", this.argv.engineConfig);
            }
            this.logger.trace('setupTestEngine ends');
            if (cb) {
                cb();
            }

        } catch (e) {
            this.logger.trace('setupTestEngine ends');
            if (cb) {
                cb();
            }

        }
    } else {
        this.logger.trace('setupTestEngine ends');
        if (cb) {
            cb();
        }

    }
};

ArrowSetup.prototype.startArrowServer = function(cb) {

    var self = this;

    self.logger.trace('startArrowServer starts');

    if (self.argv.startArrowServer) {
        Servermanager.startArrowServer(function(arrowServerStarted) {
            if (arrowServerStarted === false) {
                self.logger.info('Failed to start Arrow Server. Exiting !!!');
                process.exit(1);
            }
            self.logger.trace('startArrowServer ends');
            if (cb) {
                cb();
            }

        });
    } else {
        self.logger.trace('startArrowServer ends');
        if (cb) {
            cb();
        }

    }

};

ArrowSetup.prototype.startPhantomJs = function(cb) {

    this.logger.trace('startPhantomJs starts');
    var self = this;
    if (self.argv.startPhantomJs) {

        PhantomJsSetup.startPhantomJs(function(phantomHost) {

            if (phantomHost) {
                self.logger.trace('startPhantomJs ends.');
                // Override default phantomHost
                self.config["phantomHost"] = phantomHost;
                if (cb) {
                    cb();
                }
            } else {
                self.logger.info('Could not start phantomjs. Exiting.');
                process.exit(1);
            }
        });
    } else if (cb) {
        self.logger.trace('startPhantomJs ends');
        cb();
    }

};

module.exports = ArrowSetup;