//TODO Figure out and add some good common methods for all arrow users
/*jslint forin:true sub:true undef: true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/
// Augment YUI with 
// - expressive asserts
// - selenium like query

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

YUI.add("arrow", function (Y) {

    Y.namespace("Arrow");

    var WebDriverManager = Y.Arrow.WebDriverManager = function(seleniumHost) {
        var webdriverManager = require("../util/webdrivermanager");

        this.webdriver_manager = new webdriverManager(seleniumHost);
    };

    WebDriverManager.prototype.createWebDriver = function (capability, sessionId) {
        return this.webdriver_manager.createWebDriver(capability, sessionId);
    };

}, "0.1", { requires: ["test"]});

