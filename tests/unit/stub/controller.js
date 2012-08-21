/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

function Controller(testConfig, testParams, driver) {
    this.testConfig = testConfig;
    this.testParams = testParams;
    this.driver = driver;
}

Controller.prototype.execute = function (callback) {
    callback(this.testParams.error);
};

module.exports = Controller;

