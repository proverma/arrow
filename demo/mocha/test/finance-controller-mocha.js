/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


var util = require("util");
var log4js = require("yahoo-arrow").log4js;
var Controller = require("yahoo-arrow").controller;

function FinanceCustomController(testConfig, args, driver) {
    Controller.call(this, testConfig, args, driver);

    this.logger = log4js.getLogger("FinanceCustomController");
}

/*
 * All controllers MUST implement the Controller interface
 */
util.inherits(FinanceCustomController, Controller);


/**
 * In the execute method you get full access to webdriver's methods
 * Additionally, you can get a handle to the parameters in your descriptor
 * file by using this.testParams
 *
 * Lastly, in this case, the last statement is to execute the test
 * You'll note executeTest includes the same parameters as Arrow's CLI
 */
FinanceCustomController.prototype.execute = function(callback) {

    //Get the various parameters needed from the Test Descriptor file

    var self = this,
        txtLocator =  this.testParams.txtLocator,
        typeText =  this.testParams.typeText + "\n",
        page = this.testParams.page,
        webdriver;

    if (this.driver.webdriver) {

        //Get a handle of the WebDriver Object
        webdriver = this.driver.webdriver;

        //Open the page you want to test
        webdriver.get(page);
        webdriver.waitForElementPresent(webdriver.By.css(txtLocator));
        //Navigate the page as necessary
        webdriver.findElement(webdriver.By.css(txtLocator)).sendKeys(typeText);

        webdriver.waitForElementPresent(webdriver.By.css(".title")).then(function() {
            self.driver.executeTest(self.testConfig, self.testParams, function(error, report) {
                callback();
            });

        });
    } else {
        this.logger.fatal("Custom Controllers are currently only supported on Selenium Browsers");
        callback("Custom Controllers are currently only supported on Selenium Browsers");
    }
}

module.exports = FinanceCustomController;
