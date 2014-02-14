/*
 * Copyright (c) 2012-2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('selLib-tests', function (Y, NAME) {


    var path = require('path'),
        mockery = require('mockery'),
        log4js = require("log4js"),
        arrowRoot = path.join(__dirname, '../../..'),
        suite = new Y.Test.Suite(NAME),
        A = Y.Assert,
        SelLib = require(arrowRoot + '/arrow_selenium/selLib.js'),
        wdMock;

    suite.setUp = function () {
        wdMock = require(arrowRoot + '/tests/unit/stub/webdriver');
        mockery.registerMock('../lib/util/wd-wrapper', wdMock);
        mockery.enable();
    };

    suite.tearDown = function () {

        mockery.disable();
    };

    suite.add(new Y.Test.Case({

//
        'test get capability object': function () {

            var
                caps,
                selLib = new SelLib();

            caps = selLib.getCapabilityObject(null, "firefox");

            A.isNotNull(caps, "Caps is null");
            A.areEqual("{\"browserName\":\"firefox\",\"version\":\"\",\"platform\":\"ANY\",\"javascriptEnabled\":true}", JSON.stringify(caps), 'Capability doesnt match');

            caps = selLib.getCapabilityObject(path.join(arrowRoot, "/tests/unit/arrow_selenium/caps.json"), "firefox");

            A.isNotNull(caps, "Caps is null");
            A.areEqual("{\"browserName\":\"firefox\",\"version\":\"\",\"platform\":\"ANY\",\"javascriptEnabled\":true}", JSON.stringify(caps), 'Capability doesnt match');
        },

        'test get browser info': function () {

            var
                selLib = new SelLib(),
                browserInfo;

            browserInfo = selLib.getBrowserInfo("firefox-x");
            A.areEqual("firefox", browserInfo.browserName);
            A.areEqual("x", browserInfo.browserVersion);

            browserInfo = selLib.getBrowserInfo("firefox");
            A.areEqual("firefox", browserInfo.browserName);
            A.areEqual("", browserInfo.browserVersion);

            browserInfo = selLib.getBrowserInfo("firefox-");
            A.areEqual("firefox", browserInfo.browserName);
            A.areEqual("", browserInfo.browserVersion);

            browserInfo = selLib.getBrowserInfo(undefined);
            A.isUndefined(browserInfo.browserName);
            A.isUndefined(browserInfo.browserVersion);

        },

        'test getBrowserName': function () {

//            A.isTrue(true);

            var wdMock = require(arrowRoot + '/tests/unit/stub/webdriver');
//            mockery.registerMock('../lib/util/wd-wrapper', wdMock);
//            mockery.enable();

            var selLib = new SelLib(),
                webdriver,
                webdriverConfObj = {
                    "seleniumHost": "http://wd/hub",
                    "caps": {
                        "platform": "ANY",
                        "javascriptEnabled": true,
                        "seleniumProtocol": "WebDriver",
                        "browserName": "mybrowser"
                    }
                };

            console.log('\n\n\n*******************Here....1');
            webdriver = new wdMock.Builder().
                usingServer(webdriverConfObj.seleniumHost).
                withCapabilities(webdriverConfObj.caps).
                build();

            console.log('\n\n\n*******************Here....2');

            selLib.getBrowserName(webdriver, function (browserName) {
                console.log('****Browsername is ' + browserName);
                A.areEqual("mybrowser", browserName, "Browser name should be mybrowser");

//                mockery.disable();
//                mockery.deregisterAll();

            });

        }





    }));

    Y.Test.Runner.add(suite);
}, '0.0.1', {requires: ['test']});

