// Stub selenium server to use with several test cases

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var express = require("express"),
    clone = require('clone');

function SeleniumServer(port) {

    this.port = port;

}

SeleniumServer.prototype.server = null;
SeleniumServer.prototype.port = null;
SeleniumServer.prototype.sessions = {"status":0,"sessionId":null,"value":[],"class":"org.openqa.selenium.remote.Response","hCode":1561232967};
SeleniumServer.prototype.sessionObj =  {
    "id": "1338337429466",
    "class": "org.openqa.selenium.remote.server.handler.GetAllSessions$SessionInfo",
    "capabilities": {
        "chrome.chromedriverVersion": "18.0.1022.0",
        "platform": "MAC",
        "javascriptEnabled": true,
        "acceptSslCerts": false,
        "browserName": "chrome",
        "rotatable": false,
        "locationContextEnabled": false,
        "version": "19.0.1084.52",
        "databaseEnabled": false,
        "cssSelectorsEnabled": true,
        "handlesAlerts": true,
        "browserConnectionEnabled": false,
        "nativeEvents": true,
        "webStorageEnabled": false,
        "chrome.nativeEvents": false,
        "applicationCacheEnabled": false,
        "takesScreenshot": true
    },
    "hCode": 2123536766
};
SeleniumServer.prototype.sessionsID =  1000000000000;



SeleniumServer.prototype.startServer = function() {

    var self = this;
    this.app = express();

    this.app.get("/wd/hub/sessions", function (req, res) {
        res.send(self.sessions);
        res.end();
    });

    this.appServer = this.app.listen(this.port);
    console.log("Starting Test Selenium Server" );

}

SeleniumServer.prototype.stopServer = function() {

    this.appServer.close();
    console.log("Stopping Test Selenium Server" );
}


SeleniumServer.prototype.setActiveSessionCount = function(sessionCount) {

    var i = 0,
        obj = {};

    //first initializing sessionID's
    this.sessions.value = [];

    for(i = 0 ; i < sessionCount ; i = i + 1) {
        obj = null;
        obj = clone(this.sessionObj);
        obj.id = this.sessionsID;
        this.sessionsID += 1;
        this.sessions.value.push(obj)
    }
}

module.exports = SeleniumServer;

