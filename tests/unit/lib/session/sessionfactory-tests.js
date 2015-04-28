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
            var ss = new SessionFactory({}, { "group": "smoke", "testName": "SuperTest","browser": "firefox"});
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

        name : "Call getFactoryTests with data driven descriptor - verify descriptor name contains key",

        testGetFactoryTestVerifyDescriptorNameContainsKey: function() {

            var ss = new SessionFactory({"dimensions" : arrowRoot + "/config/dimensions.json", "arrowModuleRoot" : arrowRoot + "/", "arrDescriptor" : [__dirname + "/testdata/datadriven-descriptor.json"]},{}),
                t,
                t = ss.getFactoryTests();
            A.areEqual(2 , t.length, "2 test objects should be returned");

            A.isTrue(Y.JSON.stringify(t[0].qualifiedDescriptorPath).indexOf('- finance') > 0, "QualifiedDescriptorPath shall contain the data driver key - finance");
            A.isTrue(Y.JSON.stringify(t[1].qualifiedDescriptorPath).indexOf('- yahoo') > 0, "QualifiedDescriptorPath shall contain the data driver key - yahoo");
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

            // to ensure we dont exit
            global.workingDirectory = null;

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

            // to ensure we dont exit
            global.workingDirectory = null;

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

    suite.add(new Y.Test.Case({

        name : "Call getFactoryTests with descriptor shared params",

        testGetFactoryTestWithDescriptorSharedParams: function() {
            var ss = new SessionFactory({"dimensions" : arrowRoot + "/config/dimensions.json", "arrowModuleRoot" : arrowRoot + "/", "arrDescriptor": [__dirname + "/testdata/test_descriptor_shared_params.json"]},
                    {}),
                t;
            t = ss.getFactoryTests();
            A.areEqual(1, t.length, "There should be 1 test object");

            A.areEqual("Yahoo", t[0].params.descriptorSharedParams['yhooquote'], "DescriptorSharedParams - YHOO Quote doesn't match");
            A.areEqual("Apple", t[0].params.descriptorSharedParams['applequote'], "DescriptorSharedParams - AAPL Quote doesn't match");

        }
    }));


    suite.add(new Y.Test.Case({

        name : "Exit code failure test",

        testExitFailureTrue: function() {

            var reportObj =
            {"reportFolder":"arrow-target","arrTestSessions":[{"logger":{"category":"TestSession","_events":{}},"args":{"config":{},"params":{"lib":"myDirarrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDirarrow/config/config.js","test":"demo/test-greeter.js","page":"myDirarrow/lib/client/testHost.html","customController":false},"testName":"Default","driver":"nodejs","browser":""},"config":{"seleniumHost":"http://localhost:4444/wd/hub","phantomHost":"http://localhost:4445/wd/hub","context":"","defaultAppHost":"","logLevel":"INFO","browser":"firefox","parallel":false,"baseUrl":"","arrowModuleRoot":"myDirarrow/","dimensions":"myDirarrow/config/dimensions.json","defaultTestHost":"myDirarrow/lib/client/testHost.html","defaultAppSeed":"//cdnjs.cloudflare.com/ajax/libs/yui/3.15.0/yui-min.js","autolib":"myDirarrow/lib/common","useYUISandbox":false,"sandboxYUIVersion":"3.8.0","yuiSandboxRuntime":"myDirarrow/lib/client/yui-test-runtime.js","engine":"yui","engineConfig":"","testSeed":"myDirarrow/lib/client/yuitest-seed.js","testRunner":"myDirarrow/lib/client/yuitest-runner.js","shareLibPath":["myDirarrow/sharelib","./common"],"scanShareLibPrefix":[],"scanShareLibRecursive":true,"enableShareLibYUILoader":false,"descriptorName":"test_descriptor.json","minPort":10000,"maxPort":11000,"coverage":false,"coverageExclude":"","exitCode":true,"retryCount":0,"keepIstanbulCoverageJson":false,"color":true,"report":true,"testTimeOut":30000,"ignoreSslErrorsPhantomJs":true,"startPhantomJs":false,"startArrowServer":false,"lib":"demo/greeter.js","artifactsUrl":""},"driverName":"nodejs","testConfig":{},"retryCount":1,"screenShotPaths":[],"testParams":{"lib":"myDirarrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDirarrow/config/config.js","test":"demo/test-greeter.js","page":"myDirarrow/lib/client/testHost.html","customController":false},"startTime":1399316871519,"endTime":1399316873297,"driver":{"logger":{"category":"NodeDriver","_events":{}},"config":{"seleniumHost":"http://localhost:4444/wd/hub","phantomHost":"http://localhost:4445/wd/hub","context":"","defaultAppHost":"","logLevel":"INFO","browser":"firefox","parallel":false,"baseUrl":"","arrowModuleRoot":"myDirarrow/","dimensions":"myDirarrow/config/dimensions.json","defaultTestHost":"myDirarrow/lib/client/testHost.html","defaultAppSeed":"//cdnjs.cloudflare.com/ajax/libs/yui/3.15.0/yui-min.js","autolib":"myDirarrow/lib/common","useYUISandbox":false,"sandboxYUIVersion":"3.8.0","yuiSandboxRuntime":"myDirarrow/lib/client/yui-test-runtime.js","engine":"yui","engineConfig":"","testSeed":"myDirarrow/lib/client/yuitest-seed.js","testRunner":"myDirarrow/lib/client/yuitest-runner.js","shareLibPath":["myDirarrow/sharelib","./common"],"scanShareLibPrefix":[],"scanShareLibRecursive":true,"enableShareLibYUILoader":false,"descriptorName":"test_descriptor.json","minPort":10000,"maxPort":11000,"coverage":false,"coverageExclude":"","exitCode":true,"retryCount":0,"keepIstanbulCoverageJson":false,"color":true,"report":true,"testTimeOut":30000,"ignoreSslErrorsPhantomJs":true,"startPhantomJs":false,"startArrowServer":false,"lib":"demo/greeter.js","artifactsUrl":""},"webdriver":null,"testName":"Default","args":{"config":{},"params":{"lib":"myDirarrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDirarrow/config/config.js","test":"demo/test-greeter.js","page":"myDirarrow/lib/client/testHost.html","customController":false},"testName":"Default","driver":"nodejs","browser":""},"reports":{"logger":{"category":"ReportStack","_events":{}},"report":{"results":[{"name":"Our First Test","passed":0,"failed":1,"errors":0,"ignored":0,"total":1,"duration":5,"type":"report","testCase_yui_3_8_0_1_1399316872731_6":{"name":"testCase_yui_3_8_0_1_1399316872731_6","passed":0,"failed":1,"errors":0,"ignored":0,"total":1,"duration":4,"type":"testcase","test greet":{"result":"fail","message":"Values should be equal.\nExpected: Smith, Joe (string)\nActual: Smith, JoeX (string)","type":"test","name":"test greet","duration":0}},"timestamp":"Mon May 05 2014 12:07:52 GMT-0700 (PDT)","ua":"nodejs"}]},"stkReportAtom":[{"results":[{"name":"Our First Test","passed":0,"failed":1,"errors":0,"ignored":0,"total":1,"duration":5,"type":"report","testCase_yui_3_8_0_1_1399316872731_6":{"name":"testCase_yui_3_8_0_1_1399316872731_6","passed":0,"failed":1,"errors":0,"ignored":0,"total":1,"duration":4,"type":"testcase","test greet":{"result":"fail","message":"Values should be equal.\nExpected: Smith, Joe (string)\nActual: Smith, JoeX (string)","type":"test","name":"test greet","duration":0}},"timestamp":"Mon May 05 2014 12:07:52 GMT-0700 (PDT)","ua":"nodejs"}]}]},"arrowServerBase":"","isMobile":false}}],"arrWDSessions":[],"driver":"nodejs","testSuiteName":"ARROW TESTSUITE","timeReport":{"undefined":[]}};

            var ss = new SessionFactory({},{});
            A.isTrue(ss.isFailure(reportObj), "Report Object contains failure. isFailure() should return true");

        },

        testExitFailureTrueScenario: function() {

            var reportObj =
            {"reportFolder":"arrow-target","arrTestSessions":[{"logger":{"category":"TestSession","_events":{}},"args":{"config":{},"params":{"lib":"myDir/arrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDir/arrow/config/config.js","test":"demo/test-greeter.js","page":"myDir/arrow/lib/client/testHost.html","customController":false},"testName":"Default","driver":"nodejs","browser":""},"config":{"seleniumHost":"http://localhost:4444/wd/hub","phantomHost":"http://localhost:4445/wd/hub","context":"","defaultAppHost":"","logLevel":"INFO","browser":"firefox","parallel":false,"baseUrl":"","arrowModuleRoot":"myDir/arrow/","dimensions":"myDir/arrow/config/dimensions.json","defaultTestHost":"myDir/arrow/lib/client/testHost.html","defaultAppSeed":"//cdnjs.cloudflare.com/ajax/libs/yui/3.15.0/yui-min.js","autolib":"myDir/arrow/lib/common","useYUISandbox":false,"sandboxYUIVersion":"3.8.0","yuiSandboxRuntime":"myDir/arrow/lib/client/yui-test-runtime.js","engine":"yui","engineConfig":"","testSeed":"myDir/arrow/lib/client/yuitest-seed.js","testRunner":"myDir/arrow/lib/client/yuitest-runner.js","shareLibPath":["myDir/arrow/sharelib","./common"],"scanShareLibPrefix":[],"scanShareLibRecursive":true,"enableShareLibYUILoader":false,"descriptorName":"test_descriptor.json","minPort":10000,"maxPort":11000,"coverage":false,"coverageExclude":"","exitCode":true,"retryCount":0,"keepIstanbulCoverageJson":false,"color":true,"report":true,"testTimeOut":30000,"ignoreSslErrorsPhantomJs":true,"startPhantomJs":false,"startArrowServer":false,"lib":"demo/greeter.js","artifactsUrl":""},"driverName":"nodejs","testConfig":{},"retryCount":1,"screenShotPaths":[],"testParams":{"lib":"myDir/arrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDir/arrow/config/config.js","test":"demo/test-greeter.js","page":"myDir/arrow/lib/client/testHost.html","customController":false},"startTime":1399316871519,"endTime":1399316873297,"driver":{"logger":{"category":"NodeDriver","_events":{}},"config":{"seleniumHost":"http://localhost:4444/wd/hub","phantomHost":"http://localhost:4445/wd/hub","context":"","defaultAppHost":"","logLevel":"INFO","browser":"firefox","parallel":false,"baseUrl":"","arrowModuleRoot":"myDir/arrow/","dimensions":"myDir/arrow/config/dimensions.json","defaultTestHost":"myDir/arrow/lib/client/testHost.html","defaultAppSeed":"//cdnjs.cloudflare.com/ajax/libs/yui/3.15.0/yui-min.js","autolib":"myDir/arrow/lib/common","useYUISandbox":false,"sandboxYUIVersion":"3.8.0","yuiSandboxRuntime":"myDir/arrow/lib/client/yui-test-runtime.js","engine":"yui","engineConfig":"","testSeed":"myDir/arrow/lib/client/yuitest-seed.js","testRunner":"myDir/arrow/lib/client/yuitest-runner.js","shareLibPath":["myDir/arrow/sharelib","./common"],"scanShareLibPrefix":[],"scanShareLibRecursive":true,"enableShareLibYUILoader":false,"descriptorName":"test_descriptor.json","minPort":10000,"maxPort":11000,"coverage":false,"coverageExclude":"","exitCode":true,"retryCount":0,"keepIstanbulCoverageJson":false,"color":true,"report":true,"testTimeOut":30000,"ignoreSslErrorsPhantomJs":true,"startPhantomJs":false,"startArrowServer":false,"lib":"demo/greeter.js","artifactsUrl":""},"webdriver":null,"testName":"Default","args":{"config":{},"params":{"lib":"myDir/arrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDir/arrow/config/config.js","test":"demo/test-greeter.js","page":"myDir/arrow/lib/client/testHost.html","customController":false},"testName":"Default","driver":"nodejs","browser":""},"reports":{"logger":{"category":"ReportStack","_events":{}},"report":{"scenario":[{"results":[{"controller":"myDir/arrow_exitCode/arrow/lib/controller/default","params":{"comment":"Load finance page","page":"http://finance.yahoo.com","lib":"myDir/arrow_exitCode/arrow/lib/common/yui-arrow.js","shared":{},"descriptorSharedParams":{},"customController":false}}]},{"results":[{"controller":"myDir/arrow_exitCode/arrow/lib/controller/locator","params":{"value":"#txtQuotes","text":"yhoo\n","lib":"myDir/arrow_exitCode/arrow/lib/common/yui-arrow.js","shared":{},"descriptorSharedParams":{},"customController":false}}]},{"results":[{"name":"Quote Page test of the test","passed":0,"failed":1,"errors":0,"ignored":0,"total":1,"duration":4,"type":"report","testCase_yui_3_9_1_8_1399325311687_6":{"name":"testCase_yui_3_9_1_8_1399325311687_6","passed":0,"failed":1,"errors":0,"ignored":0,"total":1,"duration":3,"type":"testcase","test quote":{"result":"fail","message":"Values should be equal.\nExpected: undefined (undefined)\nActual: Yahoo! Inc. (YHOO) (string)","type":"test","name":"test quote","duration":1}},"timestamp":"Mon May  5 14:28:32 2014","ua":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:26.0) Gecko/20100101 Firefox/26.0","currentUrl":"http://finance.yahoo.com/q?s=yhoo&ql=1"}]}]},"stkReportAtom":[{"results":[{"name":"Our First Test","passed":0,"failed":1,"errors":0,"ignored":0,"total":1,"duration":5,"type":"report","testCase_yui_3_8_0_1_1399316872731_6":{"name":"testCase_yui_3_8_0_1_1399316872731_6","passed":0,"failed":1,"errors":0,"ignored":0,"total":1,"duration":4,"type":"testcase","test greet":{"result":"fail","message":"Values should be equal.\nExpected: Smith, Joe (string)\nActual: Smith, JoeX (string)","type":"test","name":"test greet","duration":0}},"timestamp":"Mon May 05 2014 12:07:52 GMT-0700 (PDT)","ua":"nodejs"}]}]},"arrowServerBase":"","isMobile":false}}],"arrWDSessions":[],"driver":"nodejs","testSuiteName":"ARROW TESTSUITE","timeReport":{"undefined":[]}}

            var ss = new SessionFactory({},{});
            A.isTrue(ss.isFailure(reportObj), "Report Object contains failure in scenario. isFailure() should return true");

        },

        testExitFailureIfNoReportFound: function() {

            var reportObj =
            {"reportFolder":"arrow-target","arrTestSessions":[{"logger":{"category":"TestSession","_events":{}},"args":{"config":{},"params":{"lib":"myDir/arrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDir/arrow/config/config.js","test":"demo/test-greeter.js","page":"myDir/arrow/lib/client/testHost.html","customController":false},"testName":"Default","driver":"nodejs","browser":""},"config":{"seleniumHost":"http://localhost:4444/wd/hub","phantomHost":"http://localhost:4445/wd/hub","context":"","defaultAppHost":"","logLevel":"INFO","browser":"firefox","parallel":false,"baseUrl":"","arrowModuleRoot":"myDir/arrow/","dimensions":"myDir/arrow/config/dimensions.json","defaultTestHost":"myDir/arrow/lib/client/testHost.html","defaultAppSeed":"//cdnjs.cloudflare.com/ajax/libs/yui/3.15.0/yui-min.js","autolib":"myDir/arrow/lib/common","useYUISandbox":false,"sandboxYUIVersion":"3.8.0","yuiSandboxRuntime":"myDir/arrow/lib/client/yui-test-runtime.js","engine":"yui","engineConfig":"","testSeed":"myDir/arrow/lib/client/yuitest-seed.js","testRunner":"myDir/arrow/lib/client/yuitest-runner.js","shareLibPath":["myDir/arrow/sharelib","./common"],"scanShareLibPrefix":[],"scanShareLibRecursive":true,"enableShareLibYUILoader":false,"descriptorName":"test_descriptor.json","minPort":10000,"maxPort":11000,"coverage":false,"coverageExclude":"","exitCode":true,"retryCount":0,"keepIstanbulCoverageJson":false,"color":true,"report":true,"testTimeOut":30000,"ignoreSslErrorsPhantomJs":true,"startPhantomJs":false,"startArrowServer":false,"lib":"demo/greeter.js","artifactsUrl":""},"driverName":"nodejs","testConfig":{},"retryCount":1,"screenShotPaths":[],"testParams":{"lib":"myDir/arrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDir/arrow/config/config.js","test":"demo/test-greeter.js","page":"myDir/arrow/lib/client/testHost.html","customController":false},"startTime":1399320190344,"endTime":1399320192116,"driver":{"logger":{"category":"NodeDriver","_events":{}},"config":{"seleniumHost":"http://localhost:4444/wd/hub","phantomHost":"http://localhost:4445/wd/hub","context":"","defaultAppHost":"","logLevel":"INFO","browser":"firefox","parallel":false,"baseUrl":"","arrowModuleRoot":"myDir/arrow/","dimensions":"myDir/arrow/config/dimensions.json","defaultTestHost":"myDir/arrow/lib/client/testHost.html","defaultAppSeed":"//cdnjs.cloudflare.com/ajax/libs/yui/3.15.0/yui-min.js","autolib":"myDir/arrow/lib/common","useYUISandbox":false,"sandboxYUIVersion":"3.8.0","yuiSandboxRuntime":"myDir/arrow/lib/client/yui-test-runtime.js","engine":"yui","engineConfig":"","testSeed":"myDir/arrow/lib/client/yuitest-seed.js","testRunner":"myDir/arrow/lib/client/yuitest-runner.js","shareLibPath":["myDir/arrow/sharelib","./common"],"scanShareLibPrefix":[],"scanShareLibRecursive":true,"enableShareLibYUILoader":false,"descriptorName":"test_descriptor.json","minPort":10000,"maxPort":11000,"coverage":false,"coverageExclude":"","exitCode":true,"retryCount":0,"keepIstanbulCoverageJson":false,"color":true,"report":true,"testTimeOut":30000,"ignoreSslErrorsPhantomJs":true,"startPhantomJs":false,"startArrowServer":false,"lib":"demo/greeter.js","artifactsUrl":""},"webdriver":null,"testName":"Default","args":{"config":{},"params":{"lib":"myDir/arrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDir/arrow/config/config.js","test":"demo/test-greeter.js","page":"myDir/arrow/lib/client/testHost.html","customController":false},"testName":"Default","driver":"nodejs","browser":""},"reports":{"logger":{"category":"ReportStack","_events":{}},"report":{"results":[]},"stkReportAtom":[]},"arrowServerBase":"","isMobile":false}}],"arrWDSessions":[],"driver":"nodejs","testSuiteName":"ARROW TESTSUITE","timeReport":{"undefined":[]}};

            var ss = new SessionFactory({},{});
            A.isTrue(ss.isFailure(reportObj), "Report Object does not contain report. isFailure() should return true");

        },

        testExitFailureFalse: function() {

            var reportObj =
            {"reportFolder":"arrow-target","arrTestSessions":[{"logger":{"category":"TestSession","_events":{}},"args":{"config":{},"params":{"lib":"myDir/arrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDir/arrow/config/config.js","test":"demo/test-greeter.js","page":"myDir/arrow/lib/client/testHost.html","customController":false},"testName":"Default","driver":"nodejs","browser":""},"config":{"seleniumHost":"http://localhost:4444/wd/hub","phantomHost":"http://localhost:4445/wd/hub","context":"","defaultAppHost":"","logLevel":"INFO","browser":"firefox","parallel":false,"baseUrl":"","arrowModuleRoot":"myDir/arrow/","dimensions":"myDir/arrow/config/dimensions.json","defaultTestHost":"myDir/arrow/lib/client/testHost.html","defaultAppSeed":"//cdnjs.cloudflare.com/ajax/libs/yui/3.15.0/yui-min.js","autolib":"myDir/arrow/lib/common","useYUISandbox":false,"sandboxYUIVersion":"3.8.0","yuiSandboxRuntime":"myDir/arrow/lib/client/yui-test-runtime.js","engine":"yui","engineConfig":"","testSeed":"myDir/arrow/lib/client/yuitest-seed.js","testRunner":"myDir/arrow/lib/client/yuitest-runner.js","shareLibPath":["myDir/arrow/sharelib","./common"],"scanShareLibPrefix":[],"scanShareLibRecursive":true,"enableShareLibYUILoader":false,"descriptorName":"test_descriptor.json","minPort":10000,"maxPort":11000,"coverage":false,"coverageExclude":"","exitCode":true,"retryCount":0,"keepIstanbulCoverageJson":false,"color":true,"report":true,"testTimeOut":30000,"ignoreSslErrorsPhantomJs":true,"startPhantomJs":false,"startArrowServer":false,"lib":"demo/greeter.js","artifactsUrl":""},"driverName":"nodejs","testConfig":{},"retryCount":1,"screenShotPaths":[],"testParams":{"lib":"myDir/arrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDir/arrow/config/config.js","test":"demo/test-greeter.js","page":"myDir/arrow/lib/client/testHost.html","customController":false},"startTime":1399320190344,"endTime":1399320192116,"driver":{"logger":{"category":"NodeDriver","_events":{}},"config":{"seleniumHost":"http://localhost:4444/wd/hub","phantomHost":"http://localhost:4445/wd/hub","context":"","defaultAppHost":"","logLevel":"INFO","browser":"firefox","parallel":false,"baseUrl":"","arrowModuleRoot":"myDir/arrow/","dimensions":"myDir/arrow/config/dimensions.json","defaultTestHost":"myDir/arrow/lib/client/testHost.html","defaultAppSeed":"//cdnjs.cloudflare.com/ajax/libs/yui/3.15.0/yui-min.js","autolib":"myDir/arrow/lib/common","useYUISandbox":false,"sandboxYUIVersion":"3.8.0","yuiSandboxRuntime":"myDir/arrow/lib/client/yui-test-runtime.js","engine":"yui","engineConfig":"","testSeed":"myDir/arrow/lib/client/yuitest-seed.js","testRunner":"myDir/arrow/lib/client/yuitest-runner.js","shareLibPath":["myDir/arrow/sharelib","./common"],"scanShareLibPrefix":[],"scanShareLibRecursive":true,"enableShareLibYUILoader":false,"descriptorName":"test_descriptor.json","minPort":10000,"maxPort":11000,"coverage":false,"coverageExclude":"","exitCode":true,"retryCount":0,"keepIstanbulCoverageJson":false,"color":true,"report":true,"testTimeOut":30000,"ignoreSslErrorsPhantomJs":true,"startPhantomJs":false,"startArrowServer":false,"lib":"demo/greeter.js","artifactsUrl":""},"webdriver":null,"testName":"Default","args":{"config":{},"params":{"lib":"myDir/arrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDir/arrow/config/config.js","test":"demo/test-greeter.js","page":"myDir/arrow/lib/client/testHost.html","customController":false},"testName":"Default","driver":"nodejs","browser":""},"reports":{"logger":{"category":"ReportStack","_events":{}},"report":{"results":[{"name":"Our First Test","passed":1,"failed":0,"errors":0,"ignored":0,"total":1,"duration":7,"type":"report","testCase_yui_3_8_0_1_1399320191546_6":{"name":"testCase_yui_3_8_0_1_1399320191546_6","passed":1,"failed":0,"errors":0,"ignored":0,"total":1,"duration":4,"type":"testcase","test greet":{"result":"pass","message":"Test passed","type":"test","name":"test greet","duration":1}},"timestamp":"Mon May 05 2014 13:03:11 GMT-0700 (PDT)","ua":"nodejs"}]},"stkReportAtom":[{"results":[{"name":"Our First Test","passed":1,"failed":0,"errors":0,"ignored":0,"total":1,"duration":7,"type":"report","testCase_yui_3_8_0_1_1399320191546_6":{"name":"testCase_yui_3_8_0_1_1399320191546_6","passed":1,"failed":0,"errors":0,"ignored":0,"total":1,"duration":4,"type":"testcase","test greet":{"result":"pass","message":"Test passed","type":"test","name":"test greet","duration":1}},"timestamp":"Mon May 05 2014 13:03:11 GMT-0700 (PDT)","ua":"nodejs"}]}]},"arrowServerBase":"","isMobile":false}}],"arrWDSessions":[],"driver":"nodejs","testSuiteName":"ARROW TESTSUITE","timeReport":{"undefined":[]}};

            var ss = new SessionFactory({},{});
            A.isFalse(ss.isFailure(reportObj), "Report Object does not contain failure. isFailure() should return false");

        },

        testExitFailureNoReportObj: function() {

            var reportObj =
            {"reportFolder":"arrow-target","arrTestSessions":[{"logger":{"category":"TestSession","_events":{}},"args":{"config":{},"params":{"lib":"myDir/arrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDir/arrow/config/config.js","test":"demo/test-greeter.js","page":"myDir/arrow/lib/client/testHost.html","customController":false},"testName":"Default","driver":"nodejs","browser":""},"config":{"seleniumHost":"http://localhost:4444/wd/hub","phantomHost":"http://localhost:4445/wd/hub","context":"","defaultAppHost":"","logLevel":"INFO","browser":"firefox","parallel":false,"baseUrl":"","arrowModuleRoot":"myDir/arrow/","dimensions":"myDir/arrow/config/dimensions.json","defaultTestHost":"myDir/arrow/lib/client/testHost.html","defaultAppSeed":"//cdnjs.cloudflare.com/ajax/libs/yui/3.15.0/yui-min.js","autolib":"myDir/arrow/lib/common","useYUISandbox":false,"sandboxYUIVersion":"3.8.0","yuiSandboxRuntime":"myDir/arrow/lib/client/yui-test-runtime.js","engine":"yui","engineConfig":"","testSeed":"myDir/arrow/lib/client/yuitest-seed.js","testRunner":"myDir/arrow/lib/client/yuitest-runner.js","shareLibPath":["myDir/arrow/sharelib","./common"],"scanShareLibPrefix":[],"scanShareLibRecursive":true,"enableShareLibYUILoader":false,"descriptorName":"test_descriptor.json","minPort":10000,"maxPort":11000,"coverage":false,"coverageExclude":"","exitCode":true,"retryCount":0,"keepIstanbulCoverageJson":false,"color":true,"report":true,"testTimeOut":30000,"ignoreSslErrorsPhantomJs":true,"startPhantomJs":false,"startArrowServer":false,"lib":"demo/greeter.js","artifactsUrl":""},"driverName":"nodejs","testConfig":{},"retryCount":1,"screenShotPaths":[],"testParams":{"lib":"myDir/arrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDir/arrow/config/config.js","test":"demo/test-greeter.js","page":"myDir/arrow/lib/client/testHost.html","customController":false},"startTime":1399320190344,"endTime":1399320192116,"driver":{"logger":{"category":"NodeDriver","_events":{}},"config":{"seleniumHost":"http://localhost:4444/wd/hub","phantomHost":"http://localhost:4445/wd/hub","context":"","defaultAppHost":"","logLevel":"INFO","browser":"firefox","parallel":false,"baseUrl":"","arrowModuleRoot":"myDir/arrow/","dimensions":"myDir/arrow/config/dimensions.json","defaultTestHost":"myDir/arrow/lib/client/testHost.html","defaultAppSeed":"//cdnjs.cloudflare.com/ajax/libs/yui/3.15.0/yui-min.js","autolib":"myDir/arrow/lib/common","useYUISandbox":false,"sandboxYUIVersion":"3.8.0","yuiSandboxRuntime":"myDir/arrow/lib/client/yui-test-runtime.js","engine":"yui","engineConfig":"","testSeed":"myDir/arrow/lib/client/yuitest-seed.js","testRunner":"myDir/arrow/lib/client/yuitest-runner.js","shareLibPath":["myDir/arrow/sharelib","./common"],"scanShareLibPrefix":[],"scanShareLibRecursive":true,"enableShareLibYUILoader":false,"descriptorName":"test_descriptor.json","minPort":10000,"maxPort":11000,"coverage":false,"coverageExclude":"","exitCode":true,"retryCount":0,"keepIstanbulCoverageJson":false,"color":true,"report":true,"testTimeOut":30000,"ignoreSslErrorsPhantomJs":true,"startPhantomJs":false,"startArrowServer":false,"lib":"demo/greeter.js","artifactsUrl":""},"webdriver":null,"testName":"Default","args":{"config":{},"params":{"lib":"myDir/arrow/lib/common/yui-arrow.js,demo/greeter.js","driver":"nodejs","report":true,"exitCode":true,"argv":{"remain":["demo/test-greeter.js"],"cooked":["demo/test-greeter.js","--lib","demo/greeter.js","--driver","nodejs","--report","true","--exitCode","true"],"original":["demo/test-greeter.js","--lib=demo/greeter.js","--driver=nodejs","--report=true","--exitCode=true"]},"config":"myDir/arrow/config/config.js","test":"demo/test-greeter.js","page":"myDir/arrow/lib/client/testHost.html","customController":false},"testName":"Default","driver":"nodejs","browser":""},"reports":{"logger":{"category":"ReportStack","_events":{}},"stkReportAtom":[{"results":[{"name":"Our First Test","passed":1,"failed":0,"errors":0,"ignored":0,"total":1,"duration":7,"type":"report","testCase_yui_3_8_0_1_1399320191546_6":{"name":"testCase_yui_3_8_0_1_1399320191546_6","passed":1,"failed":0,"errors":0,"ignored":0,"total":1,"duration":4,"type":"testcase","test greet":{"result":"pass","message":"Test passed","type":"test","name":"test greet","duration":1}},"timestamp":"Mon May 05 2014 13:03:11 GMT-0700 (PDT)","ua":"nodejs"}]}]},"arrowServerBase":"","isMobile":false}}],"arrWDSessions":[],"driver":"nodejs","testSuiteName":"ARROW TESTSUITE","timeReport":{"undefined":[]}};

            var ss = new SessionFactory({},{});
            A.isFalse(ss.isFailure(reportObj), "Report Object does not have report. isFailure() should return false");

        },

        testExitFailureFalseEmptyReportObj: function() {

            var reportObj =
            {};

            var ss = new SessionFactory({},{});
            A.isFalse(ss.isFailure(reportObj), "Report Object does not contain failure. isFailure() should return false");

        }

    }));

    suite.add(new Y.Test.Case({

        name : "Call getFactoryTests with no config",

        testGetFactoryTestWithDescriptorSharedParams: function() {
            var ss = new SessionFactory({"dimensions" : arrowRoot + "/config/dimensions.json", "arrowModuleRoot" : arrowRoot + "/", "arrDescriptor": [__dirname + "/testdata/test_descriptor_noConfig.json"]},
                    {}),
                t;
            t = ss.getFactoryTests();
            A.areEqual(2, t.length, "There should be 2 test objects");

        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call getFactoryTests with descriptor importing",

        testGetFactoryTestWithDescriptorImporting: function() {
            Y.log("dir:" + __dirname);
            var ss = new SessionFactory({"dimensions" : arrowRoot + "/config/dimensions.json", "arrowModuleRoot" : arrowRoot + "/", "arrDescriptor" : [__dirname + "/testdata/test_descriptor_importDescriptor.json"]}, {}),
                t,
                expectedLibPath = __dirname + "/testdata/lib/test-imported-lib.js";

            global.workingDirectory = arrowRoot;

            t = ss.getFactoryTests();
            
            A.areEqual(3, t.length, "There should be 3 test objects");
            A.areEqual(expectedLibPath, t[2].params.lib, "lib of imprted descriptor should be composed with correct relative path");
        }
    }));


    Y.Test.Runner.add(suite);

}, '0.0.1', {requires: ['test']});