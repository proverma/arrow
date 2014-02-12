/*
 * Copyright (c) 2012-2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('selLib-tests', function (Y, NAME) {


    var path = require('path'),
        mockery = require('mockery'),
        log4js = require("log4js"),
        logger = log4js.getLogger("SelLibTests"),
        arrowRoot = path.join(__dirname, '../../..'),
        suite = new Y.Test.Suite(NAME),
        A = Y.Assert,
        DriverClass,
        CapabilityManagerClass,
        SelLib = require(arrowRoot + '/arrow_selenium/selLib.js');

    suite.setUp = function () {
//        var wdMock = require(arrowRoot + '/tests/unit/stub/webdriver');
//        mockery.registerMock('../lib/util/wd-wrapper', wdMock);
//        mockery.enable();
//        DriverClass = require(arrowRoot + '/lib/driver/selenium.js');
//        CapabilityManagerClass = require(arrowRoot + '/lib/util/capabilitymanager.js');
    };

    suite.tearDown = function () {
//        mockery.disable();
//        mockery.deregisterAll();
    };

    suite.add(new Y.Test.Case({

        'test get capability object': function () {

            var
                caps,
                selLib;
            selLib = new SelLib();
            A.isTrue(true, "Should be true");

            caps = selLib.getCapabilityObject(null, "firefox");
            console.log(JSON.stringify(caps));

            A.isNotNull(caps, "Caps is null");
            A.areEqual("{\"browserName\":\"firefox\",\"version\":\"\",\"platform\":\"ANY\",\"javascriptEnabled\":true}", JSON.stringify(caps), 'Capability doesnt match');
        }

//        'test getBrowserName': function () {
//
//            var wdMock = require(arrowRoot + '/tests/unit/stub/webdriver'),
//                selLib = new SelLib(),
//                webdriver,
//                webdriverConfObj = {
//                    "seleniumHost": "http://wd/hub",
//                    "caps": {
//                        "platform": "ANY",
//                        "javascriptEnabled": true,
//                        "seleniumProtocol": "WebDriver",
//                        "browserName": "mybrowser"
//                    }
//
//                };
//
//            A.isTrue(true);
////
////
//            mockery.registerMock('../lib/util/wd-wrapper', wdMock);
//            mockery.enable();
////
//            webdriver = new wdMock.Builder().
//                usingServer(webdriverConfObj.seleniumHost).
//                withCapabilities(webdriverConfObj.caps).
//                build();
//
//            console.log('\n\n\n*******************Here....');
//
////            webdriver.seleniumHost = webdriverConfObj.seleniumHost;
////            webdriver.caps = webdriverConfObj.caps;
//
//            selLib.getBrowserName(webdriver, function (browserName) {
//                console.log('****Browsername is ' + browserName);
//                A.isEqual("myBrowse22r", browserName, "Browser name should be mybrowser");
//                mockery.disable();
//                mockery.deregisterAll();
//
//            });
//
//        }

//        ,'test build web driver': function () {
//
//            var selLib,
//                webdriverconfig,
//                webdriver,
//                capabilities = {
//                    "browserName": "firefox",
//                    "version": "",
//                    "platform": "ANY",
//                    "javascriptEnabled": true
//                },
//                config = {
//                    "seleniumHost": "localhost:4444/wd/hub"
//                };
//
//            webdriverconfig = {
//                browser: 'mybrowser',
//                seleniumHost: 'localhost:4444/wd/hub',
//                capabilities: capabilities
//            };
//            logger.info("****test build web driver 1");
//            selLib = new SelLib(config);
//            logger.info("****test build web driver 2");
//            webdriver = selLib.buildWebDriver(webdriverconfig);
//            A.isNotNull(webdriver, "Webdriver is null");
//            logger.info("****test build web driver 3... " + webdriver);
//
////            webdriver.getCapabilities().then(function (sessionCaps) {
////                logger.info("****test build web driver 4");
////                logger.info('**Caps:' + JSON.stringify(sessionCaps));
////                logger.info("****test build web driver 5");
////                A.isTrue(true, 'Should be true');
////            });
//
//        }

    }));

    Y.Test.Runner.add(suite);
}, '0.0.1', {requires: ['test']});

