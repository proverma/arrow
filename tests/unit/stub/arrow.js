/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

function Arrow(config, args) {
    this.controllers = [];
}

Arrow.prototype.runController = function (controllerName, testConfig, testParams, driver, callback) {
    this.controllers.push({controller: controllerName, params: testParams});
    callback(testParams.error);
};

module.exports = Arrow;

