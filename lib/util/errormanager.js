/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var log4js = require("log4js");
var fs = require("fs");

var ErrorManager = function(context) {
    this.context = context || {};
    this.logger = log4js.getLogger("ErrorManager");
    this.emJson = {};

    if (this.context.config && this.context.config.emConfigPath) {
        this.emJson = JSON.parse(fs.readFileSync(context.config.emConfigPath, "utf-8"));
    }

    ErrorManager.instance = this;
};
ErrorManager.message = require('../../config/error-messages.js');

/**
 * Get instance of Error message templates
 *
 */
ErrorManager.getMessage = function () {
    return ErrorManager.message;
};

var self;
/**
 * Get instance of ErrorManager
 *
 */
ErrorManager.getInstance = function () {
    if (!ErrorManager.instance) {
        ErrorManager.instance = new ErrorManager();
        self = ErrorManager.instance;
    }
    return ErrorManager.instance;
};
ErrorManager.instance = null;

/**
 * Compose error message for giving string template and arguments.
 *
 * @param template string template.
 * @param value for placeholders.
 */
ErrorManager.prototype.error = function () {
    var i = 0, args = [], message = "", errorCodeJson, key;
    Array.prototype.push.apply(args, arguments);
    if (typeof args[0] === "string") {
        message = args[0];
    } else if (typeof args[0] === "number") {
        errorCodeJson = ErrorManager.message[args[0]];
        if (errorCodeJson) {
            message = errorCodeJson.text || "";
            if (errorCodeJson.name) {
                message = "(" + errorCodeJson.name + ") " + message;
            }
            message = args[0] + " " + message;
        } else {
            message = "Error code " + args[0] + " is not defined.";
            throw new Error(message);
        }
    }
    args.shift();
    message = message.format.apply(message, args);
    if (errorCodeJson) {
        args = [];
        i = 0;
        for (key in errorCodeJson) {
            args.push(errorCodeJson[i]);
            i = i + 1;
        }
        message = message.format.apply(message, args);
    }
    return message;
};

/**
 * Compose error message for giving string template and arguments
 * and pass the error messag into callback function.
 *
 * @param template string template.
 * @param callback the last parameter is the callback function.
 */
ErrorManager.prototype.errorCallback = function () {
    var message, callback = arguments[arguments.length - 1];
    if (typeof callback === "function") {
        message = this.error.apply(this, arguments);
        callback.call(this, message);
    }
};

/**
 * Compose error message for giving string template and arguments
 * and log the error messag.
 *
 * @param template string template.
 */
ErrorManager.prototype.errorLog = function () {
    var message = this.error.apply(this, arguments), log = this.mock || this.logger;
    log.error(message);
    return message;
};

// format string
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/\{(\d+)\}/g, function(match, number) {
            return typeof args[number] !== 'undefined'
                ? args[number]
                : match;
        });
    };
}


module.exports = ErrorManager;

