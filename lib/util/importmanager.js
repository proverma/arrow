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
 * @param testDataPath
 * @param cwd
 * @param group
 * @param descriptorJson
 * @returns {*}
 */
ImportManager.prototype.processImportDescriptor = function(testDataPath, cwd, group, descriptorJson) {


    var
        self = this,
        importedDescriptorJsonStr,
        importedDescriptorJson,
        importedDescriptorJson,
        relativePath = '',
        testObj = {},
        importJson,
        importedDescriptorArr = descriptorJson[0].importDescriptor,
        importTest,
        importGroup,
        addTest,
        relImportPath,
        relPathDirName,
        commonLib,
        resolvedCommonLib,
        commonLibArr;

    try {

        self.logger.debug('Testdata path::' + testDataPath);
        self.logger.debug('cwd::' + cwd);
        self.logger.debug('group::' + group);

        // Retain regular tests
        if (descriptorJson[0] && descriptorJson[0].dataprovider) {
            for (var key in descriptorJson[0].dataprovider) {
                testObj[key] = descriptorJson[0].dataprovider[key];
            }
        }
        importedDescriptorArr = descriptorJson[0].importDescriptor;

        if (importedDescriptorArr) {

            for (var i = 0; i < importedDescriptorArr.length; i+=1) {
                relativePath = path.dirname(testDataPath);
                relPathDirName = path.dirname(path.join(relativePath, descriptorJson[0].importDescriptor[i].path));
                self.logger.debug('relativePath:' + relativePath);
//                self.logger.debug('descriptorJson[0].importDescriptor[i].path:' + descriptorJson[0].importDescriptor[i].path);

                importedDescriptorJsonStr = fs.readFileSync(path.join(cwd, relativePath, descriptorJson[0].importDescriptor[i].path), "utf-8");
                relImportPath = path.dirname(descriptorJson[0].importDescriptor[i].path);

                if (cwd) {
                    relativePath = path.join(cwd, relativePath);
                }
                relImportPath = path.join(relativePath,relImportPath);
//                self.logger.debug('relImportPath:' + relImportPath);
                importTest = descriptorJson[0].importDescriptor[i].importTest;
                importGroup = descriptorJson[0].importDescriptor[i].importGroup;
                self.logger.debug('5');
                importedDescriptorJson = JSON.parse(importedDescriptorJsonStr);

                importJson = importedDescriptorJson[0];
                commonLib = importJson.commonlib;

                // Resolve common libs
                if (commonLib) {

                    resolvedCommonLib = '';
                    commonLibArr = commonLib.split(',');
                    for (var i = 0; i < commonLibArr.length; i+=1 ) {

                        self.logger.debug('For library ' + commonLibArr[i] + ', actual path is : ' + path.resolve(relPathDirName,commonLibArr[i]));
                        resolvedCommonLib += (path.resolve(relPathDirName,commonLibArr[i]));

                        if (i < commonLibArr.length - 1) {
                            resolvedCommonLib += ',';
                        }

                    }

                }
                if (importJson && importJson.dataprovider) {

                    for (var key in importJson.dataprovider) {

                        addTest = false;

                        if (importTest && importTest.length > 0) { // Tests take precedence over group
                            if (importTest.indexOf(key) > -1) {
                                addTest = true;
                            }
                        } else if (importGroup) { // Import group
                            if (importJson.dataprovider[key].group && importJson.dataprovider[key].group.indexOf(importGroup) > -1){
                                addTest = true;
                            }
                        } else { // Import everything
                            addTest = true;
                        }

                        if (addTest === true) {
                            testObj[key] = importJson.dataprovider[key];
                            testObj[key].group = group;
                            testObj[key].relativePath = relPathDirName; // Set relative path for imported descriptor
                        }

                    }
                }

            }
        }

        descriptorJson[0].dataprovider = testObj;
        self.logger.debug('descriptorJson[0].commonlib 1::' + descriptorJson[0].commonlib);
        if (resolvedCommonLib) {
            descriptorJson[0].commonlib = descriptorJson[0].commonlib + ',' + resolvedCommonLib;
        }

        delete descriptorJson[0]['importDescriptor'];


    }
    catch(e) {
        console.log(e);
        this.logger.error('Error in processing import descriptor XXx ' + e);
    }

    return descriptorJson;

}


module.exports = ImportManager;