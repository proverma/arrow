/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


var util = require("util");
var log4js = require("../../../../../index").log4js;
var Controller = require("../../../../../index").controller;

function SearchCustomController(testConfig,args,driver) {
    Controller.call(this, testConfig,args,driver);

    this.logger = log4js.getLogger("SearchCustomController");
}

/*
 * All controllers MUST implement the Controller interface
 */
util.inherits(SearchCustomController, Controller);


/**
 * In the execute method you get full access to webdriver's methods
 * Additionally, you can get a handle to the parameters in your descriptor
 * file by using this.testParams
 *
 * Lastly, in this case, the last statement is to execute the test
 * You'll note executeTest includes the same parameters as Arrow's CLI
 */
SearchCustomController.prototype.execute = function(callback) {
    var self = this;

    if(this.driver.webdriver){

        //Get the various parameters needed from the Test Descriptor file
        var page = this.testParams.page;

        //Get a handle of the WebDriver Object
        var webdriver = this.driver.webdriver;

        //Get 1st suggestion
        webdriver.findElement(webdriver.By.xpath('//*[@id="suggestions"]/li[1]')).getText().then(function (text) {
            self.logger.info("Suggestion: " + text);
            self.testParams.shared = {"suggestion": text};

            webdriver.findElement(webdriver.By.xpath('//*[@id="suggestions"]/li[1]/a')).click();
            callback();
        });
    } else {
        this.logger.fatal("Custom Controllers are currently only supported on Selenium Browsers");
    }
}

module.exports = SearchCustomController;
