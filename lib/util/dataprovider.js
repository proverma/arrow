/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var log4js = require("log4js");
var os = require('os');
var fs = require("fs");
var qs = require('querystring');
var JSV = require("JSV").JSV;
var ycb = require('ycb');
var path = require('path');
var glob = require('glob');
var ErrorManager = require("../util/errormanager"), em = ErrorManager.getInstance();

function DataProvider(config, testDataPath) {

    this.logger = log4js.getLogger("DataProvider");
    this.testDataPath = testDataPath;
    this.config = config;

    this.dimensions = this.config.dimensions;
    this.context = this.config.context;
    this.replaceParamJSON = this.config.replaceParamJSON;
    this.defaultParamJSON = this.config.defaultParamJSON;
}

DataProvider.prototype.getTestData = function () {

    var descriptorJson,
        baseUrl,
        pos,
        dimensionsJson,
        contextObj,
        descriptor,
        descriptorSchema,
        report,
        baseJson,
        relativePath,
        descriptorJsonStr,
        proc = this.mock || process,
        match,
        self = this,
        importDescriptor;

//    console.log('\n****In getTestData, self::' + JSON.stringify(self) + '\n\n');
    self.logger.debug('Loading descriptor file: ' + this.testDataPath);
    descriptorJsonStr = fs.readFileSync(this.testDataPath, "utf-8");
    descriptorJson = JSON.parse(descriptorJsonStr);
    relativePath = self.testDataPath.substring(0, self.testDataPath.lastIndexOf(global.pathSep));
    importDescriptor = descriptorJson[0].importDescriptor;

    // read context into object
    contextObj = qs.parse(this.context, ",", ":");

    if (importDescriptor) {
//        console.log('\n\nTo resolved imported descriptors');
        descriptorJson = this.processImportDescriptor(descriptorJson, contextObj);
//        console.log('\n\nimportedDescriptorJson::' + JSON.stringify(importedDescriptorJson) + '\n\n');
//        console.log('\n\n****Resolved descriptor after import:: \n' + JSON.stringify(descriptorJson) + '\n\n');
    }

    baseUrl = self.config["baseUrl"];

    // inject baseUrl into the settings
    if (baseUrl && baseUrl.length > 0) {
        for (pos = 0; pos < descriptorJson.length; pos += 1) {
            if (descriptorJson[pos].settings) {
                if (!descriptorJson[pos].config) { descriptorJson[pos].config = {}; }
                descriptorJson[pos].config.baseUrl = baseUrl;
            }
        }
    }

    //checking if descriptor is extending another json
    if (descriptorJson[0].extends) {

        // Resolve path
        descriptorJson[0].extends = path.resolve(global.workingDirectory,
            relativePath, descriptorJson[0].extends);

        baseJson = JSON.parse(fs.readFileSync(descriptorJson[0].extends));
        descriptorJson = descriptorJson.concat(baseJson);
    }

    // merge dimension into descriptor
    dimensionsJson = JSON.parse(fs.readFileSync(this.dimensions, "utf-8"));
//    console.log('\n\n****this.dimensions::' + this.dimensions + '\n');
//    console.log('\n\n****dimensionsJson::' + JSON.stringify(dimensionsJson) + '\n');
    descriptorJson.unshift(dimensionsJson[0]);
//    console.log('\n\n****DescriptorJson 2::' + JSON.stringify(descriptorJson));

//    console.log('\n\n****Before ycb::' + JSON.stringify(descriptorJson));

    try {
        descriptor = ycb.read(descriptorJson, contextObj, false, false);
    } catch (e) {
        if (e.message) {
            match = e.message.match(/The settings group '(\{"environment":"([\w\W]*?)"\})' has already been added/);
            if (match) {
                em.errorLog(1003, match[1], match[2], self.dimensions, self.testDataPath);
            } else {
                em.errorLog(1005, self.testDataPath, e.message);
            }
        }
        proc.exit(1);
    }

//    console.log('\n\n****After ycb::' + JSON.stringify(descriptor));

    // Replace params in the descriptor , if user has passed either of replaceParamJSON or defaultParamJSON
    if (this.replaceParamJSON || this.defaultParamJSON) {
        descriptor = this.getDescriptorWithReplacedParams(descriptor);
    }
//    console.log('\n\n****DescriptorJson 4::' + JSON.stringify(descriptor));

    descriptorSchema = JSON.parse(fs.readFileSync(self.config["arrowModuleRoot"] + "config/descriptor-schema.json", "utf-8"));

    report = JSV.createEnvironment().validate(descriptor, descriptorSchema);

    if (report.errors.length > 0) {
        self.logger.fatal("Error : " + self.testDataPath + " failed Schema Test !");
        self.logger.info(report.errors);
        proc.exit(1);
    }
//    console.log('\n\n****Final Descriptor::' + JSON.stringify(descriptor));
//    console.log('\n\n');
    return descriptor;
};

/**
 * Process importing descriptors
 * @param descriptor
 * @returns {*}
 */
