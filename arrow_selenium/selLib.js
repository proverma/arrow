/**jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require("fs");
var nopt = require("nopt");
var util = require("util");
var log4js = require("log4js");

var Properties = require("../lib/util/properties");
var ArrowSetup = require('../lib/util/arrowsetup');

var WdSession = require("../lib/session/wdsession");
var CapabilityManager = require("../lib/util/capabilitymanager");

var wd = require("../lib/util/wd-wrapper");
var logger = log4js.getLogger("selLib");

function SelLib(config, argv) {
    this.config = config;
    this.argv = argv;
    this.hub = new WdSession(config);
    console.log('***SELF ARGS:: ' + JSON.stringify(this.argv));

}

SelLib.prototype.closeBrowsers = function (sessionCaps, config, args) {
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

};

SelLib.prototype.describeSessions = function (sessionCaps, config, args) {
    console.log(sessionCaps);
};

SelLib.prototype.describeSession = function (sessionCap, config, args) {
    console.log(sessionCap);
};


SelLib.prototype.listSessions = function (error, next, arrSessions, config, argv) {

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
        next(sessionCaps, config, argv);
    };

    function onSessionCap(val) {
        sessionCaps[val.get("browserName")] = val.toJSON();
        sessionCount += 1;
        if (sessionCount === arrSessions.length) {
            next(sessionCaps, config, argv);
        }
    }

    for (i = 0; i < arrSessions.length; i += 1) {
        sessionId = arrSessions[i];

        webdriver = new wd.Builder().
            usingServer(config["seleniumHost"]).
            usingSession(sessionId).
            build();

        webdriver.getCapabilities().then(function(val) {
            onSessionCap(val)
        });

    }

};

SelLib.prototype.openBrowser = function (sessionCaps, config, argv) {

    var
        self = this;

//    console.log('\n\n****self in openBrowser::' + util.inspect(self));

    var
        browsers = argv.open,
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

        } else {
            capabilities= {
                "browserName": browser,
                "version": "",
                "platform": "ANY",
                "javascriptEnabled": true
            }
        }

        webdriver = new wd.Builder().
            usingServer(config["seleniumHost"]).
            withCapabilities(capabilities).build();
        webdriver.session_.then(self.describeSession);
    }

};

SelLib.prototype.listHelp = function() {

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
};

SelLib.prototype.seleniumSessionSetup = function() {

    var self = this,
        i,
        sessionId;

//    console.log('\n\n****self in seleniumSessionSetup::' + util.inspect(self));

    if (self.argv.list || self.argv.ls) {
        self.hub.getSessions(self.describeSessions, self.listSessions, false, self.config, self.argv);
    }else if (self.argv.open) {
        console.log('****self.argv::' + JSON.stringify(self.argv));
//        console.log('****self.listSessions::' + self.listSessions);
        self.hub.getSessions(self.openBrowser, self.listSessions, true, self.config, self.argv);
    }else if (self.argv.close) {
        self.hub.getSessions(self.closeBrowsers, function(error, ref, arrSessions) {
            if(arrSessions) {
                logger.info ("Found " + arrSessions.length + " Browsers.")
                for (i = 0; i < arrSessions.length; i += 1) {
                    sessionId = arrSessions[i];
                    logger.info("Killing Session ID :" +sessionId );
                    var webdriver  = new wd.Builder().
                        usingServer(self.config["seleniumHost"]).
                        usingSession(sessionId).
                        build();

                    webdriver.quit();
                }
            }
        }, self.config, self.argv);
    } else if (self.argv.help) {
        self.listHelp();
    } else {
        self.listHelp();
    }


};

module.exports = SelLib;