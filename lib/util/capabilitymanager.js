/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var log4js = require("log4js");
var fs = require("fs");
var clone = require("clone");

function CapabilityManager() {
    this.logger = log4js.getLogger("CapabilityManager");
}

CapabilityManager.prototype.getCapability = function (capJsonPath, capName) {

    var capJson,
        cap,
        commonCap,
        k,
        self = this;

    try {

        capJson = JSON.parse(fs.readFileSync(capJsonPath, "utf-8"));
        cap = clone(capJson.capabilities[capName]);
        commonCap = capJson.common_capabilities;
        if (cap) {
            for (k in commonCap) {
                cap[k] = commonCap[k];
            }
            return cap;
        }

    } catch (e) {
        self.logger.error('Error in parsing capabilities json -' + capJsonPath);

    }

    return null;

};


CapabilityManager.prototype.getCapabilities = function (args, config) {

    var self = this,
        caps = {
            "platform": "ANY",
            "javascriptEnabled": true,
            "seleniumProtocol": "WebDriver"
        },
        tmpCaps,
        browserInfo,
        versionKey,
        cm,
        isProxyTest = false,
        browserName,
        browserVersion,
        testName = args.testName;

    caps.browserName = args["browser"] || config["browser"];
    if (!caps.browserName) {
        caps.error = "Browser is not specified";
        return caps;
    }

    // For tests needing proxy server, set proxy flag
    if (args.proxyUrl) {

        if (args.proxy || args.proxy === undefined) {

            isProxyTest = true;

            // Add settings for proxy
            self.logger.debug("Adding Proxy Setting to the Browser for the test " + testName);
            caps.proxy = {
                "httpProxy": args.proxyUrl,
                "sslProxy": args.proxyUrl,
                "proxyType": "manual"
            };

        } else {
            self.logger.debug("Descriptor overridden proxy param. Not setting proxy in browser");
        }
    }

    browserInfo = caps.browserName.split("-", 2);

    if (browserInfo.length > 1) {
        browserName = browserInfo[0];
        browserVersion = browserInfo[1];

    } else {
        browserName = caps.browserName;
        versionKey = caps.browserName + "Version";
        if (config[versionKey]) {
            browserVersion = config[versionKey];
        }
    }

    // If browser is reuse and its a proxy test, set browser to firefox
    if (caps.browserName === "reuse" && isProxyTest) {
        caps.browserName = "firefox";
        caps.version = "latest";
        self.logger.debug(testName + " is a proxy test so can't use reuse. Setting browser to firefox.");
    } else {
        caps.browserName = browserName;
        caps.version = browserVersion;
    }

    // if the user has passed capabilities as json
    if (config.capabilities) {
        cm = new CapabilityManager();
        tmpCaps = cm.getCapability(config.capabilities, caps.browserName);
        if (tmpCaps === null) {
            caps.error = "No related capability for " + caps.browserName + " in " + config.capabilities;
            return caps;
        }
        caps = tmpCaps;
    }

    self.logger.debug('To run the test ' + testName + ' with browser:' + caps.browserName + ',version:' + caps.version);

    browserName = caps.browserName.toLowerCase();

    //extra properties required for appium
        //ios case
    if (browserName === "iphone" || browserName === "ipad") {
        caps.device = browserName;
        caps.app = "safari";
        //android case
    } else if (browserName === "android" || browserName === "androidtablet") {
        caps.device = browserName;
        caps.app = "browser";
    }

    return caps;

};

module.exports = CapabilityManager;