DataProvider.prototype.processImportDescriptor = function(descriptor, contextObj) {

    var
        importedDescriptorJsonStr,
        importedDescriptorJson,
        self = this,
        match,
        dimensionsJson,
        importedDescriptorJson,
        proc = this.mock || process,
        baseUrl = self.config["baseUrl"],
        relativePath;

    try {
        relativePath = self.testDataPath.substring(0, self.testDataPath.lastIndexOf(global.pathSep));
        importedDescriptorJsonStr = fs.readFileSync(path.resolve(global.workingDirectory,
            relativePath,descriptor[0].importDescriptor.path), "utf-8");

        console.log('\n\ndescriptor 111..' + JSON.stringify(descriptor) + '\n\n');
        importedDescriptorJson = JSON.parse(importedDescriptorJsonStr);

//        importedDescriptorJson = importedDescriptorJson[0]; // TODO - Remove this.. just for testing..To iterate over all array elements

        if (baseUrl && baseUrl.length > 0) {
            for (pos = 0; pos < importedDescriptorJson.length; pos += 1) {
                if (importedDescriptorJson[pos].settings) {
                    if (!importedDescriptorJson[pos].config) { importedDescriptorJson[pos].config = {}; }
                    importedDescriptorJson[pos].config.baseUrl = baseUrl;
                }
            }
        }

        dimensionsJson = JSON.parse(fs.readFileSync(self.dimensions, "utf-8"));
//        console.log('\n\ndimensionsJson ::' + JSON.stringify(dimensionsJson[0]));

        importedDescriptorJson.unshift(dimensionsJson[0]);

        console.log('\n\n****Before ycb in processImportDescriptor::' + JSON.stringify(importedDescriptorJson));

        try {
            importedDescriptorJson = ycb.read(importedDescriptorJson, contextObj, false, false);
        } catch (e) {
            if (e.message) {
                match = e.message.match(/The settings group '(\{"environment":"([\w\W]*?)"\})' has already been added/);
                if (match) {
                    em.errorLog(1003, match[1], match[2], self.dimensions, self.testDataPath);
                } else {
                    em.errorLog(1005, self.testDataPath, e.message);
                }
            }
            proc.exit(1);
        }

//        console.log('\n\n****After ycb in processImportDescriptor::' + JSON.stringify(importedDescriptorJson));

//        console.log('\n****In processImportDescriptor 1 ..importedDescriptorJsonStr dataprovider -' +
//            JSON.stringify(importedDescriptorJson[0].dataprovider) + '\n\n');

//        console.log('\n\ndescriptor 222..' + JSON.stringify(descriptor) + '\n\n');
//        console.log('\n\ndescriptor 222..' + JSON.stringify(descriptor[0].dataprovider) + '\n\n');

        var testObj = {};

        //TODO - What if the test names are the same ??

        if (descriptor[0] && descriptor[0].dataprovider) {
            for (var key in descriptor[0].dataprovider) {
                testObj[key] = descriptor[0].dataprovider[key];
            }
        }

        if (importedDescriptorJson && importedDescriptorJson.dataprovider) {
            for (var key in importedDescriptorJson.dataprovider) {
                testObj[key] = importedDescriptorJson.dataprovider[key];
            }
        }

        descriptor[0].dataprovider = testObj;

        delete descriptor[0]['importDescriptor'];

    }
    catch(e) {
        console.log(e);
//        this.logger.error('Error in reading imported descriptor ' + descriptor[0].importDescriptor.path + ', ' + e);
    }

    return descriptor;

}

/**
 *
 * @param param
 * @return {*}
 */
DataProvider.prototype.readAndValidateJSON = function (param) {

    var paramPath,
        json,
        parsedJson,
        self = this;

    if (param) {
        if (param.indexOf(".json") > 0) {
            paramPath = path.resolve(global.workingDirectory, param);
            json = fs.readFileSync(paramPath, "utf-8");
        } else {
            json = param;
        }

        try {
            parsedJson = JSON.parse(json);
        } catch (msg) {
            self.logger.error(param + " is not a valid JSON");
            self.logger.error(msg);
            process.exit(1);
        }

    }
    return parsedJson;


};

/**
 * Returns the descriptor after replacing the parameters
 * @param descriptor
 * @return {*}
 */
DataProvider.prototype.getDescriptorWithReplacedParams = function (descriptor) {

    var
        replaceParamJson,
        defaultParamJson,
        combinedParamJson,
        replaceKey,
        descriptorJsonStr,
        key,
        REPLACE_CHARACTER_START = "${",
        REPLACE_CHARACTER_END = "}$",
        self = this;

    // Combine the properties from default param json & replace param json before actual replacement
    // Override property from replace param json

    // Get every property from replace param json
    if (this.replaceParamJSON) {
        replaceParamJson = self.readAndValidateJSON(self.replaceParamJSON);
        this.logger.debug("Replace Param JSON :" + JSON.stringify(replaceParamJson));
        combinedParamJson = replaceParamJson;
    }

    // Get those properties from default param json which are missing in replace param json
    if (this.defaultParamJSON) {
        defaultParamJson = self.readAndValidateJSON(self.defaultParamJSON);
        this.logger.debug("Default Param JSON :" + JSON.stringify(defaultParamJson));

        //If empty replaceParamJson is passed
        if (!combinedParamJson) {
            combinedParamJson = defaultParamJson;
        }

        for (key in defaultParamJson) {
            if (!combinedParamJson.hasOwnProperty(key)) {
                combinedParamJson[key] = defaultParamJson[key];
            }
        }
    }

    // Actual replacement
    if (combinedParamJson) {

        descriptorJsonStr = JSON.stringify(descriptor);

        self.logger.debug("Final Replace Param JSON :" + JSON.stringify(combinedParamJson));
        for (key in combinedParamJson) {
            replaceKey = REPLACE_CHARACTER_START + key + REPLACE_CHARACTER_END;
            do {
                descriptorJsonStr = descriptorJsonStr.replace(replaceKey, combinedParamJson[key]);
            } while (descriptorJsonStr.indexOf(replaceKey) !== -1);
        }

        descriptor = JSON.parse(descriptorJsonStr);

    }

    return descriptor;

};

module.exports = DataProvider;