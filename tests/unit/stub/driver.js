/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var DriverReportStack = require(__dirname +  "../../../../lib/util/reportstack");


// Drivers provide abstraction to control the browsers
function Driver() {

    this.webdriver = null;
    this.reports = new DriverReportStack();
}

Driver.prototype.getWebDriver = function () {
    return this.webdriver;
};

Driver.prototype.navigate = function (page, cb) {
    if (this.webdriver) {
        cb();
    } else {
        cb("Navigation is only supported with the webdriver");
    }
};

Driver.prototype.executeAction = function (config, params, cb) {
    cb();
};

Driver.prototype.executeTest = function (config, params, cb) {
    cb();
};

module.exports = Driver;

