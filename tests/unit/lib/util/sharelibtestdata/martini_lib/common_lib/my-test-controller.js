
/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


var util = require("util");
var log4js = require("yahoo-arrow").log4js;
var Controller = require("yahoo-arrow").controller;

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
        callback("webdriver is accessable");
    }else{
        callback("webdriver is not accessable");
    }
}

module.exports = MyTestController;
