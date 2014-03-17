/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2014, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var log4js = require("log4js");
var path = require("path");
var fs = require("fs");

/**
 *
 * @constructor
 */
function ImportManager() {
    this.logger = log4js.getLogger("ImportManager");
}

/**
 *
 *
 * @param testDataPath - Path of the test descriptor
 * @param cwd - Path of current working directory
 * @param group - Group - group of tests to run , as passed from command line
 * @param descriptorJson
 * @returns {*}

 e.g
 To import the testnames - "test_to_import_1" and "test_to_import_2" from "tests/func/descriptor.json
 "importDescriptor":[
     {
         "path" : "tests/func/descriptor.json",
         "importTest":["test_to_import_1","test_to_import_2"]
     }

 ]

 or

 To import the tests with group "smoke" from "tests/func/descriptor.json
 "importDescriptor":[
 {
     "path" : "tests/func/descriptor.json",
     "importGroup":["smoke"]
 }

 To import ALL the tests "tests/func/descriptor.json
 "importDescriptor":[
 {
     "path" : "tests/func/descriptor.json"
 }

 ]

 */
ImportManager.prototype.processImportDescriptor = function(testDataPath, cwd, group, descriptorJson) {

    var
        self = this,
        importedDescriptorJsonStr,
        importedDescriptorJson,
        importingDescRelPath = '',
        testObj = {},
        importJson,
        importDescriptorArr,
        importTest,
        importGroup,
        importedDescPath,
        commonLib,
        resolvedCommonLib = '',
        testName,
        i;

    try {

        // Retain regular tests
        if (descriptorJson[0] && descriptorJson[0].dataprovider) {
            for (testName in descriptorJson[0].dataprovider) {
                testObj[testName] = descriptorJson[0].dataprovider[testName];
            }
        }

        importDescriptorArr = descriptorJson[0].importDescriptor;

        if (importDescriptorArr) {

            for (i = 0; i < importDescriptorArr.length; i += 1) {

                // Resolve paths
                importingDescRelPath = path.dirname(testDataPath);

                // Show warning if path is not defined and return, this will fail in schema validation
                if (!importDescriptorArr[i].path) {
                    self.logger.warn('Path not specified in ' + testDataPath + ' to import tests.');
                    return descriptorJson;
                }
                importedDescPath = path.dirname(path.join(importingDescRelPath, importDescriptorArr[i].path));
                self.logger.debug('Importing from :' + importedDescPath);

                importedDescriptorJsonStr = fs.readFileSync(path.join(cwd, importingDescRelPath, importDescriptorArr[i].path), "utf-8");
                importTest = importDescriptorArr[i].importTest;
                importGroup = importDescriptorArr[i].importGroup;

                importedDescriptorJson = JSON.parse(importedDescriptorJsonStr);

                importJson = importedDescriptorJson[0];

                commonLib = importJson.commonlib;

                // Resolve commonLib
                resolvedCommonLib += self.getResolvedCommonLib(commonLib, importedDescPath);

                // Add tests
                if (importJson && importJson.dataprovider) {

                    for (testName in importJson.dataprovider) {

                        if (self.addTest(importTest, importGroup, importJson, testName)) {
                            testObj[testName] = importJson.dataprovider[testName];
                            testObj[testName].group = group;
                            testObj[testName].relativePath = importedDescPath; // Set relative path for imported descriptor
                        }
                    }
                }
            }
        }

        descriptorJson[0].dataprovider = testObj;

        if (resolvedCommonLib) {
            descriptorJson[0].commonlib = descriptorJson[0].commonlib + ',' + resolvedCommonLib;
        }

        delete descriptorJson[0]['importDescriptor'];

    } catch (e) {
        this.logger.error('Error in importing descriptor while processing the descriptor ' + testDataPath + ', Error is:' + e);
    }

    return descriptorJson;

};

/**
 * Determine if test needs to be added based on test name or test group. Import all tests by default
 * @param importTest
 * @param importGroup
 * @param importJson
 * @param testName
 * @returns {boolean}
 */
ImportManager.prototype.addTest = function(importTest, importGroup, importJson, testName) {

    if (importTest && importTest.length > 0) { // Tests take precedence over group
        if (importTest.indexOf(testName) > -1) {
            return true;
        }
    } else if (importGroup) { // Import group
        if (importJson.dataprovider[testName].group && importJson.dataprovider[testName].group.indexOf(importGroup) > -1) {
            return true;
        }
    } else { // Import everything
        return true;
    }

};

/**
 *
 * @param commonLib
 * @param relPathDirName
 * @returns {string}
 */
ImportManager.prototype.getResolvedCommonLib = function(commonLib, relPathDirName) {

    var
        commonLibArr,
        i,
        self = this,
        resolvedCommonLib = '',
        resolvedPath;

    if (commonLib) {

        commonLibArr = commonLib.split(',');

        for (i = 0; i < commonLibArr.length; i += 1) {

            resolvedPath = path.resolve(relPathDirName, commonLibArr[i]);
            self.logger.debug('For library ' + commonLibArr[i] + ', actual path is : ' + resolvedPath);
            resolvedCommonLib += resolvedPath;

            if (i < commonLibArr.length - 1) {
                resolvedCommonLib += ',';
            }

        }

    }

    return resolvedCommonLib;


};

module.exports = ImportManager;