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
config.defaultShareLibPath=[config.arrowModuleRoot+"../"];
config.scanModulesPrefix = ["martini_"];  // you can modify this to scan(add) more modules
config.scanModulesRecursive=false;   // only scan top level folders for the prefix with given scan path if false,
                                    // otherwise will scan recursively with the given path.but will cost more time.
config.serverConfigName = "server_seed.js";
config.clientConfigName = "client_seed.js";

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
