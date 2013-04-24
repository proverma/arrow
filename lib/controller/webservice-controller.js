/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


var util = require("util");
var http = require('http');
var https = require('https');
var xml2js = require('xml2js');
var urlParser = require("url");
var log4js = require("log4js");
var Controller = require("../interface/controller");

function WebServiceController(testConfig,args,driver) {
    Controller.call(this, testConfig,args,driver);

    this.logger = log4js.getLogger("WebServiceController");
}

/*
 * All custom controllers MUST implement the Controller interface
 */
util.inherits(WebServiceController, Controller);

/**
 * In the execute method you can get a handle to the parameters in your descriptor
 * file by using this.testParams
 *
 */
WebServiceController.prototype.execute = function(callback) {
    var self = this;

    //Get the various parameters needed from the Test Descriptor file
    var url = self.testParams.url;
    if (!url) {
        callback("url has to be defined for webservice-controller");
        return;
    }

    // parse url
    var parts = urlParser.parse(url);

    var http_opts = {
        host: parts.hostname,
        port: parts.port || '80',
        path: parts.path,
        method: self.testParams.method || 'GET',
        headers: { // seems that user-agent is MUST to query YQL
            'user-agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.65 Safari/537.31"
        } 
    }

    // http or https?
    var http_protocol;
    if (parts.protocol.indexOf("https") > -1) {
        http_protocol = https;
    } else {
        http_protocol = http;
    }

    var req = http_protocol.request(http_opts, function(res) {
        var content_type = res.headers['content-type'];
        self.logger.debug("Content type: " + content_type);
        res.setEncoding('utf8');

        var shared = {};
        shared.statusCode = res.statusCode;
        shared.headers = res.headers;

        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });

        res.on('end', function () {
            if (content_type.indexOf('xml') > -1) { // content type is xml
                var xmlParser = new xml2js.Parser();
                xmlParser.parseString(data, function (err, result) {
                    self.logger.debug("Response data:" + JSON.stringify(result));
                    shared.data = result;
                    self.testParams.shared = shared;
                    callback();
                });
            } else if (content_type.indexOf('json') > -1) { // content type is json
                var result = JSON.parse(data);
                self.logger.debug("Response data:" + JSON.stringify(result));
                shared.data = result;
                self.testParams.shared = shared;
                callback();
            } else {
                self.testParams.shared = shared;
                callback('Only json or xml content type is supported');
            }
        });

        res.on('error', function (e) {
            self.testParams.shared = shared;
            callback('Got error: ' + e.message);
        });
    });

    req.on('error', function(e) {
        callback('Problem with request: ' + e.message);
    });

    req.end();
}

module.exports = WebServiceController;
