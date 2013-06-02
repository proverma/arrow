/*jslint nomen: true, node: true */
/*globals YUI*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/**
 * Yahoo arrow webdriver manager module, 
 * It is to expose the webdriver interface so that test code can create multiple selenium sessions
 *
 * @module arrow-webdriver
 *
 * @example
 *
 * YUI.add("test-webdriver-tests", function (Y) {
 * 
 *     var suite = new Y.Test.Suite("Title test of the webdriver");
 *     suite.add(new Y.Test.Case({
 * 
 *         "test title": function() {
 *             var self = this;
 *             // if you are not using the default selenium host, you would need to pass seleniumHost url to WebDriverManager constructor
 *             //var webdriver_manager = new Y.Arrow.WebDriverManager(seleniumHost);
 *             var webdriver_manager = new Y.Arrow.WebDriverManager();
 * 
 *             var webdriver1 = webdriver_manager.createWebDriver({browserName: "chrome"});
 *             var webdriver2 = webdriver_manager.createWebDriver({browserName: "firefox"});
 * 
 *             webdriver1.get('http://www.google.com');
 * 
 *             webdriver1.getTitle().then(function(title) {
 *                 self.resume(function () {
 *                     Y.Assert.areEqual(title, "Google");
 *                     webdriver2.get('http://www.facebook.com');
 *                     webdriver2.getTitle().then(function(title) {
 *                         self.resume(function () {
 *                             Y.Assert.areEqual(title, "Welcome to Facebook - Log In, Sign Up or Learn More");
 *                             webdriver2.quit();
 *                             webdriver1.quit();
 *                         });
 *                     });
 *                     self.wait(12000);
 *                 });
 *             });
 *             self.wait(12000);
 * 
 *             self.wait(function () {}, 8000);
 *         }
 *     }));
 * 
 *     Y.Test.Runner.add(suite);
 * }, "0.1", {requires:["test", "arrow-webdriver"]});
 * 
 */

YUI.add("arrow-webdriver", function (Y) {
    'use strict';

    Y.namespace("Arrow");

    var WebDriverManager = Y.Arrow.WebDriverManager = function (seleniumHost) {
        var WDManager = require("../../../lib/util/webdrivermanager");

        this.webdriver_manager = new WDManager(seleniumHost);
    };

    WebDriverManager.prototype.createWebDriver = function (capability, sessionId) {
        return this.webdriver_manager.createWebDriver(capability, sessionId);
    };

}, "0.1", { requires: ["test"]});

