/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*
 * Copyright (c) 2014, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var log4js = require("log4js");
var fs = require("fs");
var clone = require("clone");
var path = require("path");

/**
 *
 * @constructor
 */
function DataDriverManager() {
    this.logger = log4js.getLogger("DataDriverManager");
}

/**
 *
 * @param relativePath
 * @param descriptorJson
 * @returns {config}
 */
DataDriverManager.prototype.getConfigData = function (relativePath, descriptorJson) {

    var dataDriver,
        dataDriverObj,
        self = this,
        proc = self.mock || process,
        dataDriverPath;


    if(descriptorJson[0].dataDriver){

        try {
            dataDriverPath = path.resolve(global.workingDirectory,relativePath, descriptorJson[0].dataDriver);
            dataDriver = fs.readFileSync(dataDriverPath, "utf-8");
            dataDriverObj = JSON.parse(dataDriver);
        } catch (e) {
            self.logger.error('Error in getting config data from ' + dataDriverPath + ', error :' + e);
            proc.exit(1);
        }
        return dataDriverObj.config;

    } else if (descriptorJson[0].config && descriptorJson[0].config.length > 0) {
        return descriptorJson[0].config;
    }

};

/**
 *
 * @param dataDriverPath - Path of data driver
 * @param descriptorJson - JSON object
 */


/**
 *
 * @param relativePath
 * @param descriptorJson
 * @returns {Array}
 */
DataDriverManager.prototype.processDataDriver = function (relativePath, descriptorJson) {

    var
        dataDriver,
        configArr,
        self = this,
        descriptorArr = [];

    configArr = self.getConfigData(relativePath, descriptorJson);

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