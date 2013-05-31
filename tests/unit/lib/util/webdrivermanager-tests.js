/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('webdrivermanager-tests', function (Y) {

    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        WebDriverManager = require(arrowRoot+'/lib/util/webdrivermanager.js'),
        suite = new Y.Test.Suite("Web driver Manager test suite");

    WebDriverManager.wdAppPath = arrowRoot + '/tests/unit/stub/webdriver.js';
    var webdriver_manager = new WebDriverManager();

    suite.add(new Y.Test.Case({
        "Confirm Constructor": function(){
            Y.Assert.isNotNull(webdriver_manager, "Confirm Web driver Manager is not null");
        }
    }));

    //check createWebDriver 
    suite.add(new Y.Test.Case({
        "Check createWebDriver Method": function(){
            var webdriver = webdriver_manager.createWebDriver({browserName: "firefox"});
            Y.Assert.isNotNull(webdriver, "Confirm Web driver object can be created");
        }
    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires:['test']});
 
