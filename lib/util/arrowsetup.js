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
    this.errorCheck();
};

ArrowSetup.prototype.errorCheck = function () {
};

ArrowSetup.prototype.setupReportDir = function () {

    var fileUtil = new FileUtil(),
        targetFolderPath,
        reportFolderPath;

    if (this.argv.report === true) {

        // If reportFolder is passed in the argument,
        if (this.argv.reportFolder) {
            targetFolderPath =  path.resolve(global.workingDirectory, this.argv.reportFolder);
        } else {
            // Report folder not passed by the user
            // By default, reports shall go under arrow-target/reports
            targetFolderPath =  path.resolve(global.workingDirectory, 'arrow-target');
        }

        // Cleanup report folder if already exists
        fileUtil.removeDirectory(targetFolderPath);

        reportFolderPath = path.resolve(targetFolderPath, 'arrow-report');

        fileUtil.createDirectory(reportFolderPath);

        this.argv.reportFolder = targetFolderPath;

        // Make reportFolder global
        global.reportFolder = this.argv.reportFolder;

    } else {
        // If --report is not set to true but reportFolder is passed, ignore it and show warning
        if (this.argv.reportFolder) {
            this.logger.info('WARNING..Ignoring report folder since --report not set to true.');
        }
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
    if (!this.argv.driver) {
        // turn on reuseSession, if browser is being reused
        // adding support for "reuse-" too, just in case if a null version is passed with browser.
        if ("reuse" === this.argv.browser || "reuse-" === this.argv.browser) {
            this.argv.reuseSession = true;
            delete this.argv.browser;
        }

        if (this.argv.reuseSession) {
            this.argv.driver = "selenium";
        }
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
        ext,
        arrowRec,
        dirName;

    if (!this.argv.argv.remain[0]) {
        return;
    }

    hd = this.argv.argv.remain[0];

    // checking is user passed comma seprated string ?
    if (hd.indexOf(",") !== -1) {
        results = hd.split(",");
        this.logger.info("Found Descriptors: " + results);
    } else {
        results = glob.sync(hd);
        this.logger.info("Glob result: " + results);
    }

    if (0 === results.length) {
        this.logger.error("Nothing to test with: " + hd);
        process.exit();
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

