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
 * @param testDataPath - Path of the test descriptor
 * @param cwd - Path of current working directory
 * @param group - Group
 * @param descriptorJson
 * @returns {*}
 */
ImportManager.prototype.processImportDescriptor = function(testDataPath, cwd, group, descriptorJson) {


    var
        self = this,
        importedDescriptorJsonStr,
        importedDescriptorJson,
        importedDescriptorJson,
        importingDescRelPath = '',
        testObj = {},
        importJson,
        importedDescriptorArr,
        importTest,
        importGroup,
        importedDescPath,
        commonLib,
        resolvedCommonLib = '';

    try {

        // Retain regular tests
        if (descriptorJson[0] && descriptorJson[0].dataprovider) {
            for (var key in descriptorJson[0].dataprovider) {
                testObj[key] = descriptorJson[0].dataprovider[key];
            }
        }

        importedDescriptorArr = descriptorJson[0].importDescriptor;

        if (importedDescriptorArr) {

            for (var i = 0; i < importedDescriptorArr.length; i+=1) {

                // Resolve paths
                importingDescRelPath= path.dirname(testDataPath);

                // TODO - Show warning or exit ??
                // TODO - To have path as mandatory and fail it during schema check ??
                // Show warning if path is not defined and continue
                if (!importedDescriptorArr[i].path) {
                    self.logger.warn('Please specify path in ' + testDataPath + ' to import tests. Ignoring !!!');
                    continue;
                }
                importedDescPath = path.dirname(path.join(importingDescRelPath, importedDescriptorArr[i].path));
                self.logger.debug('Importing from :' + importedDescPath);

                importedDescriptorJsonStr = fs.readFileSync(path.join(cwd, importingDescRelPath, importedDescriptorArr[i].path), "utf-8");
                importTest = importedDescriptorArr[i].importTest;
                importGroup = importedDescriptorArr[i].importGroup;

                importedDescriptorJson = JSON.parse(importedDescriptorJsonStr);

                importJson = importedDescriptorJson[0];

                commonLib = importJson.commonlib;

                // Resolve commonLib
                resolvedCommonLib += self.getResolvedCommonLib(commonLib, importedDescPath);

                // Add tests
                if (importJson && importJson.dataprovider) {

                    for (var key in importJson.dataprovider) {

                        if (self.addTest(importTest, importGroup, importJson,key)) {
                            testObj[key] = importJson.dataprovider[key];
                            testObj[key].group = group;
                            testObj[key].relativePath = importedDescPath; // Set relative path for imported descriptor
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

    }
    catch(e) {
        this.logger.error('Error in importing descriptor while processing the descriptor ' + testDataPath + ', Error is:' + e);
    }

    return descriptorJson;

}

/**
 * Determine if test needs to be added based on test name or test group. Import all tests by default
 * @param importTest
 * @param importGroup
 * @param importJson
 * @param testName
 * @returns {boolean}
 */
ImportManager.prototype.addTest = function(importTest,importGroup,importJson,testName){

    if (importTest && importTest.length > 0) { // Tests take precedence over group
        if (importTest.indexOf(testName) > -1) {
            return true;
        }
    } else if (importGroup) { // Import group
        if (importJson.dataprovider[testName].group && importJson.dataprovider[testName].group.indexOf(importGroup) > -1){
            return true;
        }
    } else { // Import everything
        return true;
    }

}

/**
 *
 * @param commonLib
 * @param relPathDirName
 * @returns {string}
 */
ImportManager.prototype.getResolvedCommonLib = function(commonLib, relPathDirName){

    var
        commonLibArr,
        i,
        self = this,
        resolvedCommonLib = '';

    if (commonLib) {

        commonLibArr = commonLib.split(',');

        for (i = 0; i < commonLibArr.length; i+=1 ) {

            self.logger.debug('For library ' + commonLibArr[i] + ', actual path is : ' + path.resolve(relPathDirName,commonLibArr[i]));
            resolvedCommonLib += (path.resolve(relPathDirName,commonLibArr[i]));

            if (i < commonLibArr.length - 1) {
                resolvedCommonLib += ',';
            }

        }

    }

    return resolvedCommonLib;


}

module.exports = ImportManager;