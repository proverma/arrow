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
        isProxyTest = false;

    caps.browserName = args["browser"] || config["browser"];
    if (!caps.browserName) {
        caps.error = "Browser is not specified";
        return caps;
    }

    // For tests needing proxy server
    if (args.proxyUrl) {

        if (args.proxy || args.proxy === undefined) {
            isProxyTest = true;
        } else {
            self.logger.debug("Descriptor overridden proxy param. Not setting proxy in browser");
        }
    }

    if (isProxyTest) {

        self.logger.debug("Adding Proxy Setting to the Browser");
        caps.proxy = {
            "httpProxy": self.args.proxyUrl,
            "proxyType": "manual"
        };

        // If proxy test, session Id wont be set so just set the browser to firefox and version to latest
        caps.browserName = "firefox";
        caps.version = "latest"; //TODO - May need to override this from cmd line or config

    } else { // Browser is already set if setProxySettings is true

        // If reuseSession is explicitly set to false and browser is reuse, then set it to firefox ( TODO - If browser is specified in descriptor, it shall pick up that browser
        if (args.reuseSession === false && caps.browserName === "reuse") {

            caps.browserName = "firefox";
            caps.version = "latest";

        } else {

            // this is the case where user just provides browser as "firefox-10.0"
            browserInfo = caps.browserName.split("-", 2);

            if (browserInfo.length > 1) {
                caps.browserName = browserInfo[0];
                caps.version = browserInfo[1];

            } else {
                versionKey = caps.browserName + "Version";
                if (config[versionKey]) {
                    caps.version = config[versionKey];
                }

            }

        }
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

    return caps;

};

module.exports = CapabilityManager;