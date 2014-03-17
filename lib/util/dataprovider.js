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
var ImportManager = require("../util/importmanager");
var ErrorManager = require("../util/errormanager"),
em = ErrorManager.getInstance();

function DataProvider(config, args, testDataPath) {

    this.logger = log4js.getLogger("DataProvider");
    this.testDataPath = testDataPath;
    this.config = config;
    this.args = args;

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
        importDescriptor,
        cwd = global.workingDirectory || process.cwd(),
        importManager = new ImportManager();

    self.logger.debug('Loading descriptor file: ' + this.testDataPath);

    descriptorJsonStr = fs.readFileSync(this.testDataPath, "utf-8");
    descriptorJson = JSON.parse(descriptorJsonStr);
    relativePath = path.dirname(self.testDataPath);
    importDescriptor = descriptorJson[0].importDescriptor;

    // read context into object
    contextObj = qs.parse(this.context, ",", ":");

    if (importDescriptor) {
        // We can read the descriptorJson from processImportDescriptor method too instead of passing from here
        // In future, if we need to manipulate the descriptorJson before we import, this will help
        descriptorJson = importManager.processImportDescriptor(self.testDataPath, cwd, self.args.group, descriptorJson);
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
        descriptorJson[0].extends = path.resolve(cwd,relativePath, descriptorJson[0].extends);

        baseJson = JSON.parse(fs.readFileSync(descriptorJson[0].extends));
        descriptorJson = descriptorJson.concat(baseJson);
    }

    // merge dimension into descriptor
    dimensionsJson = JSON.parse(fs.readFileSync(this.dimensions, "utf-8"));
    descriptorJson.unshift(dimensionsJson[0]);

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

    // Replace params in the descriptor , if user has passed either of replaceParamJSON or defaultParamJSON
    if (this.replaceParamJSON || this.defaultParamJSON) {
        descriptor = this.getDescriptorWithReplacedParams(descriptor);
    }

    descriptorSchema = JSON.parse(fs.readFileSync(self.config["arrowModuleRoot"] + "config/descriptor-schema.json", "utf-8"));

    report = JSV.createEnvironment().validate(descriptor, descriptorSchema);

    if (report.errors.length > 0) {
        self.logger.fatal("Error : " + self.testDataPath + " failed Schema Test !");
        self.logger.info(report.errors);
        proc.exit(1);
    }
    return descriptor;
};

/**
 *
 * @param param
 * @return {*}
 */
DataProvider.prototype.readAndValidateJSON = function (param) {

    var paramPath,
        json,
        parsedJson,
        self = this,
        pwd = global.workingDirectory || '';

    if (param) {
        if (param.indexOf(".json") > 0) {
            paramPath = path.resolve(pwd, param);
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