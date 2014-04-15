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

/**
 *
 * @param caps - JSON blob or path to capabilities file
 * @param capName - Browsername
 * @returns {*}
 */
CapabilityManager.prototype.getCapability = function (caps, capName) {

    var capJson,
        cap,
        commonCap,
        k,
        self = this;

    try {

        capJson = self.getCapsJSON(caps);
        cap = clone(capJson.capabilities[capName]);
        commonCap = capJson.common_capabilities;
        if (cap) {
            for (k in commonCap) {
                cap[k] = commonCap[k];
            }
            return cap;
        }

    } catch (e) {
        self.logger.error('Error in parsing capabilities json -' + caps);

    }

    return null;

};

/**
 *
 * @param caps - Can be a JSON blob or filePath for capabilities file
 * @returns {*} - JSON capabilities object
 */
CapabilityManager.prototype.getCapsJSON = function(caps) {

    var capJson,
        self = this;

    if (caps) {

        // If caps is JSON blob
        try {
            capJson = JSON.parse(caps);
            return capJson;
        }
        catch(e) {
            self.logger.debug('Error in parsing caps. It might be JSON file');
        }

        // If caps is file path containing JSON object
        try {
            capJson = JSON.parse(fs.readFileSync(caps, "utf-8"));
            return capJson;
        }
        catch(e) {
            self.logger.debug('Error in parsing capabilities JSON -' + caps);
        }
    }

    return null;


};

/**
 *
 * @param args
 * @param config
 * @returns {{platform: string, javascriptEnabled: boolean, seleniumProtocol: string}}
 */
CapabilityManager.prototype.getCapabilities = function (args, config) {

    var self = this,
        caps = {
            "platform": "ANY",
            "javascriptEnabled": true,
            "seleniumProtocol": "WebDriver"
        },
        tmpCaps,
        cm;

    caps.browserName = args["browser"] || config["browser"];
    if (!caps.browserName) {
        caps.error = "Browser is not specified";
        return caps;
    }

    // Set proxy capabilities
    caps = self.setProxyCaps(caps, args);

    // Set browser capabilities
    caps = self.setBrowserCaps(caps, args, config);

    // Process user capabilities
    caps = self.processUserCapabilities(caps, config);

    caps = self.setMobileCaps(caps);

    self.logger.debug('To run the test ' + args.testName + ' with browser:' + caps.browserName + ',version:' + caps.version);

    return caps;

};

/**
 * Set device and app in capabilities for mobile browsers
 */
CapabilityManager.prototype.processUserCapabilities = function(caps, config) {

    var cm,
        tmpCaps;

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

/**
 * Set device and app in capabilities for mobile browsers
 */
CapabilityManager.prototype.setMobileCaps = function(caps) {

    var browserName = caps.browserName.toLowerCase();

    //extra properties required for appium
    //ios case
    if (browserName === "iphone" || browserName === "ipad") {
        caps.device = browserName;
        caps.app = "safari";

        // Remove version property if set to latest
        if (caps.version === "latest") {
            delete caps.version;
        }

        //android case
    } else if (browserName === "android" || browserName === "androidtablet") {
        caps.device = browserName;
        caps.app = "browser";
    }
    return caps;


};

/**
 * Set capabilities for proxy
 * @param args
 * @param caps
 * @returns {*}
 */
CapabilityManager.prototype.setProxyCaps = function (caps, args) {

    var self = this;
    // For tests needing proxy server, set proxy flag
    if (args.proxyUrl) {

        if (args.proxy || args.proxy === undefined) {

            // Add settings for proxy
            self.logger.debug("Adding Proxy Setting to the Browser for the test " + args.testName);
            caps.proxy = {
                "httpProxy": args.proxyUrl,
                "sslProxy": args.proxyUrl,
                "proxyType": "manual"
            };

        } else {
            self.logger.debug("Descriptor overridden proxy param. Not setting proxy in browser");
        }
    }
    return caps;

};

/**
 * Set browserName and version
 * @param caps
 * @param config
 * @param args
 */
CapabilityManager.prototype.setBrowserCaps = function (caps, args, config) {

    var browserInfo,
        browserName,
        browserVersion,
        versionKey,
        self = this;

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
    if (caps.browserName === "reuse" && caps.proxy) {
        caps.browserName = "firefox";
        caps.version = "latest";
        self.logger.debug(args.testName + " is a proxy test so can't use reuse. Setting browser to firefox.");
    } else {
        caps.browserName = browserName;
        caps.version = browserVersion;
    }

    return caps;

};



module.exports = CapabilityManager;