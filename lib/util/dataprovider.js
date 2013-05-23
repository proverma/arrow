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
    this.replaceParamJSON= this.config.replaceParamJSON;

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
        relativePath = '',
        replaceParam,
        replaceParamJson,
        replaceParamPath,
        replaceKey,
        descriptorJsonStr,
        key,
        REPLACE_CHARACTER_START = "${",
        REPLACE_CHARACTER_END = "}$";

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

    if (this.replaceParamJSON) {
        descriptorJsonStr = JSON.stringify(descriptor);
        if (this.replaceParamJSON.indexOf(".json") > 0) {
            replaceParamPath = path.resolve(global.workingDirectory, this.replaceParamJSON);
            replaceParam = fs.readFileSync(replaceParamPath, "utf-8");

        } else {
            replaceParam = this.replaceParamJSON;
        }
        try {
            replaceParamJson = JSON.parse(replaceParam);
        } catch (msg) {
            this.logger.error(replaceParam + " is not a valid JSON");
            this.logger.error(msg);
            process.exit(1);
        }

        this.logger.debug("Replace Param JSON :" + JSON.stringify(replaceParamJson));
        for (key in replaceParamJson) {
            replaceKey = REPLACE_CHARACTER_START + key + REPLACE_CHARACTER_END;
            do {
                descriptorJsonStr = descriptorJsonStr.replace(replaceKey, replaceParamJson[key]);
            } while (descriptorJsonStr.indexOf(replaceKey) !== -1);
        }

        descriptor = JSON.parse(descriptorJsonStr);

    }


    descriptorSchema = JSON.parse(fs.readFileSync(this.config["arrowModuleRoot"] + "config/descriptor-schema.json", "utf-8"));

    report = JSV.createEnvironment().validate(descriptor, descriptorSchema);

    if (report.errors.length > 0) {
        this.logger.fatal("Error : " + this.testDataPath + " failed Schema Test !");
        this.logger.info(report.errors);
        return null;
    }

    return descriptor;
};

module.exports = DataProvider;

