/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var log4js = require("log4js");
var fs = require("fs");
var qs = require('querystring');
var JSV = require("JSV").JSV;
var ycb = require('ycb');
var path = require('path');
var _ = require("underscore");
var ImportManager = require("../util/importmanager");
var ErrorManager = require("../util/errormanager");
var DataDriverManager = require("../util/datadrivermanager");
var em = ErrorManager.getInstance();


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

/**
 *
 * @returns {Array}
 */
DataProvider.prototype.getTestData = function () {

    var descriptorJson,
        descriptor,
        descriptorJsonStr,
        self = this,
        descriptorArr = [],
        dataDrivenDescriptorArr,
        dataDriverManager = new DataDriverManager(),
        proc = self.mock || process,
        i,
        descJson;

    self.logger.debug('Loading descriptor file: ' + self.testDataPath);
    descriptorJsonStr = fs.readFileSync(self.testDataPath, "utf-8");
    try {
        descriptorJson = JSON.parse(descriptorJsonStr);
    } catch (e) {
        self.logger.error('The descriptor ' + self.testDataPath + ' contains invalid JSON');
        proc.exit(1);
    }

    self.isDataDriven = descriptorJson[0].dataDriver || (descriptorJson[0].config instanceof Array);

    // Process data driven descriptors
    if (self.isDataDriven) {

        dataDrivenDescriptorArr = dataDriverManager.processDataDriver(self.testDataPath, descriptorJson);

        if (dataDrivenDescriptorArr && dataDrivenDescriptorArr.length > 0) {

            for (i = 0; i < dataDrivenDescriptorArr.length; i += 1) {

                descJson = dataDrivenDescriptorArr[i];
                descriptor = self.getDescriptor(descJson);
                descriptorArr.push(descriptor);
            }
        }

    } else {
        descriptor = self.getDescriptor(descriptorJson);
        descriptorArr.push(descriptor);
    }
    return descriptorArr;

};

/**
 *
 * @param descriptorJson
 * @returns {*} Processed descriptor Json
 */
DataProvider.prototype.getDescriptor = function(descriptorJson) {

    var importDescriptor = descriptorJson[0].importDescriptor,
        importManager = new ImportManager(),
        cwd = global.workingDirectory || process.cwd(),
        contextObj,
        baseUrl,
        dimensionsJson,
        self = this,
        descriptor,
        relativePath = path.dirname(self.testDataPath);

    // Importing descriptor
    if (importDescriptor) {
        // We can read the descriptorJson from processImportDescriptor method too instead of passing from here
        // In future, if we need to manipulate the descriptorJson before we import, this will help
        //TODO - Remove cwd
        descriptorJson = importManager.processImportDescriptor(self.testDataPath, cwd, self.args.group, descriptorJson);
    }

    // read context into object
    contextObj = qs.parse(self.context, ",", ":");
    baseUrl = self.config["baseUrl"];

    // inject baseUrl into the settings
    self.injectBaseUrlFromSettings(descriptorJson, baseUrl);

    // Process extend descriptor
    descriptorJson = self.processExtendDescriptor(descriptorJson, cwd, relativePath);

    // merge dimension into descriptor
    if (self.dimensions) {
        dimensionsJson = self.readAndValidateJSON(self.dimensions);
        descriptorJson.unshift(dimensionsJson[0]);
    }

    // Apply ycb substitution
    descriptor = self.applyYcbSubstitution(descriptorJson, contextObj);

    // Replace params in the descriptor , if user has passed either of replaceParamJSON or defaultParamJSON
    if (self.replaceParamJSON || self.defaultParamJSON) {
        descriptor = self.getDescriptorWithReplacedParams(descriptor);
    }

    // Validate descriptor against the schema
    self.validateDescriptor(descriptor, self.config["arrowModuleRoot"] + "config/descriptor-schema.json");

    return descriptor;
};

/**
 * Inject baseUrl if passed from command line or specified in config file
 */
DataProvider.prototype.injectBaseUrlFromSettings = function(descriptorJson, baseUrl) {

    var pos;
    if (baseUrl && baseUrl.length > 0) {
        for (pos = 0; pos < descriptorJson.length; pos += 1) {
            if (descriptorJson[pos].settings) {
                if (!descriptorJson[pos].config) {
                    descriptorJson[pos].config = {};
                }
                descriptorJson[pos].config.baseUrl = baseUrl;
            }
        }
    }

};

/**
 *
 * @param descriptorJson
 * @param contextObj
 * @returns {*}
 */
DataProvider.prototype.applyYcbSubstitution = function(descriptorJson, contextObj) {

    var descriptor,
        match,
        self = this,
        proc = self.mock || process;

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
    return descriptor;
};

/**
 * if descriptor is extending another json
 * @param descriptorJson
 * @param cwd
 * @param relativePath
 */
DataProvider.prototype.processExtendDescriptor = function(descriptorJson, cwd, relativePath) {

    //checking if descriptor is extending another json
    if (descriptorJson[0]['extends']) {
        // Resolve path
        descriptorJson[0]['extends'] = path.resolve(cwd, relativePath, descriptorJson[0]['extends']);
        var baseJson = JSON.parse(fs.readFileSync(descriptorJson[0]['extends']));
        descriptorJson = descriptorJson.concat(baseJson);
    }
    return descriptorJson;

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
        pwd = global.workingDirectory || '',
        proc = self.mock || process,
        isFile = false,
        errMsg;

    if (param) {

        try {
            // If file, read Json from file and validate
            paramPath = path.resolve(pwd, param);
            json = fs.readFileSync(paramPath, "utf-8");
            isFile = true;
        } catch (e) {
            // Not a file, so treat it as json string
            json = param;
        }

        try {
            parsedJson = JSON.parse(json);
        } catch (msg) {

            if (isFile) {
                errMsg = "The file " + param + " does not contain valid JSON";
            } else {
                errMsg = param + " is not a valid JSON";
            }
            self.logger.error(msg);
            self.logger.error(errMsg);

            proc.exit(1);
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

/**
 *
 * @param descriptor
 * @param descriptorSchemaPath
 */
DataProvider.prototype.validateDescriptor = function (descriptor, descriptorSchemaPath) {

    var descriptorSchema,
        report,
        self = this,
        proc = self.mock || process;

    try {
        descriptorSchema = fs.readFileSync(descriptorSchemaPath, "utf-8");
        descriptorSchema = JSON.parse(descriptorSchema);

        // Add dataDriverKey as a hidden property
        descriptorSchema.properties.dataDriverKey = {"type":"string"};

    } catch (e) {
        self.logger.error('Failed to read/parse descriptor schema - error :' + e);
        proc.exit(1);
    }

    report = JSV.createEnvironment().validate(descriptor, descriptorSchema);

    if (report.errors.length > 0) {
        self.logger.fatal("Error : " + self.testDataPath + " failed Schema Test !");
        self.logger.info(report.errors);
        proc.exit(1);
    }

};

module.exports = DataProvider;