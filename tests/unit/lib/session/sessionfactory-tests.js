/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


YUI.add('sessionfactory-tests', function (Y) {

    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        SessionFactory = require(arrowRoot + '/lib/session/sessionfactory.js'),
        suite = new Y.Test.Suite("sessionfactory test suite"),
        StubArrow = require(arrowRoot + '/tests/unit/stub/arrow.js'),
        Arrow = require(arrowRoot + '/lib/interface/arrow'),
        A = Y.Assert;

    suite.add(new Y.Test.Case({

        name : "Check Constructor",

        testConstructor: function() {
            var ss = new SessionFactory({}, {"browser": "firefox", "group": "smoke", "testName": "SuperTest"});
            A.areEqual(ss.browser, "firefox", "browserName should be 'firefox'");
            A.areEqual(ss.group, "smoke", "browserName should be 'smoke'");
            A.areEqual(ss.testName, "SuperTest", "browserName should be 'SuperTest'");
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call getBrowser with browser as null",

        testGetBrowserWithBrowserNull: function() {
            var ss = new SessionFactory({}, {}),
                b = ss.getBrowsers({});
            A.areEqual(b, "", "Browser should be blank");
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call getBrowser with browser as blank String",

        testGetBrowserWithBrowserBlankString: function() {
            var ss = new SessionFactory({}, {}),
                b = ss.getBrowsers({"browser" : ""});
            A.areEqual(b, "", "Browser should be blank");
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call getBrowser with multiple browser",

        testGetBrowserWithMultipleBrowser: function() {
            var ss = new SessionFactory({}, {}),
                b = ss.getBrowsers({"browser" : "firefox,chrome"});
            A.areEqual(b.join(), "firefox,chrome", "Browser names should be returned");
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call getBrowser with multiple browser but no matching session browser",

        testGetBrowserWithMultipleBrowserNoMatchingSessionBrowser: function() {
            var ss = new SessionFactory({}, {"browser" : "opera"}),
                b = ss.getBrowsers({"browser" : "firefox,chrome"});
            A.areEqual(b.join(), "", "Browser names should be empty string");
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call getBrowser with multiple browser but with one matching session browser",

        testGetBrowserWithMultipleBrowserWithOneMatchingSessionBrowser: function() {
            var ss = new SessionFactory({}, {"browser" : "chrome"}),
                b = ss.getBrowsers({"browser" : "firefox,chrome"});
            A.areEqual(b.join(), "chrome", "One Browser name should be returned");
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call getFactoryTests with invalid descriptor path",

        testGetFactoryTestWithInvalidDescPath: function() {
            var ss = new SessionFactory({"arrDescriptor": ["NotFoundDescriptor.json"]}, {}),
                t,
                err;
            try {
                t = ss.getFactoryTests();
            } catch (e) {
                err = e;
            }
            A.areEqual(err.toString(), "Error: ENOENT, no such file or directory 'NotFoundDescriptor.json'", "Error should be thrown if invalid descriptor path is passed");
        }
    }));

    //Fails with 0.10.1
    suite.add(new Y.Test.Case({

        name : "Call getFactoryTests with valid descriptor path",

        testGetFactoryTestWithValidDescPath: function() {
            var ss = new SessionFactory({"dimensions" : arrowRoot + "/config/dimensions.json", "arrowModuleRoot" : arrowRoot + "/", "arrDescriptor": [__dirname + "/testdata/test_descriptor.json"]},
                    {}),
                t,
                i,
                resArr = [];

            t = ss.getFactoryTests();
            for (i in t) {
                resArr.push(t[i]);
            }
            resArr.sort(function(a, b) {
                return a.testName > b.testName;
            });
            A.areEqual(t.length, 5, "There should be five test objects"); // "Enabled:false" test should not be part of test object
            //Y.log(resArr);

            A.areEqual(resArr[0].testName, "testWithInvalidLib");
            A.areEqual(resArr[1].testName, "testWithMultipleBrowsers");
            A.areEqual(resArr[2].testName, "testWithMultipleGroups");
            A.areEqual(resArr[3].testName, "testWithNoLib");
            A.areEqual(resArr[4].testName, "testWithValidLibAndBrowserAndGroup");
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call getFactoryTests with valid descriptor path and unmatched group",

        testGetFactoryTestWithValidDescPathAndUnmatchedGroup: function() {
            var ss = new SessionFactory({"dimensions" : arrowRoot + "/config/dimensions.json", "arrowModuleRoot" : arrowRoot + "/", "arrDescriptor" : [__dirname + "/testdata/test_descriptor.json"]}, { "group" : "unmatched"}),
                t,
                i,
                res = "",
                exp = "";
            t = ss.getFactoryTests();
            A.areEqual(t.length, 0, "All test objects should be filtered out"); // "Enabled:false" test should not be part of test object
            for (i in t) {
                res += Y.JSON.stringify(t[i]);
            }
            A.areEqual(res, exp);
        }
    }));

    //TODO - Review this test
    suite.add(new Y.Test.Case({

        name : "Call getFactoryTests with valid descriptor path and matching group",

        testGetFactoryTestWithValidDescPathAndMatchingGroup: function() {
            var ss = new SessionFactory({"dimensions" : arrowRoot + "/config/dimensions.json", "arrowModuleRoot" : arrowRoot + "/",
                    "arrDescriptor" : [ __dirname + "/testdata/test_descriptor.json"]}, { "group" : "smoke"}),
                t,
                i,
                resArr = [];

            t = ss.getFactoryTests();
            A.areEqual(t.length, 2, "Two smoke test objects should be returned"); // "Enabled:false" test should not be part of test object
            for (i in t) {
                resArr.push(t[i]);
            }
            resArr.sort(function(a, b) {
                return a.testName > b.testName;
            });
            A.areEqual(resArr[0].testName, "testWithMultipleGroups");
            A.areEqual(resArr[1].testName, "testWithValidLibAndBrowserAndGroup");
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call getFactoryTests with valid descriptor path and unmatched testName",

        testGetFactoryTestWithValidDescPathAndUnmatchedTestName: function() {
            var ss = new SessionFactory({"dimensions" : arrowRoot + "/config/dimensions.json", "arrowModuleRoot" : arrowRoot + "/", "arrDescriptor" : [__dirname + "/testdata/test_descriptor.json"]}, {"testName" : "unmatched"}),
                t,
                i,
                res = "",
                exp = "";
            t = ss.getFactoryTests();
            A.areEqual(t.length, 0, "No test objects should be returned"); // "Enabled:false" test should not be part of test object
            for (i in t) {
                res += Y.JSON.stringify(t[i]);
            }
            A.areEqual(res, exp);
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call getFactoryTests with valid descriptor path and matching testName",

        testGetFactoryTestWithValidDescPathAndMatcingTestName: function() {
            var ss = new SessionFactory({"dimensions" : arrowRoot + "/config/dimensions.json", "arrowModuleRoot" : arrowRoot + "/", "arrDescriptor" : [__dirname + "/testdata/test_descriptor.json"]}, { "testName" : "testWithMultipleBrowsers"}),
                t,
                i,
                resArr = [];

            t = ss.getFactoryTests();
            A.areEqual(t.length, 1, "Only 'testWithMultipleBrowsers' test objects should be returned"); // "Enabled:false" test should not be part of test object
            for (i in t) {
                resArr.push(t[i]);
            }
            resArr.sort(function(a, b) {
                return a.testName > b.testName;
            });
            A.areEqual(resArr[0].testName, "testWithMultipleBrowsers");
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call runAllTestSessions with null params",

        testRunAllTestSessionsWithInvalidParam: function() {
            var ss = new SessionFactory({}, {}),
                arrow = new StubArrow();

            Arrow.instance = arrow;
            try {
                ss.runAllTestSessions();
            } catch (e) {
                A.fail("No error should be thrown");
            }

            A.areEqual(ss.testQueue.sessions.length, 1, "there should be one test session");

        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call runAllTestSessions with valid params",

        testRunAllTestSessionsWithValidParam: function() {
            var ss = new SessionFactory({}, {"test" : __dirname + "/testdata/test-func.js", "lib" : __dirname + "/testdata/test-lib.js"}),
                arrow = new StubArrow();

            Arrow.instance = arrow;
            try {
                ss.runAllTestSessions();
            } catch (e) {
                A.fail("No error should be thrown");
            }

            A.areEqual(ss.testQueue.sessions.length, 1, "there should be one test session");

        }
    }));

    //TODO - Pranav - this test fails with node 0.10.1

//    suite.add(new Y.Test.Case({
//
//        name : "Call runAllTestSessions with Multiple Tests",
//
//        testRunAllTestSessionsWithMultipleTests: function() {
//            var ss = new SessionFactory({"dimensions" : arrowRoot + "/config/dimensions.json", "arrowModuleRoot" : arrowRoot + "/", "arrDescriptor" : [__dirname + "/testdata/test_descriptor.json"]}, {}),
//                arrow = new StubArrow(),
//                resArr = [];
//            Arrow.instance = arrow;
//            console.log('***-In sf test case..1');
//            try {
//                ss.runAllTestSessions();
//                console.log('***-In sf test case..2');
//            } catch (e) {
//                A.fail("No error should be thrown");
//                global.workingDirectory = '';
//            }
//
//            A.areEqual(ss.testQueue.sessions.length, 6, "there should be six test sessions");
//
//        }
//    }));


    Y.Test.Runner.add(suite);

}, '0.0.1', {requires: ['test']});