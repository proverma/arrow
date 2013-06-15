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

function DataProvider(config, testDataPath) {
    this.logger = log4js.getLogger("DataProvider");
    this.testDataPath = testDataPath;
    this.config = config;

    this.dimensions = this.config.dimensions;
    this.context = this.config.context;
    this.replaceParamJSON = this.config.replaceParamJSON;
    this.defaultParamJSON = this.config.defaultParamJSON;

}

module.exports = DataProvider;

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
        descriptorJsonStr;

    this.logger.debug('Loading descriptor file: ' + this.testDataPath);
    descriptorJsonStr = fs.readFileSync(this.testDataPath, "utf-8");

    descriptorJson = JSON.parse(descriptorJsonStr);

    baseUrl = this.config["baseUrl"];
    // inject baseUrl into the settings
    if (baseUrl && baseUrl.length > 0) {
        for (pos = 0; pos < descriptorJson.length; pos += 1) {
            if (descriptorJson[pos].settings) {
                if (!descriptorJson[pos].config) { descriptorJson[pos].config = {}; }
                descriptorJson[pos].config.baseUrl = baseUrl;
            }
        }
    }

    relativePath = this.testDataPath.substring(0, this.testDataPath.lastIndexOf(global.pathSep));

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
    descriptorJson.unshift(dimensionsJson[0]);

    // read context into object
    contextObj = qs.parse(this.context, ",", ":");

    try {
        descriptor = ycb.read(descriptorJson, contextObj, false, false);
    } catch (e) {
        this.logger.error("YCB Variable Replacement Failed, Please check you descriptor file.");
        this.logger.error(e);
        process.exit(1);
    }
//    console.log('**Before replacing descriptor:' + JSON.stringify(descriptor));
    descriptor = this.getDescriptorWithReplacedParams(descriptor);

    descriptorSchema = JSON.parse(fs.readFileSync(this.config["arrowModuleRoot"] + "config/descriptor-schema.json", "utf-8"));

    report = JSV.createEnvironment().validate(descriptor, descriptorSchema);

    if (report.errors.length > 0) {
        this.logger.fatal("Error : " + this.testDataPath + " failed Schema Test !");
        this.logger.info(report.errors);
        return null;
    }
    console.log('**Final descriptor:' + JSON.stringify(descriptor));
    return descriptor;
};

DataProvider.prototype.getDescriptorWithReplacedParams = function (descriptor) {

    var
        replaceParamJson,
        defaultParamJson,
        combinedParamJson,
        keyArr = [],
        i,
        replaceKey,
        descriptorJsonStr,
        key,
        REPLACE_CHARACTER_START = "${",
        REPLACE_CHARACTER_END = "}$";


    function readAndValidateJSON(paramJSON) {

        var paramPath,
            param,
            paramJson;

        if (paramJSON.indexOf(".json") > 0) {
            paramPath = path.resolve(global.workingDirectory, paramJSON);
            param = fs.readFileSync(paramPath, "utf-8");
        } else {
            param = paramJSON;
        }

        try {
            paramJson = JSON.parse(param);
        } catch (msg) {
            this.logger.error(paramJSON + "is not a valid JSON");
            this.logger.error(msg);
            process.exit(1);
        }
        return paramJson;

    }

    // Combine the properties from default param json & replace param json before actual replacement
    // Override property from replace param json

    combinedParamJson = {};

    if (this.defaultParamJSON || this.replaceParamJSON) {

        if (this.defaultParamJSON) {
            defaultParamJson = readAndValidateJSON(this.defaultParamJSON);
            combinedParamJson = defaultParamJson;
            this.logger.debug("Default Param JSON :" + JSON.stringify(defaultParamJson));
        }

        if (this.replaceParamJSON) {
            replaceParamJson = readAndValidateJSON(this.replaceParamJSON);
            this.logger.debug("Replace Param JSON :" + JSON.stringify(replaceParamJson));
        }

        for (key in replaceParamJson) {

            // Override the value of the property, if found if its found in default params too
            // else store the key to add later in replace param
            if (defaultParamJson && defaultParamJson[key]) {
                combinedParamJson[key] = replaceParamJson[key];
            } else {
                keyArr.push(key);
            }
        }

        // Add those keys found in replace param but not in default param
        for (i = 0; i < keyArr.length; i += 1) {
            combinedParamJson[keyArr[i]] = replaceParamJson[keyArr[i]];
        }

        replaceParamJson = combinedParamJson;

        descriptorJsonStr = JSON.stringify(descriptor);
//        this.logger.debug("Descriptor JSON :" + JSON.stringify(descriptor));

        this.logger.debug("Replace Param JSON :" + JSON.stringify(replaceParamJson));
        for (key in replaceParamJson) {
            replaceKey = REPLACE_CHARACTER_START + key + REPLACE_CHARACTER_END;
            do {
                descriptorJsonStr = descriptorJsonStr.replace(replaceKey, replaceParamJson[key]);
            } while (descriptorJsonStr.indexOf(replaceKey) !== -1);
        }

        descriptor = JSON.parse(descriptorJsonStr);
//        console.log('***Descriptor::' + descriptorJsonStr);


    }

    return descriptor;

}

