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
        console.log('****setuplog4js ends..');
        self.setupReportDir(function() {
            console.log('****setupReportDir ends..');
            self.setupDefaultDriverName(function() {
                console.log('****setupDefaultDriverName ends..');
                self.setupTestEngine(function() {
                    console.log('****setupTestEngine ends..');
                    self.setupDefaultLib(function() {
                        console.log('****setupDefaultLib ends..');
                        self.setupHeadlessParam(function() {
                            console.log('****setupHeadlessParam ends..');
                            self.setupCapabilities(function() {
                                console.log('****setupCapabilities ends..');
                                self.setupMisc(function() {
                                    console.log('****setupMisc ends..');
                                    self.setupReplaceParam(function() {
                                        console.log('****setupReplaceParam ends..');
                                        self.setupDefaultParam(function() {
                                            console.log('****setupDefaultParam ends..');
                                            self.startArrowServer(function() {
                                                console.log('****startArrowServer ends..');
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
    console.log('****In setupReplaceParam start..');
    if (this.argv.replaceParamJSON) {
        this.config.replaceParamJSON = this.argv.replaceParamJSON;
    }
    console.log('****In setupReplaceParam end..');
    if (cb) {
        cb();
    }


};

ArrowSetup.prototype.setupDefaultParam = function (cb) {
    console.log('****In setupDefaultParam start..');
    if (this.argv.defaultParamJSON) {
        this.config.defaultParamJSON = this.argv.defaultParamJSON;
    }
    console.log('****In setupDefaultParam end..');
    if (cb) {
        cb();
    }

};


ArrowSetup.prototype.errorCheck = function (cb) {
    console.log('****In errorCheck start..');
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
    errorHandled = true;
    console.log('****In errorCheck end..');
    console.log('****errorHandled ..' + errorHandled);
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.setupReportDir = function (cb) {
    console.log('****In setupReportDir start..');
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
        console.log('****In setupReportDir end..');
        if (cb) {
            cb();
        }


    } else {
        console.log('****In setupReportDir end..');
        if (cb) {
            cb();
        }

    }



};

ArrowSetup.prototype.setupMisc = function (cb) {
    console.log('****In setupMisc start..');
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
    console.log('****In setupMisc end..');
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.setuplog4js = function (cb) {
    console.log('****In setuplog4js start..');
    var logLevel;
    logLevel = this.config["logLevel"];
    log4js.setGlobalLogLevel(logLevel);
    log4js.restoreConsole();
    this.logger = log4js.getLogger("ArrowSetup");
    console.log('****In setuplog4js end..');
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.setupDefaultDriverName = function (cb) {
    console.log('****In setupDefaultDriverName start..');
    // turn on reuseSession, if browser is being reused
    // adding support for "reuse-" too, just in case if a null version is passed with browser.
    if ("reuse" === this.argv.browser || "reuse-" === this.argv.browser) {
        this.argv.reuseSession = true;

        if (!this.argv.driver) {
            this.argv.driver = "selenium";
        }
        delete this.argv.browser;
    }

    // setup the selenium host using the auto hookup if possible
    this.setupSeleniumHost(function() {
        console.log('****In setupDefaultDriverName end..');
        if (cb) {
            cb();
        }

    });
};

ArrowSetup.prototype.setupSeleniumHost = function (cb) {
    console.log('****In setupSeleniumHost start..');
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
        console.log('****In setupSeleniumHost end..');
        if (cb) {
            cb();
        }

    } else {
        console.log('****In setupSeleniumHost end..');
        if (cb) {
            cb();
        }

    }


};

ArrowSetup.prototype.setupDefaultLib = function (cb) {
    console.log('****In setupDefaultLib start..');
    this.argv.lib = new LibManager().getAllCommonLib(this.config, this.argv.lib);
    this.logger.debug("Commandline + Common Libs for Test :" + this.argv.lib);
    console.log('****In setupDefaultLib end..');
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.setupHeadlessParam = function (cb) {
    console.log('****In setupHeadlessParam start..');
    var hd,
        results,
        ext;

    if (!this.argv.argv.remain[0]) {
        console.log('****In setupHeadlessParam end..');
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
    console.log('****In setupHeadlessParam end..');
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.setupCapabilities = function (cb) {
    console.log('****In setupCapabilities start..');
    if (this.argv.capabilities) {
        this.config.capabilities = this.argv.capabilities;
    }
    console.log('****In setupCapabilities end..');
    if (cb) {
        cb();
    }

};

ArrowSetup.prototype.setupTestEngine = function (cb) {
    console.log('****In setupTestEngine start..');
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
            console.log('****In setupTestEngine end..');
            if (cb) {
                cb();
            }

        } catch (e) {
            console.log('****In setupTestEngine end..');
            if (cb) {
                cb();
            }

        }
    } else {
        console.log('****In setupTestEngine end..');
        if (cb) {
            cb();
        }

    }
};

ArrowSetup.prototype.startArrowServer = function(cb) {
    console.log('****In startArrowServer start..');
    var self = this;
    if (this.argv.startArrowServer) {
        Servermanager.startArrowServer(function(arrowServerStarted) {
            if (arrowServerStarted === false) {
                self.logger.info('Failed to start Arrow Server. Exiting !!!');
                process.exit(1);
            }
            console.log('****In startArrowServer end..');
            if (cb) {
                cb();
            }

        });
    } else {
        console.log('****In startArrowServer end..');
        if (cb) {
            cb();
        }

    }


};

ArrowSetup.prototype.startPhantomJs = function(cb) {

    console.log('****In startPhantomJs start..');

    if (this.argv.startPhantomJs) {

        PhantomJsSetup.startPhantomJs(function(running) {
            console.log('****In startPhantomJs end..' + running);

            if (running === false) {
                console.log('***Could not start phantomjs. Exiting.');
                process.exit(1);
            }

            if (cb) {
                cb();
            }
        });
    } else if (cb) {
        console.log('****In startPhantomJs end..');
        cb();
    }


};

module.exports = ArrowSetup;

