/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var config = {};

config.logLevel="$(logLevel)";
config.seleniumHost="$(seleniumHost)";
config.browser="$(browser)";
config.defaultTestHost="/home/y/share/node/arrow/src/client/qunitHost.html";

config.testSeed="/home/y/share/node/arrow/src/client/qunit-seed.js"
config.testRunner="/home/y/share/node/arrow/src/client/qunit-runner.js"
config.seleniumServerPath="/Users/vpranav/Programs/selenium-server.jar";
config.phantomPath="arrow_phantom";

module.exports = config;
