
var util = require("util");
var log4js = require("yahoo-arrow").log4js;
var Controller = require("yahoo-arrow").controller;

function ProxyCustomController(testConfig,args,driver) {
    Controller.call(this, testConfig,args,driver);

    this.logger = log4js.getLogger("ProxyCustomController");
}
util.inherits(ProxyCustomController, Controller);
ProxyCustomController.prototype.execute = function(callback) {
    var self = this;

    if(this.driver.webdriver){

        var page = this.testParams.page;
        var webdriver = this.driver.webdriver;

        webdriver.get(page);
        //get value of global.proxyManager.record

        webdriver.waitForElementPresent(webdriver.By.css(".title")).then(function() {
            var record= JSON.stringify(global.proxyManager.record);
            console.log(record);
            self.testParams.proxyManagerRecord=record;
            self.testParams.page=null;
            self.driver.executeTest(self.testConfig, self.testParams, function(error, report) {
                callback(error);
            });

        });
    }else{
        this.logger.fatal("Custom Controllers are currently only supported on Selenium Browsers");
        callback("Custom Controllers are currently only supported on Selenium Browsers");
    }
}

module.exports = ProxyCustomController;