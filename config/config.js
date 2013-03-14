/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var config = {};

// User default config
config.seleniumHost = "";
config.phantomHost = "http://localhost:4445/wd/hub";
config.context = "";
config.defaultAppHost = "";
config.logLevel = "INFO";
config.browser = "firefox";
config.parallel = false;
config.baseUrl = "";
// Framework config
config.arrowModuleRoot = global.appRoot + "/";
config.dimensions = config.arrowModuleRoot + "config/dimensions.json";
config.defaultTestHost = config.arrowModuleRoot + "lib/client/testHost.html";
config.defaultAppSeed = "http://yui.yahooapis.com/3.6.0/build/yui/yui-min.js";
config.testSeed = config.arrowModuleRoot + "lib/client/yuitest-seed.js";
config.testRunner = config.arrowModuleRoot + "lib/client/yuitest-runner.js";
config.autolib = config.arrowModuleRoot + "lib/common";

// config for share lib

config.shareLibPath = [];     // Arrow will scan all given path for share lib. Example: [config.arrowModuleRoot + "../"]
                                  // You can modify this to add multiple share lib path.
config.scanShareLibPrefix = [];    // Arrow will only scan share lib with given prefix "martini_" if configured as ["martini_"]
                                  // Or it will scan all folders for share lib under given path if it is empty : []
                                  // You can modify this to add multiple prefix.
config.scanShareLibRecursive = true;     // Only scan top level folders for the given prefix and given scan path if false,
                                         // Otherwise it will scan recursively with the given path.
config.enableShareLibYUILoader = false;    // Default false , inject all necessary share lib source code into test cases .
                                           // If true, generate and inject YUI group/modules info and let YUI loader to load modules.
                                           // the reason we need this is because in yahoo network lot of time
                                           // lab manager windows VM's don't have access to any non-80 port of hudson slaves.
                                           // In those scenarios, YUI config would be a blocker and YUI loader wont work.


config.descriptorName = "test_descriptor.json";
config.minPort = 10000;
config.maxPort = 11000;
config.coverage = false;
config.coverageExclude = "";
config.exitCode = false;
config.retryCount = 0;
config.keepIstanbulCoverageJson = false;
config.color = true;


module.exports = config;
