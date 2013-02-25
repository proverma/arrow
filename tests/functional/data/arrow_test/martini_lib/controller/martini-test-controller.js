
/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


var util = require("util");
var log4js=require('log4js');
var Controller = require("../../../../../../lib/interface/controller");

function MyTestController(testConfig,args,driver) {
    Controller.call(this, testConfig,args,driver);
    this.logger = log4js.getLogger("MyTestController");
}

/*
 * All controllers MUST implement the Controller interface
 */
util.inherits(MyTestController, Controller);


/**
 * In the execute method you get full access to webdriver's methods
 * Additionally, you can get a handle to the parameters in your descriptor
 * file by using this.testParams
 *
 * Lastly, in this case, the last statement is to execute the test
 * You'll note executeTest includes the same parameters as Arrow's CLI
 */
MyTestController.prototype.execute = function(callback) {
    var self = this;

    if(this.driver.webdriver){

        //Get the various parameters needed from the Test Descriptor file
        var txtLocator =  this.testParams.txtLocator;
        var typeText =  this.testParams.typeText;
        var btnLocator =  this.testParams.btnLocator;
        var page = this.testParams.page;

        //Get a handle of the WebDriver Object
        var webdriver = this.driver.webdriver;

        //Open the page you want to test
        webdriver.get(page).then(function() {
            self.logger.info(self.config);

            //Navigate the page as necessary
            webdriver.findElement(webdriver.By.css(txtLocator)).sendKeys(typeText);
            webdriver.findElement(webdriver.By.css(btnLocator)).click();
            self.testParams.page=null;
            webdriver.getTitle().then(function(title) {

                //Execute the test
                self.driver.executeTest(self.testConfig, self.testParams, function(error, report) {
                    callback();
                });
            });
        });
    }else{
        this.logger.fatal("Custom Controllers are currently only supported on Selenium Browsers");
    }
}

module.exports = MyTestController;
