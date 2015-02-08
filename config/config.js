/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var config = {};

// User default config
config.seleniumHost = "";
config.phantomHost = "http://localhost:4445/wd/hub";
config.sauceLabsHost = "http://ondemand.saucelabs.com:80/wd/hub";
config.sauceUsername = "";
config.sauceAccesskey = "";
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
config.defaultAppSeed = "//cdnjs.cloudflare.com/ajax/libs/yui/3.15.0/yui-min.js";
config.autolib = config.arrowModuleRoot + "lib/common";

//for yui sandbox
config.useYUISandbox = false;  // when this is set to true,arrow will use an absolute YUI instead of the YUI on (or injected on) the page.
config.sandboxYUIVersion = '3.8.0'; // please try make this the same with yui npm package version
config.yuiSandboxRuntime = config.arrowModuleRoot + "lib/client/yui-test-runtime.js";  // default runtime js if download yui modules failed

// for test engine
config.engine="yui";   // yui, mocha, jasmine or qunit,default to "yui"
config.engineConfig="";  // config object or fs path to the engine config if supported by engine(like mocha)
config.testSeed = config.arrowModuleRoot + "lib/client/yuitest-seed.js";
config.testRunner = config.arrowModuleRoot + "lib/client/yuitest-runner.js";

// config for share lib
config.shareLibPath = ["./common"];     // Arrow will scan all given path for share lib. Example: [config.arrowModuleRoot + "../"]
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
config.report = true;

config.testTimeOut = 30000; // if test does not get over in these many ms, Arrow fails the test.

config.ignoreSslErrorsPhantomJs = true;
config.startPhantomJs = false;
config.startArrowServer = false;

config.lib = "";
config.artifactsUrl = "";

module.exports = config;
