/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var config = {};

// User default config
config.seleniumHost = "";
config.defaultAppHost = "";
config.logLevel = "INFO";
config.browser = "firefox";
config.firefoxVersion = "";
config.parallel = false;
config.baseUrl = "";
// Framework config
config.arrowModuleRoot = global.appRoot + "/";
config.dimensions = config.arrowModuleRoot + "config/dimensions.json";
config.defaultTestHost = config.arrowModuleRoot + "lib/client/testHost.html";
config.defaultAppSeed = "http://yui.yahooapis.com/3.4.1/build/yui/yui-min.js";
config.testSeed = config.arrowModuleRoot + "lib/client/yuitest-seed.js";
config.testRunner = config.arrowModuleRoot + "lib/client/yuitest-runner.js";
config.autolib = config.arrowModuleRoot + "lib/common";
config.descriptorName = "test_descriptor.json";

module.exports = config;
