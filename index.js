#!/usr/bin/env node

/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

//setting appRoot
global.appRoot = __dirname;

//recording currentFolder
global.workingDirectory = process.cwd();

//Array for holding coverage files.
global.coverageMap = [];

//Array for Holding Report Files
global.reportMap = [];

global.pathSep = require("path").sep || '/';
//getting command line args

global.routerMap = {};

global.failedDescriptors = [];

var Arrow = require("./lib/interface/arrow");
var ArrowSetup = require('./lib/util/arrowsetup');
var Help = require('./lib/util/help');
var nopt = require("nopt");
var Properties = require("./lib/util/properties");
var fs = require("fs");

var knownOpts = {
        "browser": [String, null],
        "lib": [String, null],
        "shareLibPath": [String, null],
        "enableShareLibYUILoader": Boolean,
        "page": [String, null],
        "driver": [String, null],
        "controller": [String, null],
        "engine": [String, null],
        "engineConfig": [String, null],
        "reuseSession": Boolean,
        "parallel": [Number, null],
        "report": Boolean,
        "coverage": Boolean,
        "coverageExclude": [String, null],
        "reportFolder": [String, null],
        "testName": [String, null],
        "group": [String, null],
        "logLevel": [String, null],
        "context": [String, null],
        "dimensions": [String, null],
        "capabilities": [String, null],
        "seleniumHost": [String, null],
        "retryCount": [Number, null],
        "exitCode": Boolean,
        "color": Boolean,
        "keepIstanbulCoverageJson": Boolean
    },
    shortHands = {},
//TODO : Investigate and implement shorthands
//    , "br" : ["--browser"]
//    , "lb" : ["--lib"]
//    , "p" : ["--page"]
//    , "d" : ["--driver"]
//    , "ct" : ["--controller"]
//    , "rs" : ["--reuseSession"]
//    , "rp" : ["--report"]
//    , "t" : ["--testName"]
//    , "g" : ["--group"]
//    , "ll" : ["--logLevel"]
//    , "cx" : ["--context"]
//    , "dm" : ["--dimension"]
//    , "sh" : ["--seleniumHost"]
//}

    argv = nopt(knownOpts, shortHands, process.argv, 2),
    arrow,
    prop,
    config,
    arrowSetup;

if (argv.help) {
    Help.showHelp();
    process.exit(0);
}

if (argv.version) {
    console.log("v" + JSON.parse(fs.readFileSync(global.appRoot + "/package.json", "utf-8")).version);
    process.exit(0);
}

if (argv.argv.remain.length === 0 && argv.argv.cooked.length === 1) {
    console.error("Unknown option : '" + argv.argv.cooked[0] + "'");
    process.exit(0);
}

//adding support for --descriptor param
if (argv.argv.remain.length === 0 && argv.descriptor) {
    argv.argv.remain.push(argv.descriptor);
    delete argv.descriptor;
}

//store start time
global.startTime = Date.now();

//check if user wants to override default config.
if (!argv.config) {
    try {
        if (fs.lstatSync(process.cwd() + "config.js").isFile()) {
            argv.config = process.cwd() + "/config.js";
        }
    } catch (e) {
        //console.log("No Custom Config File.")
    }
    if (!argv.config) {
        try {
            if (fs.lstatSync(process.cwd() + "/config/config.js").isFile()) {
                argv.config = process.cwd() + "/config/config.js";
            }
        } catch (e) {
            //console.log("No Custom Config File.")
        }
    }

}
//setup config
prop = new Properties(__dirname + "/config/config.js", argv.config, argv);
config = prop.getAll();

//global variables
global.retryCount = config.retryCount;
global.keepIstanbulCoverageJson = config.keepIstanbulCoverageJson;
global.color = config.color;


function startArrow() {
    // TODO: arrowSetup move to Arrow
    arrowSetup = new ArrowSetup(config, argv);
    this.arrow = Arrow;
    arrowSetup.setup(function () {
        arrow = new Arrow(config, argv);
        arrow.run();
    });

}

if (config.shareLibPath !== undefined) {
    var LibScanner = require('./lib/util/sharelibscanner');
    var libScanner = new LibScanner(config);
    libScanner.genSeedFile(config.shareLibPath, startArrow);
} else {
    startArrow();
}
