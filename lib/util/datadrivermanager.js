/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*
 * Copyright (c) 2014, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var log4js = require("log4js");
var fs = require("fs");
var clone = require("clone");

/**
 *
 * @constructor
 */
function DataDriverManager() {
    this.logger = log4js.getLogger("DataDriverManager");
}

/**
 *
 * @param dataDriverPath - Path of data driver
 * @param descriptorJson - JSON object
 */
DataDriverManager.prototype.processDataDriver = function (dataDriverPath, descriptorJson) {

    var
        dataDriverObj,
        dataDriver,
        configArr,
        self = this,
        descriptorArr = [];

    try {
        dataDriver = fs.readFileSync(dataDriverPath, "utf-8");
        dataDriverObj = JSON.parse(dataDriver);

    } catch (e) {
        self.logger.error('Error in processing data driven descriptor ' + e);
        process.exit(1);
    }

    configArr = dataDriverObj.config;

    if (configArr && configArr.length > 0) {

        for (var i = 0; i < configArr.length; i += 1) {

            var descJson = clone(descriptorJson);
            descJson[0].config = configArr[i];
            descJson[0].name += ( ' - ' + i);
            delete descJson[0]['dataDriver'];

            descriptorArr.push(descJson);
        }

    }

    return descriptorArr;

};

module.exports = DataDriverManager;