/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('webdrivermanager-tests', function (Y) {

    var path = require('path'),
        mockery = require('mockery'),
        arrowRoot = path.join(__dirname, '../../../..'),
        WebDriverManager,
        suite = new Y.Test.Suite("Web driver Manager test suite");

    suite.setUp = function () {
        var wdMock = require(arrowRoot + '/tests/unit/stub/webdriver');
        mockery.registerMock('../util/wd-wrapper', wdMock);
        mockery.enable();
        WebDriverManager = require(arrowRoot + '/lib/util/webdrivermanager.js');
    }

    suite.tearDown = function () {
        mockery.disable();
        mockery.deregisterAll();
    }


    suite.add(new Y.Test.Case({
        "Confirm Constructor": function(){
            var webdriver_manager = new WebDriverManager();
            Y.Assert.isNotNull(webdriver_manager, "Confirm Web driver Manager is not null");
        }
    }));

    //check createWebDriver 
    suite.add(new Y.Test.Case({
        "Check createWebDriver Method": function(){
            var webdriver_manager = new WebDriverManager(),
                webdriver = webdriver_manager.createWebDriver({browserName: "firefox"});
            Y.Assert.isNotNull(webdriver, "Confirm Web driver object can be created");
        }
    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires:['test']});
 
