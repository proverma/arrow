#!/usr/bin/env node

/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require("fs");
var nopt = require("nopt");
var log4js = require("log4js");

var Properties = require("../lib/util/properties");
var ArrowSetup = require('../lib/util/arrowsetup');

var WdSession = require("../lib/session/wdsession");
var CapabilityManager = require("../lib/util/capabilitymanager");


//getting command line args
var argv = nopt();

var wd = require("../lib/util/wd-wrapper");
//setup config
var prop = new Properties(__dirname + "/../config/config.js", argv.config, argv);
var config = prop.getAll();
//console.log(config);
var logger = log4js.getLogger("selenium");

function listSessions(error, next, arrSessions) {
    var sessionCaps = [],
        sessionCount = 0,
        i,
        sessionId,
        webdriver;

    if (error !== null) {
        logger.fatal("Unable to connect to a Selenium session.  Download the selenium server JAR from http://code.google.com/p/selenium/downloads/list, \
start it with: \"java -jar path/to/jar/selenium-server-standalone-<VERSION>.jar\".  Create a browser session on http://127.0.0.1:4444/wd/hub or with \"arrow_server --open=<browser_name>\"\n");
        return;
    }
    if (0 === arrSessions.length) {
        next(sessionCaps);
    }

    function onSessionCap(val) {
        sessionCaps[val.browserName] = val;
        sessionCount += 1;
        if (sessionCount === arrSessions.length) {
            next(sessionCaps);
        }
    }

    for (i = 0; i < arrSessions.length; i += 1) {
        sessionId = arrSessions[i];


        webdriver = new wd.Builder().
            usingServer(config["seleniumHost"]).
            usingSession(sessionId).
            build();
        webdriver.getCapabilities().then(onSessionCap);
    }
}

function describeSession(sessionCap) {
    console.log(sessionCap);
}

function describeSessions(sessionCaps) {
    console.log(sessionCaps);
}

function openBrowser(sessionCaps) {
    var browsers = argv.open,
        browserList = browsers.split(","),
        webdriver,
        browser,
        i,
        cm,
        capabilities,
        val;
    for (i = 0; i < browserList.length; i += 1) {
        browser = browserList[i];
        if (0 === browser.length) { continue; }

        logger.info("Opening browser: " + browser);
        if (sessionCaps.hasOwnProperty(browser)) {
            logger.info("Already open, ignored");
            continue;
        }

        //When user has passed capabilities.json
        if(argv.capabilities){
            var caps = {
                "platform": "ANY",
                "javascriptEnabled": true,
                "seleniumProtocol": "WebDriver"
            };
            caps.browserName = argv.open;
            if(!caps.browserName){
                logger.error("No Browser is specified");
                process.exit(1);
            }
            cm = new CapabilityManager();
            capabilities = cm.getCapability(argv.capabilities,caps.browserName);
            if(capabilities === null){
                logger.error("No related capability for " + caps.browserName + " in " + argv.capabilities);
                process.exit(1);
            }
        }
        else{
            var capabilities= {
                "browserName": browser,
                "version": "",
                "platform": "ANY",
                "javascriptEnabled": true
            }
        }
        webdriver = new wd.Builder().
            usingServer(config["seleniumHost"]).
            withCapabilities(capabilities).build();
        webdriver.session_.then(describeSession);
    }
}

function closeBrowsers(sessionCaps) {
    var browser,
        cap,
        webdriver;
    for (browser in sessionCaps) {
        logger.info("Closing browser: " + browser);

        cap = sessionCaps[browser];
        webdriver =  new wd.Builder().
            usingServer(config["seleniumHost"]).
            usingSession(cap.id).
            build();
        webdriver.quit();
    }
}


function listHelp() {
    console.info("\nCommandline Options :" + "\n" +
        "--list : Lists all selenium browser sessions" + "\n" +
        "--open=<browser1[, browser2]> : Comma seperated list of browsers to launch" + "\n" +
        "--open=<browser> : browser to choose from capabilities.json" + " --capabilities= path to capabilities.json" + "\n" +
        "--close : Close all selenium controller browser sessions" + "\n\n" +
        "Examples:\n" +
        "Open Firefox and Chrome browser instances:\n" +
        "arrow_selenium --open=firefox,chrome\n"  +
        "Open Firefox with given capabilities:\n" +
        "arrow_selenium --open=firefox --capabilities=./cap.json\n"
    );
}


var arrowSetup = new ArrowSetup(config, argv);
arrowSetup.setuplog4js();
arrowSetup.setupSeleniumHost();
logger.info("Selenium host: " + config["seleniumHost"]);

var hub = new WdSession(config);

if (argv.list || argv.ls) {
    hub.getSessions(describeSessions, listSessions, false);
}else if (argv.open) {
    hub.getSessions(openBrowser, listSessions, true);
}else if (argv.close) {
    hub.getSessions(closeBrowsers, listSessions, true);
} else if (argv.help) {
    listHelp();
} else {
    listHelp();
}
