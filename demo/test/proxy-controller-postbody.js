/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var util = require("util");
var log4js = require("yahoo-arrow").log4js;
var Controller = require("yahoo-arrow").controller;

function ProxyCustomController(testConfig, args, driver) {
    Controller.call(this, testConfig, args, driver);

    this.logger = log4js.getLogger("ProxyCustomController");
}
util.inherits(ProxyCustomController, Controller);

ProxyCustomController.prototype.execute = function (callback) {

    var self = this,
        page,
        webdriver;

    if (this.driver.webdriver) {

        page = this.testParams.page;
        webdriver = this.driver.webdriver;

        webdriver.get(page);

        webdriver.waitForElementPresent(webdriver.By.css("#yucsHead")).then(function () {

            var record = JSON.parse(self.getProxyRecord());
console.log(record);
            self.testParams.networkTrafficRecord = record;
            self.driver.executeTest(self.testConfig, self.testParams, function (error, report) {
                callback();
            });

        });
    } else {
        this.logger.fatal("Custom Controllers are currently only supported on Selenium Browsers");
        callback("Custom Controllers are currently only supported on Selenium Browsers");
    }
}

module.exports = ProxyCustomController;
