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
  * @param relativePath
 * @param descriptorJson
 * @returns {config}
 */
DataDriverManager.prototype.getConfigData = function (relativePath, descriptorJson) {

    var dataDriver,
        dataDriverObj,
        self = this,
        proc = self.mock || process,
        dataDriverPath,
        configData;


    if (descriptorJson[0].dataDriver) {

        try {
            dataDriverPath = path.resolve(global.workingDirectory, relativePath, descriptorJson[0].dataDriver);
            dataDriver = fs.readFileSync(dataDriverPath, "utf-8");
            dataDriverObj = JSON.parse(dataDriver);
        } catch (e) {
            self.logger.error('Error in getting config data from ' + dataDriverPath + ', error :' + e);
            proc.exit(1);
        }
        configData = dataDriverObj.config;

    } else if (descriptorJson[0].config && descriptorJson[0].config.length > 0) {
        configData = descriptorJson[0].config;
    }

    return configData;

};

/**
 *
 * @param testDataPath
 * @param descriptorJson
 * @returns {Array}
 */
DataDriverManager.prototype.processDataDriver = function (testDataPath, descriptorJson) {

    var
        baseConfigArr,
        self = this,
        descriptorArr = [],
        proc = self.mock || process,
        relativePath = path.dirname(testDataPath),
        i,
        descJson;

    baseConfigArr = self.getConfigData(relativePath, descriptorJson);

    if (baseConfigArr && baseConfigArr.length > 0) {

        // Error out if duplicate keys exist in config data
        try {
            self.checkForDuplicateKeys(baseConfigArr);
        }
        catch(e) {
            self.logger.error('Error while processing data driver for the descriptor:' + testDataPath + ' , Error ::' + e.message);
            proc.exit(1);
        }

        // Iterate per config in the base config array
        for (i = 0; i < baseConfigArr.length; i += 1) {

            descJson = clone(descriptorJson);

            for (var key in baseConfigArr[i]) {

                // Set configuration for first element ( with  "settings": [ "master" ] )
                var baseConfObj = baseConfigArr[i][key];
                descJson[0]['config'] = baseConfObj
                descJson[0]['dataDriverKey'] = key;

                // Set configuration for rest of the elements ( with "settings": [ "environment:testing" ] for e.g )
                for (var j = 1; j < descJson.length; j+=1) {

                    var configArr = descJson[j].config;

                    if (configArr && configArr instanceof Array) {
                        var confObj = getObjectForKey(configArr, key);
                        descJson[j]['config'] = (confObj ? confObj : baseConfObj);
                    }
                }

            }

            descriptorArr.push(descJson);
        }

        /**
         *
         *
         * If the input array is as below and key passed is "sports",
         * [
         {
             "news": {
                 "baseUrl"   : "https://news.yahoo.com/",
                 "placeCls"  : "lt",
                 "appCls"    : "gta-news"
             }
         },
         {
             "sports": {
                 "baseUrl" : "https://sports.yahoo.com/",
                 "placeCls"  : "lt",
                 "appCls"    : "gta-news"
             }
         }
         ]

         it returns
         {
                 "baseUrl" : "https://sports.yahoo.com/",
                 "placeCls"  : "lt",
                 "appCls"    : "gta-news"
             }

         * @param jsonArr
         * @param key
         * @returns {*}
         */
        function getObjectForKey(jsonArr, key) {

            if (jsonArr && jsonArr instanceof Array) {

                for (var i = 0 ; i < jsonArr.length; i+=1) {

                    for (var k in jsonArr[i]) {
                        if (key === k) {
                            return jsonArr[i][k];
                        }
                    }
                }

            }
        }

    } else {
        self.logger.error('No configuration data found for the data driven descriptor..' + testDataPath);
        proc.exit(1);
    }
    return descriptorArr;

};

/**
 * Checks for duplicate keys in the data driver.
 * Exits with error message if finds duplicate keys
 * @param configArr
 */
DataDriverManager.prototype.checkForDuplicateKeys = function (configArr) {

    var key,
        keysArr = [],
        self = this;

        for (var i = 0 ;i < configArr.length; i+=1 ) {

            for (key in configArr[i]) {
                if (keysArr.indexOf(key) > -1) {
                    throw new Error("Invalid data for data driven descriptor. Duplicate key '" + key + "' in the object " + JSON.stringify(configArr[i]));
                } else {
                    keysArr.push(key);
                }
            }
        }

};

module.exports = DataDriverManager;