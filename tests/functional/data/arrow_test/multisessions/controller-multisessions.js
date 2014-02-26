/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/*
 * This custom controller is to test using selenium sessions (by multiple webdrivers)
 * so that they can interact with each other inside a Arrow test session.
 *
*/

var util = require("util");
var log4js = require("yahoo-arrow").log4js;
var Controller = require("yahoo-arrow").controller;
var WebDriverManager = require("yahoo-arrow").webdrivermanager;

function MultiSessionsController(testConfig, testParams, driver) {
    Controller.call(this, testConfig, testParams, driver);

    this.logger = log4js.getLogger("MultiSessionsController");
}

util.inherits(MultiSessionsController, Controller);

MultiSessionsController.prototype.execute = function (callback) {
    var self = this,
        params = this.testParams;

    try {
        // we need to use SeleniumDriver::executeTest() in this controller, so we need run this test with driver: selenium 
        webdriver_builtin = self.driver.getWebDriver();
        if (!webdriver_builtin) {
            callback("This controller is only supported for the selenium driver");
            return;
        }

        // you can create more webdrivers here
        // if you are not using the default selenium host, you would need to pass seleniumHost url to WebDriverManager constructor
        // var webdriver_manager = new WebDriverManager(seleniumHost);
        var webdriver_manager = new WebDriverManager();

        var webdriver1 = webdriver_manager.createWebDriver({browserName: "chrome"});
        var webdriver2 = webdriver_manager.createWebDriver({browserName: "firefox"});

        // then you can do selenium session interaction here
        // ...
        webdriver1.get(params.page1);
        webdriver2.get(params.page2);

        //do some operation on page A
        //webdriver1.by...click();

        //verify on page B
        params.test = "../test-title.js";
        params.title= "Google";
        self.driver.executeTest(self.testConfig, params, function(error, report) {}, webdriver1);

        //do some operation on page B
        //webdriver2.by...click();

        params.test = "../test-title.js";
        params.title= "Welcome to Facebook - Log In, Sign Up or Learn More";
        self.driver.executeTest(self.testConfig, params, function(error, report) {}, webdriver2);


        setTimeout(function () {
                webdriver1.quit();
                webdriver2.quit();
                callback();
            }, 15000
        );
    } catch (e) {
        self.logger.error(e.toString());
        callback(e);
    }
};

module.exports = MultiSessionsController;
