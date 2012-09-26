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
var ArrowRecursive = require('./arrowrecursive.js');

function ArrowSetup(config, argv) {
    this.config = config;
    this.argv = argv;
    this.startRecursiveProcess = false;
}

ArrowSetup.prototype.setup = function () {
    this.setuplog4js();
    this.setupDefaultDriverName();
    this.setupDefaultLib();
    this.setupHeadlessParam();
    this.setupCapabilities();
    this.errorCheck();
};

ArrowSetup.prototype.childSetup = function () {
    this.setuplog4js();
    this.setupDefaultDriverName();
    this.setupDefaultLib();
    this.setupCapabilities();
    this.errorCheck();
};

ArrowSetup.prototype.errorCheck = function () {
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
        if ("reuse" === this.argv.browser) {
            this.argv.reuseSession = true;
            delete this.argv.browser;
        }

        if (this.argv.reuseSession) { this.argv.driver = "selenium"; }
    }

    // setup the selenium host using the auto hookup if possible
    this.setupSeleniumHost();
};

ArrowSetup.prototype.setupSeleniumHost = function () {
    var wdHubHost,
        wdStatusFile = "/tmp/arrow_sel_server.status",
        pjStatusFile = global.appRoot + "/tmp/arrow_phantom_server.status",
        pjHubHost;

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
        if (wdHubHost.length === 0) { wdHubHost = "http://localhost:4444/wd/hub"; }
        this.config["seleniumHost"] = wdHubHost;
    }

    try {
        fs.statSync(pjStatusFile).isFile();
        pjHubHost = fs.readFileSync(pjStatusFile, "utf-8");
        if (pjHubHost.length > 0) {
            this.config["ghostDriverHost"] = pjHubHost;
        }
    } catch (ex2) {
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

    if (!this.argv.argv.remain[0]) { return; }

    hd = this.argv.argv.remain[0];
    results = glob.sync(hd);
    this.logger.info("Glob result: " + results);
    if (0 === results.length) {
        this.logger.error("Nothing to test with: " + hd);
        process.exit();
    }

    ext = path.extname(results[0]);
    // check the first file to determine the type
    if (".json" === ext) {
        if (results.length > 1) {
            // call arrow rec with all json files
            this.startRecursiveProcess = true;
            arrowRec = new ArrowRecursive(this.config, this.argv);
            arrowRec.runAllDescriptors(results);
        } else {
            this.argv.descriptor = results[0];

            // check if we need to change directory
            dirName = path.dirname(results[0]);
            if (dirName.length > 0) {
                this.logger.info("Switching directory to: " + dirName);
                process.chdir(dirName);
                this.argv.descriptor = path.basename(results[0]);
            }
        }
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

module.exports = ArrowSetup;

