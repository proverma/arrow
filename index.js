#!/usr/bin/env node

/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var Arrow = require("./lib/interface/arrow");
var ArrowSetup = require('./lib/util/arrowsetup');
var nopt = require("nopt");
var Properties = require("./lib/util/properties");
var fs = require("fs");
var path = require("path");

//setting appRoot
global.appRoot = __dirname;

//recording currentFolder
global.workingDirectory = process.cwd();

//Array for holding coverage files.
global.coverageMap = [];

//Array for Holding Report Files
global.reportMap = [];

global.pathSep = path.sep || '/';
//getting command line args

global.routerMap = {};

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
    proxyManager,
    arrowSetup;

//help messages
function showHelp() {
    console.info("\nOPTIONS :" + "\n" +
        "        --lib : a comma seperated list of js files needed by the test" + "\n\n" +
        "        --shareLibPath: a comma seperated list of directory to be scanned and loaded modules by arrow automatically" + "\n\n" +
        "        --page : (optional) path to the mock or production html page" + "\n" +
        "                   example: http://www.yahoo.com or mock.html" + "\n\n" +
        "        --driver : (optional) one of selenium|nodejs. (default: selenium)" + "\n\n" +
        "        --browser : (optional) a comma seperated list of browser names, optionally with a hypenated version number.\n" +
        "                      Example : 'firefox-12.0,chrome-10.0' or 'firefox,chrome' or 'firefox'. (default: firefox)" + "\n\n" +
        "        --engine : (optional) specify the test runner to run test case. Arrow supports test runner of yui, mocha, jasmine, qunit (default: yui)" + "\n" +
        "                      Example : --engine=mocha " + "\n\n" +
        "        --engineConfig : (optional) the file path to config file or a config string  " + "\n" +
        "                      Example : --engineConfig=./mocha-config.json or --engineConfig={\'ui\':\'tdd\'} " + "\n\n" +
        "        --parallel : (optional) test thread count. Determines how many tests to run in parallel for current session. (default: 1)\n" +
        "                          Example : --parallel=3 , will run three tests in parallel" + "\n\n" +
        "        --report : (optional) true/false.  creates report files in junit and json format. (default: true)" + "\n" +
        "                     also prints a consolidated test report summary on console. " + "\n\n" +
        "        --reportFolder : (optional) folderPath.  creates report files in that folder. (default: descriptor folder path)" + "\n\n" +
        "        --testName : (optional) comma seprated list of test name(s) defined in test descriptor" + "\n" +
        "                       all other tests will be ignored." + "\n\n" +
        "        --group : (optional) comma seprated list of group(s) defined in test descriptor." + "\n" +
        "                    all other groups will be ignored." + "\n\n" +
        "        --logLevel : (optional) one of DEBUG|INFO|WARN|ERROR|FATAL. (default: INFO)" + "\n\n" +
        "        --dimensions : (optional) a custom dimension file for defining ycb contexts" + "\n\n" +
        "        --context : (optional) name of ycb context" + "\n\n" +
        "        --seleniumHost : (optional) override selenium host url (example: --seleniumHost=http://host.com:port/wd/hub)" + "\n\n" +
        "        --capabilities : (optional) the name of a json file containing webdriver capabilities required by your project" + "\n\n" +
        "        --startProxyServer : (optional) true/false. Starts a proxy server for all intercepting all selenium browser calls" + "\n\n" +
        "        --routerProxyConfig : (optional) filePath. Expects a Json file, allows users to modify host and headers for all calls being made by browser. Also supports recording of select url calls." + "\n" +
        "                       Example Json :" + "\n" +
        "                       {" + "\n" +
        "                           \"yahoo.com\": {" + "\n" +
        "                               \"newHost\": \"x.x.x.x (your new host ip/name)\"," + "\n" +
        "                               \"headers\": [" + "\n" +
        "                                   {" + "\n" +
        "                                       \"param\": \"<param>\"," + "\n" +
        "                                       \"value\": \"<val>\"" + "\n" +
        "                                   }" + "\n" +
        "                               ]," + "\n" +
        "                               \"record\": true" + "\n" +
        "                           }," + "\n" +
        "                           \"news.yahoo.com\": {" + "\n" +
        "                               \"newHost\": \"x.x.x.x (your new host ip/name)\"," + "\n" +
        "                               \"headers\": [" + "\n" +
        "                                   {" + "\n" +
        "                                       \"param\": \"<param>\"," + "\n" +
        "                                       \"value\": \"<val>\"" + "\n" +
        "                                   }" + "\n" +
        "                               ]," + "\n" +
        "                               \"record\": true" + "\n" +
        "                           }" + "\n" +
        "                      }" + "\n" +
        "        --exitCode : (optional) true/false. Causes the exit code to be non-zero if any tests fail (default: false)" + "\n" +
        "        --color : (optional) true/false. if set to false, it makes console log colorless ( hudson friendly).(default: true)" + "\n" +
        "        --coverage : (optional) true/false. creates code-coverage report for all js files included/loaded by arrow (default: false)" + "\n" +
        "        --coverageExclude : (optional) string. comma-separated list of files to exclude from coverage reports" + "\n" +
        "        --keepIstanbulCoverageJson : (optional) true/false. if set to true, it does not delete Istanbul coverage json files. (default: false)" + "\n" +
        "        --retryCount : (optional) retry count for failed tests. Determines how many times a test should be retried, if it fails. (default: 0)\n" +
        "                       Example : --retryCount=2 , will retry all failed tests 2 times." +
        "        \n\n");

    console.log("\nEXAMPLES :" + "\n" +
        "        Unit test: " + "\n" +
        "          arrow test-unit.js --lib=../src/greeter.js" + "\n\n" +
        "        Unit test that load the share library automatically " + "\n" +
        "          arrow test-unit.js --shareLibPath=../" + "\n\n" +
        "        Unit test with a mock page: " + "\n" +
        "          arrow test-unit.js --page=testMock.html --lib=./test-lib.js" + "\n\n" +
        "        Unit test with selenium: \n" +
        "          arrow test-unit.js --page=testMock.html --lib=./test-lib.js --driver=selenium" + "\n\n" +
        "        Integration test: " + "\n" +
        "          arrow test-int.js --page=http://www.hostname.com/testpage --lib=./test-lib.js" + "\n\n" +
        "        Integration test: " + "\n" +
        "          arrow test-int.js --page=http://www.hostname.com/testpage --lib=./test-lib.js --driver=selenium" + "\n\n" +
        "        Custom controller: " + "\n" +
        "          arrow --controller=custom-controller.js --driver=selenium");
}

if (argv.help) {
    showHelp();
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

//expose classes for test/external usage
this.controller = require('./lib/interface/controller');
this.log4js = require('log4js');

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
    arrowSetup.setup();
    arrow = new Arrow(config, argv);
    arrow.run();

}

if (config.shareLibPath !== undefined) {
    var LibScanner = require('./lib/util/sharelibscanner');
    var libScanner = new LibScanner(config);
    libScanner.genSeedFile(config.shareLibPath, startArrow);
} else {
    startArrow();
}
