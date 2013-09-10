/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require("fs");
var glob = require("glob");
var path = require('path');
var Properties = require("../util/properties");
var log4js = require("log4js");
var LibManager = require('../util/libmanager');
var FileUtil = require("../util/fileutil");
var ErrorManager = require("../util/errormanager");

function ArrowSetup(config, argv) {
    this.config = config;
    this.argv = argv;
}

ArrowSetup.prototype.setup = function () {
    this.setuplog4js();
    this.setupReportDir();
    this.setupDefaultDriverName();
    this.setupTestEngine();
    this.setupDefaultLib();
    this.setupHeadlessParam();
    this.setupCapabilities();
    this.setupMisc();
    this.setupReplaceParam();
    this.setupDefaultParam();
    this.errorCheck(); // keep this as last function call for checking errors.

};

ArrowSetup.prototype.setupReplaceParam = function () {
    if (this.argv.replaceParamJSON) {
        this.config.replaceParamJSON = this.argv.replaceParamJSON;
    }
};

ArrowSetup.prototype.setupDefaultParam = function () {
    if (this.argv.defaultParamJSON) {
        this.config.defaultParamJSON = this.argv.defaultParamJSON;
    }
};


ArrowSetup.prototype.errorCheck = function () {
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
};

ArrowSetup.prototype.setupReportDir = function () {

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

    }

};

ArrowSetup.prototype.setupMisc = function () {

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
};

ArrowSetup.prototype.setuplog4js = function () {
    var logLevel;
    logLevel = this.config["logLevel"];
    log4js.setGlobalLogLevel(logLevel);
    log4js.restoreConsole();
    this.logger = log4js.getLogger("ArrowSetup");
};

ArrowSetup.prototype.setupDefaultDriverName = function () {

    // turn on reuseSession, if browser is being reused
    // adding support for "reuse-" too, just in case if a null version is passed with browser.
    if ("reuse" === this.argv.browser || "reuse-" === this.argv.browser) {
        this.argv.reuseSession = true;

        if (!this.argv.driver){
            this.argv.driver = "selenium";
        }
        delete this.argv.browser;
    }

    // setup the selenium host using the auto hookup if possible
    this.setupSeleniumHost();
};

ArrowSetup.prototype.setupSeleniumHost = function () {
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
    }


};

ArrowSetup.prototype.setupDefaultLib = function () {
    this.argv.lib = new LibManager().getAllCommonLib(this.config, this.argv.lib);
    this.logger.debug("Commandline + Common Libs for Test :" + this.argv.lib);
};

ArrowSetup.prototype.setupHeadlessParam = function () {
    var hd,
        results,
        ext;

    if (!this.argv.argv.remain[0]) {
        return;
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
};

ArrowSetup.prototype.setupCapabilities = function () {
    if (this.argv.capabilities) {
        this.config.capabilities = this.argv.capabilities;
    }
};

ArrowSetup.prototype.setupTestEngine = function () {
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
        } catch (e) {
        }
    }
};

module.exports = ArrowSetup;

