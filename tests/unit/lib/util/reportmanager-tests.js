/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 * 
 * @author ivan alonso
 */

YUI.add('reportmanager-tests', function(Y) {

    var suite = new Y.Test.Suite("Report Manager test suite"),
        path = require('path'),
        log4js = require("log4js"),
        logger = log4js.getLogger("ReportManagerTests"),
        fs = require('fs'),
        arrowRoot = path.join(__dirname, '../../../..'),
        RepManager = require(arrowRoot + '/lib/util/reportmanager.js'),
        FileUtil = require(arrowRoot + '/lib/util/fileutil.js'),
        A = Y.Assert;

    suite.add(new Y.Test.Case({

        "parse yui test results": function() {
            var rm,
                dtName = 'default',
                testJson = JSON.parse(fs.readFileSync(__dirname + "/config/test.json"));
            //testJson = '{"name":"Our First Test","passed":1,"failed":0,"errors":0,"ignored":0,"total":1,"duration":1,"type":"report","testCase1360382344391":{"passed":1,"name":"testCase1360382344391","failed":0,"errors":0,"ignored":0,"total":1,"duration":0,"type":"testcase","test greet":{"result":"pass","message":"Test passed","type":"test","name":"test greet","duration":0}},"timestamp":"Fri Feb 08 2013 19:59:04 GMT-0800 (PST)","ua":"nodejs"}';

            try {
                rm = new RepManager({});

                rm.parseYUIResults(testJson, dtName, rm);

            } catch (e) {
                Y.Assert.areEqual(null, e.toString(), "There should be no error");
            }
            Y.Assert.areEqual(true, true);

        },


        "add test failure": function() {
            var rm,
                time,
                className,
                name,
                failureMessage;

            try {
                rm = new RepManager({});
                time = 136035;
                className = 'testClass';
                name = 'test';
                failureMessage = "fail";

                rm.addTest(time, className, name, failureMessage);

                A.areEqual(rm.xw.toString(), '<testcase time="136.03" classname="testClass" name="test"><failure>fail</failure></testcase>',
                    'xml string - add test failure doesn\'t match');

            } catch (e) {
                Y.Assert.areEqual(null, e.toString(), "There should be no error");
            }
            Y.Assert.areEqual(true, true);

        },


        "add test failure skip": function() {
            var rm,
                time,
                className,
                name,
                failureMessage;

            try {
                rm = new RepManager({});
                time = 136035;
                className = 'testClass';
                name = 'test';
                failureMessage = "skip";

                rm.addTest(time, className, name, failureMessage);

                A.areEqual(rm.xw.toString(), '<testcase time="136.03" classname="testClass" name="test" executed="false"/>', 'xml string - add test failure skip doesn\'t match');

            } catch (e) {
                Y.Assert.areEqual(null, e.toString(), "There should be no error");
            }
            Y.Assert.areEqual(true, true);

        },

        "add test no failure": function() {
            var rm,
                time,
                className,
                name,
                failureMessage;

            try {
                rm = new RepManager({});
                time = 136035;
                className = 'testClass';
                name = 'test';

                rm.addTest(time, className, name, failureMessage);

                A.areEqual(rm.xw.toString(), '<testcase time="136.03" classname="testClass" name="test"/>', 'xml string doesn\'t match');

            } catch (e) {
                Y.Assert.areEqual(null, e.toString(), "There should be no error");
            }
            Y.Assert.areEqual(true, true);

        },

        "add property": function() {

            try {
                var rm = new RepManager({});
                rm.addProperty("driver", "nodejs");
//                rm.addProperty("nodriver",undefined);
                A.areEqual(rm.xw.toString(), '<property name="driver" value="nodejs"/>', 'Xml writer - property string doesn\'t match');
            } catch (e) {
                Y.Assert.areEqual(null, e.toString(), "There should be no error");
            }
            Y.Assert.areEqual(true, true);

        },

        "add property undefined value": function() {

            try {
                var rm = new RepManager({});
                rm.addProperty("nodriver", undefined);
                A.areEqual(rm.xw.toString(), '', 'Xml writer - property string doesn\'t match');
            } catch (e) {
                Y.Assert.areEqual(null, e.toString(), "There should be no error");
            }
            Y.Assert.areEqual(true, true);

        },

        "show reports on console fail ": function() {

            try {
                //                global.color = false;
                var
                    result = JSON.parse(fs.readFileSync(__dirname + "/config/resultfail.json")),
                    verbose,
                    rm = new RepManager({});
                rm.showReportOnConsole(result, verbose);

            } catch (e) {
                Y.Assert.areEqual(null, e.toString(), "There should be no error");
            }
            Y.Assert.areEqual(true, true);
        },

        "show reports on console pass ": function() {

            try {
                //                global.color = false;
                var
                    result = JSON.parse(fs.readFileSync(__dirname + "/config/resultpass.json")),
                    verbose,
                    rm = new RepManager({});
                rm.showReportOnConsole(result, verbose);

            } catch (e) {
                Y.Assert.areEqual(null, e.toString(), "There should be no error");
            }
            Y.Assert.areEqual(true, true);
        },

//        TODO - Enable this test
//        "writeReports With Blank reportObj": function() {
//
//            try {
//                var rm = new RepManager({});
//                rm.writeReports();
//            } catch (e) {
//                Y.Assert.areEqual(null, e.toString(), "There should be no error");
//            }
//            Y.Assert.areEqual(true, true);
//        },


        "writeReports With reportObj - Only report folder": function() {

            try {
                //                global.color = false;
                var reportObj = JSON.parse(fs.readFileSync(__dirname + "/config/reportObjectReportFolder.json")),
                    rm = new RepManager(reportObj);
                //                rm.writeReports();
                //                global.color = true;
            } catch (e) {
                Y.Assert.areEqual(null, e.toString(), "There should be no error");
            }
            Y.Assert.areEqual(true, true);
        },


        "writeReports With Proper reportObj": function() {
//
            try {
                //                global.color = false;
                var reportObj = JSON.parse(fs.readFileSync(__dirname + "/config/reportObject.json")),
                    rm = new RepManager(reportObj);
                global.reportFolder = arrowRoot + "/tests/unit/lib/util/config/reportFolder";

                //rm.writeReports();   //TODO
                //                global.color = true;
            } catch (e) {
                Y.Assert.areEqual(null, e.toString(), "There should be no error");
            }
            Y.Assert.areEqual(true, true);
        },

        "writeReports With Scenario Report" : function() {

            var testSessionObj,
                arrowRoot = path.join(__dirname, '../../../..'),
                TestSession = require(arrowRoot + '/tests/unit/lib/util/testSession.js'),
                report = JSON.parse(fs.readFileSync(__dirname + "/config/scenarioreport.json")),
                testSessionsArr = [],
                rm,
                i,
                reportObj,
                fileUtil = new FileUtil();

            // Instantiate test session object, true for scenario
            testSessionObj = new TestSession(report, true);

            testSessionsArr.push(testSessionObj);

            // Instantiate report manager with report object

            reportObj = {
                "arrTestSessions" : testSessionsArr,
                "arrWDSessions" : "",
                "descriptor" : "dummyDescriptor.json",
                "reuseSession" : "dummyReuseSession",
                "testSuiteName" : "dummyTestSuite",
                "driver" : "dummyDriver",
                "browser" : "dummyBrowser",
                "group" : "dummyGroup",
                "testName" : "dummyTestname"
            };
            global.reportFolder =  "reportFolder";
            fileUtil.createDirectory(path.resolve(global.reportFolder, 'arrow-report'));

            rm = new RepManager(reportObj);

            rm.writeReports();

            // Clean up

            fs.unlink(path.resolve(global.reportFolder, 'arrow-report', 'dummyDescriptor-report.json'),

                function(err) {
                    if (err) {
                        console.log('Can\'t cleanup the dummy descriptor json report file..' + err);
                    } else {
                        console.log('Cleaned up the dummy descriptor json report file..');
                    }
                });

            fs.unlink(path.resolve(global.reportFolder, 'arrow-report', 'dummyDescriptor-report.xml'),
                function(err) {
                    if (err) {
                        console.log('Can\'t cleanup the dummy descriptor xml report file..' + err);
                    } else {
                        console.log('Cleaned up the dummy descriptor xml report file..');
                    }
                });

        },


        "writeReports With Result Report" : function() {
            var testSessionObj,
                arrowRoot = path.join(__dirname, '../../../..'),
                TestSession = require(arrowRoot + '/tests/unit/lib/util/testSession.js'),
                report = JSON.parse(fs.readFileSync(__dirname + "/config/resultreport.json")),
                testSessionsArr = [],
                rm,
                i,
                reportObj,
                fileUtil = new FileUtil();


            testSessionObj = new TestSession(report);

            testSessionsArr.push(testSessionObj);

            // Instantiate report manager with report object

            reportObj = {
                "arrTestSessions" : testSessionsArr,
                "arrWDSessions" : "",
                "descriptor" : "dummyDescriptor.json",
                "reuseSession" : "dummyReuseSession",
                "testSuiteName" : "dummyTestSuite",
                "driver" : "dummyDriver",
                "browser" : "dummyBrowser",
                "group" : "dummyGroup",
                "testName" : "dummyTestname"
            };
            global.reportFolder =  "reportFolder";
            fileUtil.createDirectory(path.resolve(global.reportFolder, 'arrow-report'));

            rm = new RepManager(reportObj);


            rm.writeReports();

            // Clean up

            fs.unlink(path.resolve(global.reportFolder, 'arrow-report', 'dummyDescriptor-report.json'),
                function(err) {
                    if (err) {
                        console.log('Can\'t cleanup the dummy descriptor json report file..' + err);
                    } else {
                        console.log('Cleaned up the dummy descriptor json report file..');
                    }
                });

            fs.unlink(path.resolve(global.reportFolder, 'arrow-report', 'dummyDescriptor-report.xml'),
                function(err) {
                    if (err) {
                        console.log('Can\'t cleanup the dummy descriptor xml report file..' + err);
                    } else {
                        console.log('Cleaned up the dummy descriptor xml report file..');
                    }
                });

        },


        "writeReports With Result Report - Result not present" : function() {

            var testSessionObj,
                arrowRoot = path.join(__dirname, '../../../..'),
                TestSession = require(arrowRoot + '/tests/unit/lib/util/testSession.js'),
                report = JSON.parse(fs.readFileSync(__dirname + "/config/resultreportResultNotPresent.json")),
                testSessionsArr = [],
                rm,
                i,
                reportObj,
                fileUtil = new FileUtil();

            testSessionObj = new TestSession(report);

            testSessionsArr.push(testSessionObj);

            // Instantiate report manager with report object

            reportObj = {
                "arrTestSessions" : testSessionsArr,
                "arrWDSessions" : "",
                "descriptor" : "dummyDescriptor.json",
                "reuseSession" : "dummyReuseSession",
                "testSuiteName" : "dummyTestSuite",
                "driver" : "dummyDriver",
                "browser" : "dummyBrowser",
                "group" : "dummyGroup",
                "testName" : "dummyTestname"
            };
            global.reportFolder = "reportFolder";
            fileUtil.createDirectory(path.resolve(global.reportFolder, 'arrow-report'));

            rm = new RepManager(reportObj);

            rm.writeReports();

            // Clean up

            fs.unlink(path.resolve(global.reportFolder, 'arrow-report', 'dummyDescriptor-report.json'),
                function(err) {
                    if (err) {
                        console.log('Can\'t cleanup the dummy descriptor json report file..' + err);
                    } else {
                        console.log('Cleaned up the dummy descriptor json report file..');
                    }
                });

            fs.unlink(path.resolve(global.reportFolder, 'arrow-report', 'dummyDescriptor-report.xml'),
                function(err) {
                    if (err) {
                        console.log('Can\'t cleanup the dummy descriptor xml report file..' + err);
                    } else {
                        console.log('Cleaned up the dummy descriptor xml report file..');
                    }
                });

        }




    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires: ['test']});