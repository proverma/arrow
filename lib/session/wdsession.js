/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var http = require('http');
var log4js = require("log4js");

function WebDriverSession(config) {
    this.logger = log4js.getLogger("WebDriverSession");
    this.config = config;
}

WebDriverSession.prototype.getSessions = function (ref, callback, noExit) {

    console.log('****In wdsession getSessions...1');
    var self, wdHubHost, sHost, port, options;
    self = this;
    wdHubHost = this.config["seleniumHost"];
    sHost = wdHubHost.split("http://")[1].split(":")[0];
    port = wdHubHost.split("http://")[1].split(":")[1].split("/")[0];
    options = {
        host: sHost,
        port: port,
        path: '/wd/hub/sessions'
    };
    console.log('****In wdsession getSessions...2');

    http.get(options, function (res) {
        self.logger.debug("Got response from Selenium Server: " + res.statusCode);
        res.setEncoding('utf8');
        console.log('****In wdsession getSessions...3');
        var data = "";
        res.on("data", function (d) {
            data += d.toString();
        });
        res.on("end", function () {
            var arrTemp = [],
                objSession,
                i;

            objSession = JSON.parse(data.substr(0, data.lastIndexOf("}") + 1));
            console.log('**** wdsession Object Session::' + JSON.stringify(objSession));
            if ((0 === objSession.value.length) && !noExit) {
                self.logger.fatal("No active selenium session found");
                self.logger.info("You can also create sessions here : " + wdHubHost);
                callback("Error : No active selenium session found", null, null);
            } else {
                arrTemp = [];
                for (i = 0; i < objSession.value.length; i += 1) {
                    arrTemp.push(objSession.value[i].id);
                    console.log('****In wdsession getSessions...1::' + objSession.value[i].id);
                }
                console.log('**** wdsession Arrtemp::' + JSON.stringify(arrTemp));
                callback(null, ref, arrTemp);
            }
        });
    }).on('error', function (e) {
        self.logger.fatal("Error while connecting to Selenium Server: " + wdHubHost);
        self.logger.fatal("Error Message : " + e.message);
        callback(e.message, null, null);
    });
};

module.exports = WebDriverSession;
