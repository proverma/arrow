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
}

DataProvider.prototype.getTestData = function () {
    var descriptorJson,
        baseUrl,
        pos,
        dimensionsJson,
        contextObj,
        debug = false,
        descriptor,
        descriptorSchema,
        report,
        baseJson,
        relativePath = '';

    this.logger.debug('Loading descriptor file: ' + this.testDataPath);
    descriptorJson = JSON.parse(fs.readFileSync(this.testDataPath, "utf-8"));
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

    debug = false;
    descriptor = ycb.read(descriptorJson, contextObj, false, debug);

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

