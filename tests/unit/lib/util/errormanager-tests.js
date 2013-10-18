/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('errormanager-tests', function(Y) {

    var path = require('path'),
        mockery = require('mockery'),
        arrowRoot = path.join(__dirname, '../../../..'),
        DriverClass,
        config,
        context,
        errorMgr,
        em,
        msg,
        suite = new Y.Test.Suite("Error Manager test suite"),
        origDim = 
        [
            {
                "dimensions": [
                    {
                        "environment": {
                            "development": {
                                "dev": null,
                                "test": null
                            },
                            "productions": {
                                "int": null,
                                "stage": null,
                                "prod": null
                            }
                        }
                    }
                ]
            }
        ],
        descSchema = {
            "name" : "test",
            "type" : "object",
            "properties" : {
                "name" : { "type" : "string", "required" :true },
                "commonlib" : { "type" : "string"},
                "config" : {
                    "type" : "object"
                },
                "dataprovider" : {
                    "type":"object",
                    "required":true,
                    "additionalProperties" : {
                        "type" : "object",
                        "properties" : {
                            "enabled" : { "type" : "boolean" },
                            "controller" : { "type" : "string" },
                            "group" : { "type" : "string" },
                            "browser" : { "type" : "string" },
                            "params" : {"type" : "object",
                                "properties" : {
                                    "page" : { "type" : "string" },
                                    "test" : { "type" : "string" },
                                    "lib" : { "type" : "string" }
                                }

                            }
                        },
                        "additionalProperties": false
                    }
                }
            },
            "additionalProperties": false
        },
        origDesc = [{
            "settings": [ "master" ],
            "name" : "Test descriptor",
            "config" : {},
            "dataprovider" : {}
        },{"settings": [ "environment:sss" ]}],
        dimensions = JSON.parse(JSON.stringify(origDim)),
        fsMock = {
            readFileSync: function (filename) {
                Y.log("fsMock: filename is "+filename);
                if (filename === undefined || filename.length === 0) {
                    throw new Error("fsMock: filename is empty or not defined.");
                } else if (filename.indexOf("schema") !== -1) {
                    fsMock.jsonMock = fsMock.schema || descSchema;
                } else if (filename.indexOf("descriptor") !== -1) {
                    fsMock.jsonMock = fsMock.descriptor || origDesc;
                } else if (filename.indexOf("dimensions") !== -1) {
                    fsMock.jsonMock = fsMock.dimensions || dimensions;
                }
                return filename !== "error" ? JSON.stringify(fsMock.jsonMock) : 'error';
            },
            readdirSync : function () {
            }
        },
        mocks = {
            invokeCount : 0,
            message : undefined,
            error: function (message) {
                mocks.message = message;
            },
            exit: function (code) {
                mocks.invokeCount = mocks.invokeCount + 1;
                throw new Error("exit code is "+code);
            }
        },
        origArgv = {
            dimensions : undefined,
            argv : {
                remain : ["test-descriptor.json"],
                cooked : ["--context", "environment:qa1"]
            }
        },
        seleniumDriver;

    suite.setUp = function() {
        mockery.enable();
        //replace fs with our fsMock
        mockery.registerMock('fs', fsMock);
        //explicitly telling mockery using the actual fsclient is OK
        //without registerAllowable, you will see WARNING in test output
        mockery.registerAllowable('../fsclient');

        global.appRoot = arrowRoot;
        config = require(arrowRoot+'/config/config.js');
        context = {};

        errorMgr = require(arrowRoot+'/lib/util/errormanager.js');
        em = errorMgr.getInstance();
        msg = errorMgr.getMessage();
    };

    suite.tearDown = function() {
        mockery.deregisterAll();
        mockery.disable();
    };

    suite.add(new Y.Test.Case({
        "should take empty context": function(){
            Y.Assert.isNotNull(new errorMgr(context), "Make sure Error Manager is not null");
        }
    }));

    suite.add(new Y.Test.Case({
        "should get instance": function(){
            Y.Assert.isNotNull(em, "Make sure instance of Error Manager is not null");
        }
    }));

    suite.add(new Y.Test.Case({
        "should get error message module": function(){
            Y.Assert.isNotNull(msg, "Make sure error message module of Error Manager is not null");
        }
    }));

    suite.add(new Y.Test.Case({
        "should get error message 1000": function(){
            Y.Assert.isNotNull(msg["1000"], "Make sure error message 1000 is not null");
        }
    }));

    suite.add(new Y.Test.Case({
        "should have error function": function(){
            Y.Assert.areSame("function", typeof em.error, "Make sure error function exist");
        }
    }));

    suite.add(new Y.Test.Case({
        "should have error message template": function(){
            Y.Assert.isNotNull(msg, "Make sure error message template exist");
        }
    }));

    suite.add(new Y.Test.Case({
        "error() should throw exception if error code is not defined": function(){
            var code = -111;
            try {
                em.error(code);
                Y.Assert.isTrue(false);
            } catch (e) {
                Y.Assert.areSame("Error code "+code+" is not defined.", e.message);
            }
        }
    }));

    suite.add(new Y.Test.Case({
        "error() should return empty string if no argument": function(){
            Y.Assert.areSame("",
                em.error());
        }
    }));

    suite.add(new Y.Test.Case({
        "error() should return error message template if no additional arguments": function(){
            msg.unknown = "Unknown error : {0}";
            Y.Assert.areSame("Unknown error : {0}",
                em.error(msg.unknown));
        }
    }));

    suite.add(new Y.Test.Case({
        "error() should keep placeholder if argument is not defined": function(){
            msg.unknown = "Unknown error : {0}";
            Y.Assert.areSame("Unknown error : {0}",
                em.error(msg.unknown, undefined));
        }
    }));

    suite.add(new Y.Test.Case({
        "error() should return error message with one string parameter": function(){
            msg.unknown = "Unknown error : {0}";
            Y.Assert.areSame("Unknown error : first message",
                em.error(msg.unknown, "first message"));
        }
    }));

    suite.add(new Y.Test.Case({
        "error() should return error message with two string parameters": function(){
            msg.unknown2 = "Unknown error : {0} {1}";
            Y.Assert.areSame("Unknown error : first message additional message",
                em.error(msg.unknown2, "first message", "additional message"));
        }
    }));

    suite.add(new Y.Test.Case({
        "error() should support error code": function(){
            var code = 999;
            msg[code] = {name:"ERRNAME",text:"This is an error message."};
            Y.Assert.areSame(
                '999 (ERRNAME) This is an error message.',
                em.error(code)
            );
        }
    }));

    suite.add(new Y.Test.Case({
        "error() should support error code with default values": function(){
            var code = 999;
            msg[code] = {name:"ERRNAME",text:"This is an error message and value {0} {1} {2}",0:"zero",1:"one",2:"two"};
            Y.Assert.areSame(
                '999 (ERRNAME) This is an error message and value zero one two',
                em.error(code)
            );
        }
    }));

    suite.add(new Y.Test.Case({
        "error() should support error code but error name is optional": function(){
            var code = 999;
            msg[code] = {text:"This is an error message."};
            Y.Assert.areSame(
                '999 This is an error message.',
                em.error(code)
            );
        }
    }));

    suite.add(new Y.Test.Case({
        "errorCallback() should do nothing if no argument": function(){
            em.errorCallback();
        }
    }));

    suite.add(new Y.Test.Case({
        "errorCallback() should callback if callback function is provided": function(){
            var count = 0;
            em.errorCallback(function() { count = count + 1; });
            Y.Assert.areSame(1,count);
        }
    }));

    suite.add(new Y.Test.Case({
        "errorCallback() should callback with error message": function(){
            var error = "";
            em.errorCallback("error", function(message) { error = message; });
            Y.Assert.areSame("error", error);
        }
    }));

    suite.add(new Y.Test.Case({
        "errorCallback() should callback with error message replaced by one parameter": function(){
            var error = "";
            em.errorCallback("error callback is {0}", function(message) { error = message; });
            Y.Assert.areSame("error callback is function (message) { error = message; }", error);
        }
    }));

    suite.add(new Y.Test.Case({
        "errorCallback() should callback with error message replaced by additional string parameter": function(){
            var error = "";
            em.errorCallback("error message is {0}", "first message", function(message) { error = message; });
            Y.Assert.areSame("error message is first message", error);
        }
    }));

    suite.add(new Y.Test.Case({
        "ArrowSetup errorCheck should exit if enviroment is missing in dimensions file": function(){
            var ArrowSetup = require(arrowRoot+'/lib/util/arrowsetup.js'), arrow=undefined, exit="";

            mocks.invokeCount = 0;
            mocks.message = undefined;
            dimensions = JSON.parse(JSON.stringify(origDim));
            args = JSON.parse(JSON.stringify(origArgv));
            args.dimensions = "./config/dimensions.json";
            msg[1000].name = "EDIMENVTEST";
            try {
                arrow = new ArrowSetup({},args);
                arrow.mock = mocks;
                arrow.errorCheck();
            } catch (e) {
                exit = e.message;
            } finally {
                Y.Assert.areSame("exit code is 1", exit, "should exit with exit code.");
                Y.Assert.areSame(
                    '1000 (EDIMENVTEST) The environment "qa1" is missing.\nPlease add environment "qa1" to dimensions file "./config/dimensions.json".',
                    mocks.message
                );                
                Y.Assert.areSame(1, mocks.invokeCount);                
            }
        }
    }));

    suite.add(new Y.Test.Case({
        'DataProvider should handle error "The settings group has already been added"': function() {
            var DataProvider = require(arrowRoot+'/lib/util/dataprovider.js'), dataProvider=undefined, exit="";
            mocks.invokeCount = 0;
            mocks.message = "No error message from testing";
            em.dimensionsFile = "./config/dimensions.json";
            msg[1003].name = "EDSCENVTEST";
            try {
                dataProvider = new DataProvider({dimensions:"./config/dimensions.json"},"test-descriptor.json");
                dataProvider.mock = mocks;
                dataProvider.getTestData();
            }
            catch (e) {
                exit = e.message;
            }
            finally {
                Y.Assert.areSame("exit code is 1", exit, "should exit with exit code.");
                Y.Assert.areSame(
                    '1003 (EDSCENVTEST) The settings {"environment":"sss"} is missing.\n'+
                    'Please add environment "sss" to dimensions file "./config/dimensions.json"\n'+
                    'or remove it from test descriptor file "test-descriptor.json".',
                    mocks.message
                );                
                Y.Assert.areSame(1, mocks.invokeCount);
            }
        }
    }));

    suite.add(new Y.Test.Case({
        'DataProvider should handle unknown dimensions error': function() {
            var DataProvider = require(arrowRoot+'/lib/util/dataprovider.js'), dataProvider=undefined, exit="";
            mocks.invokeCount = 0;
            mocks.message = "No error message from testing";
            em.dimensionsFile = "./config/dimensions.json";
            msg[1005].name = 'EDSCYCBTEST';
            fsMock.descriptor = [
                {"settings": [ "master" ], "name":"DataProvider should handle unknown dimensions error","config":{},"dataprovider":{}},
                {"settings": [ "unknown" ], "config":{}}
            ];
            try {
                dataProvider = new DataProvider({context:"environment:testing",dimensions:"./config/dimensions.json"},"test-descriptor.json");
                dataProvider.mock = mocks;
                dataProvider.getTestData();
            }
            catch (e) {
                exit = e.message;
            }
            finally {
                Y.Assert.areSame("exit code is 1", exit, "should exit with exit code.");
                Y.Assert.areSame(
                    '1005 (EDSCYCBTEST) YCB Variable Replacement Failed, Please check you descriptor file, test-descriptor.json.\n'+
                    "Error: The settings group '{}' has already been added.",
                    mocks.message
                );                
                Y.Assert.areSame(1, mocks.invokeCount);
            }
        }
    }));

    suite.add(new Y.Test.Case({
        setUp : function () {
            mockery.disable();
            mockery.deregisterAll();
        },
        'SeleniumDriver should handle error "Issue with loading page"': function() {
            var started = false, DriverClass = require(arrowRoot+'/lib/driver/selenium.js'),
            callback = function (errMsg) {
                started = true;
                Y.Assert.isNull(errMsg, 'Should have no error message');
            };
            DriverClass.wdAppPath = arrowRoot + '/tests/unit/stub/webdriver.js';
            seleniumDriver = new DriverClass({browser: 'mybrowser', seleniumHost: 'http://wdhub'}, {});
            seleniumDriver.mock = mocks;
            seleniumDriver.start(callback);
            Y.Assert.isTrue(started, 'Should have started driver');
            msg[1002].name = 'EREPORTEST';
            msg[1004].name = "EUNDEFTEST";
            try {
                throw new Error("ARROW is undefined");
            } catch(e) {
                callback = function (errMsg) {
                    started = true;
                    Y.Assert.areSame(
                        '1004 (EUNDEFTEST) Issue with loading testing page about:blank\n' +
                            'Possible cause :\n' +
                            'The page got redirected before completing the test, this happens if your page has auto-redirects ' +
                            'or your tests perform some UI action resulting into page change event. Please use a custom controller for these kind of issues.\n' +
                            'If you are already using custom controller, please check that you are using waitForElement(s) to ensure page is ready for executing test.\n' +
                            'For Arrow Usage, please refer to https://github.com/yahoo/arrow/blob/master/docs/arrow_cookbook/README.rst',
                        errMsg);
                };
                started = false;
                seleniumDriver.errorCheck(e, callback);
                Y.Assert.isTrue(started, 'Should callback with error message');
            }
            try {
                throw new Error("ECONNREFUSED");
            } catch(e) {
                callback = function (errMsg) {
                    started = true;
                    Y.Assert.areSame(
                        '1002 (EREPORTEST) Error: ECONNREFUSED while collecting test result on testing page "page URL is not available".\n',
                        errMsg);
                };
                started = false;
                seleniumDriver.errorCheck(e, callback);
                Y.Assert.isTrue(started, 'Should callback with error message');
            }
            try {
                throw new Error("This error message should be unknown to error manager.\nThis is second line.");
            } catch(e) {
                callback = function (errMsg) {
                    started = true;
                    Y.Assert.areSame(
                        '1002 (EREPORTEST) Error: This error message should be unknown to error manager. while collecting test result on testing page "about:blank".\nThis is second line.',
                        errMsg);
                };
                started = false;
                seleniumDriver.errorCheck(e, callback);
                Y.Assert.isTrue(started, 'Should callback with error message');
            }
        }
    }));

    Y.Test.Runner.add(suite);

}, '0.0.1' ,{requires:['test']});
