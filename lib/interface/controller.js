/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var log4js = require("log4js");

function Controller(testConfig, testParams, driver) {
    this.logger = log4js.getLogger("Controller");
    this.testConfig = testConfig;
    this.testParams = testParams;
    this.driver = driver;
}

Controller.prototype.setup = function (callback) {
    callback();
};

Controller.prototype.execute = function (callback) {
    this.logger.fatal("Controllers must implement the execute method");
};

Controller.prototype.tearDown = function (callback) {
    callback();
};

module.exports = Controller;

