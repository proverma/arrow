/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


YUI.add('dataprovider-tests', function (Y) {

    var conf = {
        "baseUrl": "",
        "arrowModuleRoot": __dirname + "/",
        "dimensions": __dirname + "/dimensions.json",
        "context": ""
    };
    var args = {};
    var fs = require("fs");
    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        dataProv = require(arrowRoot+'/lib/util/dataprovider.js'),
        suite = new Y.Test.Suite("Data Provider test suite");

    var dp = new dataProv(conf, args, __dirname + "/testDescriptor.json");
    var dpvalues = dp.getTestData();

    dp.mock = {
        exit: function (code) {
            throw new Error("exit code is "+code);
        }
    };

    suite.add(new Y.Test.Case({
        "Confirm constructor works": function(){
            Y.Assert.isNotNull(dp, "Confirm initiallizing does not return null");
        }
    }));

    //Test getting all values in a descriptor
    suite.add(new Y.Test.Case({
        "Confirm Config params": function(){
            Y.Assert.areEqual("tabview", dpvalues[0].name);
            Y.Assert.areEqual("./test-lib.js", dpvalues[0].commonlib);
            Y.Assert.areEqual("<yourhostname>:8033", dpvalues[0].config.baseUrl);
        }
    }));

    suite.add(new Y.Test.Case({
        "Confirm dataprovider values": function(){
            Y.Assert.areEqual("test-func.js", dpvalues[0].dataprovider.test1.params.test);
            Y.Assert.areEqual("testMock.html", dpvalues[0].dataprovider.test1.params.page);
            Y.Assert.areEqual("unit", dpvalues[0].dataprovider.test1.group);
        }
    }));

    //Test overriding values in the descriptor using $$ value
    suite.add(new Y.Test.Case({
        "Confirm you can share config values within descriptor": function(){
            Y.Assert.areEqual("<yourhostname>:8033/testMock.html", dpvalues[0].dataprovider.test2.params.page);
            Y.Assert.areEqual("sometest.js", dpvalues[0].dataprovider.test2.params.test);
        }
    }));

    //test overriding values in the config, such as baseUrl, or any other config-like value
    suite.add(new Y.Test.Case({
        "Confirm values in config, override those in the descriptor": function(){
            var conf = {
                "baseUrl": "http://overridebase.url.com",
                "arrowModuleRoot": __dirname + "/",
                "dimensions": __dirname + "/dimensions.json",
                "context": ""
            },
                args = {};

            var dp = new dataProv(conf, args, __dirname + "/testDescriptor.json");

            dp.mock = {
                exit: function (code) {
                    throw new Error("exit code is "+code);
                }
            };

            var dpvalues = dp.getTestData();

            Y.Assert.areEqual("http://overridebase.url.com/testMock.html", dpvalues[0].dataprovider.test2.params.page);
            Y.Assert.areEqual("sometest.js", dpvalues[0].dataprovider.test2.params.test);
        }
    }));

    //Test context and dimensions
    suite.add(new Y.Test.Case({
        "Test Context and Dimensions": function(){
            var conf = {
                "baseUrl": "http://overridebase.url.com",
                "arrowModuleRoot": __dirname + "/",
                "dimensions": __dirname + "/dimensions.json",
                "context": "environment:development",
                "replaceParamJSON" : __dirname + "/replaceParams/replaceParam.json",
                "defaultParamJSON" : __dirname + "/replaceParams/defaultParam.json"
            },
                args = {};

            var dp = new dataProv(conf, args,__dirname + "/testDescriptor.json");
            dp.mock = {
                exit: function (code) {
                    throw new Error("exit code is "+code);
                }
            };
            var dpvalues = dp.getTestData();

            Y.Assert.areEqual("http://overridebase.url.com/testMock.html", dpvalues[0].dataprovider.test2.params.page);
            Y.Assert.areEqual("sometest.js", dpvalues[0].dataprovider.test2.params.test);
        }
    }));


    suite.add(new Y.Test.Case({
        "blank json string": function() {
            var conf = {},
                args = {};

            var dp = new dataProv(conf, args,__dirname + "/testDescriptor.json"),
                blankJson = dp.readAndValidateJSON('');

            Y.Assert.areEqual(blankJson, undefined);
        }
    }));

    suite.add(new Y.Test.Case({
        "Empty json string": function() {
            var conf = {},
                args = {};

            var dp = new dataProv(conf, args, __dirname + "/testDescriptor.json"),
                emptyJson = dp.readAndValidateJSON('{}');

            Y.Assert.areEqual(JSON.stringify(emptyJson), '{}');
        }
    }));

    suite.add(new Y.Test.Case({
        "Valid json string": function() {
            var conf = {},
                args = {};

            var dp = new dataProv(conf, args,__dirname + "/testDescriptor.json"),
                validJson = dp.readAndValidateJSON('{"key1":"value1","key2":"value2"}');

            Y.Assert.areEqual(JSON.stringify(validJson), '{"key1":"value1","key2":"value2"}');
        }
    }));

    suite.add(new Y.Test.Case({
        "Valid json from file": function() {
            var conf = {},
                args = {};

            var dp = new dataProv(conf, args,__dirname + "/testDescriptor.json"),
                validJson = dp.readAndValidateJSON(__dirname + '/replaceParams/replaceParam.json');

            Y.Assert.areEqual(JSON.stringify(validJson), '{"site":"yahoo","property":"news"}');
        }
    }));


    suite.add(new Y.Test.Case({

        "Invalid json from file": function() {

            var msg;

            try {
                dp.readAndValidateJSON(__dirname + '/invalid.json');
            }
            catch(e) {
                msg = e;
            }
            Y.Assert.areEqual( "exit code is 1", msg.message,"readAndValidateJSON() did not throw exception for invalid JSON from file");
        }
    }));


    suite.add(new Y.Test.Case({

        "Invalid json ": function() {

            var msg;

            try {
                dp.readAndValidateJSON('{\'a\'}');
            }
            catch(e) {
                msg = e;
            }
            Y.Assert.areEqual( "exit code is 1", msg.message, "readAndValidateJSON() did not throw exception for invalid JSON");
        }
    }));


    suite.add(new Y.Test.Case({

        "Invalid descriptorjson ": function() {

            var conf = {},
                args = {};

            var dp = new dataProv(conf, args,__dirname + "/invalid.json");
            var msg;
            dp.mock = {
                exit: function (code) {
                    throw new Error("exit code is "+code);
                }
            };


            try {
                dp.getTestData();
            }
            catch(e) {
                msg = e;
            }
            Y.Assert.areEqual( "exit code is 1", msg.message, "getTestData() did not throw exception for invalid JSON");
        }
    }));


    suite.add(new Y.Test.Case({

        "Validate descriptor against schema ": function() {

            var msg,
                descriptor;

            try {

                descriptor = fs.readFileSync(__dirname + '/testDescriptorInvalidSchema.json','utf-8');
                descriptor = JSON.parse(descriptor);
                dp.validateDescriptor(descriptor, __dirname + "/config/descriptor-schema.json");

            }
            catch(e) {
                msg = e;
            }

            Y.Assert.areEqual( "exit code is 1", msg.message, "validateDescriptor() did not throw exception for invalid schema");

        }
    }));

    suite.add(new Y.Test.Case({

        "Validate descriptor against schema - wrong path for schema ": function() {

            var msg,
                descriptor;

            try {

                descriptor = fs.readFileSync(__dirname + '/testDescriptorInvalidSchema.json','utf-8');
                descriptor = JSON.parse(descriptor);
                dp.validateDescriptor(descriptor, __dirname + "/config/descriptor-schema-invalid.json");

            }
            catch(e) {
                msg = e;
            }

            Y.Assert.areEqual( "exit code is 1", msg.message, "validateDescriptor() did not throw exception for invalid schema file");

        }
    }));

    suite.add(new Y.Test.Case({
        "Replace params": function(){
            var conf = {
                "baseUrl": "http://overridebase.url.com",
                "arrowModuleRoot": __dirname + "/",
                "dimensions": __dirname + "/dimensions.json",
                "context": "environment:development",
                "replaceParamJSON" : __dirname + "/replaceParams/replaceParam.json"
            },
                args = {};

            var dp = new dataProv(conf, args,__dirname + "/testDescriptorWithParams.json"),
                descriptorJsonStr = fs.readFileSync(__dirname + "/testDescriptorWithParams.json", "utf-8"),
                descriptorJson = JSON.parse(descriptorJsonStr),
                descriptorWithReplacedParams = dp.getDescriptorWithReplacedParams(descriptorJson);

            Y.Assert.areEqual(JSON.stringify(descriptorWithReplacedParams),
                '[{"config":{"baseUrl":"http://news.yahoo.com"}}]');

        }
    }));

    suite.add(new Y.Test.Case({
        "Replace params and default params": function(){
            var conf = {
                "baseUrl": "http://overridebase.url.com",
                "arrowModuleRoot": __dirname + "/",
                "dimensions": __dirname + "/dimensions.json",
                "context": "environment:development",
                "replaceParamJSON" : __dirname + "/replaceParams/replaceParam.json",
                "defaultParamJSON" : __dirname + "/replaceParams/defaultParam.json"

            },
                args = {};

            var dp = new dataProv(conf, args, __dirname + "/testDescriptorWithParams.json"),
                descriptorJsonStr = fs.readFileSync(__dirname + "/testDescriptorWithParams.json", "utf-8"),
                descriptorJson = JSON.parse(descriptorJsonStr),
                descriptorWithReplacedParams = dp.getDescriptorWithReplacedParams(descriptorJson);

            Y.Assert.areEqual(JSON.stringify(descriptorWithReplacedParams),
                '[{"config":{"baseUrl":"http://news.yahoo.com"}}]');

        }
    }));


    suite.add(new Y.Test.Case({
        "Only default params": function(){
            var conf = {
                "baseUrl": "http://overridebase.url.com",
                "arrowModuleRoot": __dirname + "/",
                "dimensions": __dirname + "/dimensions.json",
                "context": "environment:development",
                "defaultParamJSON" : __dirname + "/replaceParams/defaultParam.json"

            },
                args = {};

            var dp = new dataProv(conf, args,__dirname + "/testDescriptorWithParams.json"),
                descriptorJsonStr = fs.readFileSync(__dirname + "/testDescriptorWithParams.json", "utf-8"),
                descriptorJson = JSON.parse(descriptorJsonStr),
                descriptorWithReplacedParams = dp.getDescriptorWithReplacedParams(descriptorJson);

            Y.Assert.areEqual(JSON.stringify(descriptorWithReplacedParams),
                '[{"config":{"baseUrl":"http://finance.google.com"}}]');

        }
    }));


    suite.add(new Y.Test.Case({
        "Inherit param from default params": function(){
            var conf = {
                "baseUrl": "http://overridebase.url.com",
                "arrowModuleRoot": __dirname + "/",
                "dimensions": __dirname + "/dimensions.json",
                "context": "environment:development",
                "replaceParamJSON" : __dirname + "/replaceParams/replaceParam2.json",
                "defaultParamJSON" : __dirname + "/replaceParams/defaultParam.json"
            },
                args = {};

            var dp = new dataProv(conf, args,__dirname + "/testDescriptorWithParams.json"),
                descriptorJsonStr = fs.readFileSync(__dirname + "/testDescriptorWithParams.json", "utf-8"),
                descriptorJson = JSON.parse(descriptorJsonStr),
                descriptorWithReplacedParams = dp.getDescriptorWithReplacedParams(descriptorJson);

            Y.Assert.areEqual(JSON.stringify(descriptorWithReplacedParams),
                '[{"config":{"baseUrl":"http://finance.yahoo.com"}}]');

        }
    }));

    suite.add(new Y.Test.Case({

        "Data driven descriptor test": function(){

            var conf = {
                    "baseUrl": "http://overridebase.url.com",
                    "arrowModuleRoot": __dirname + "/",
                    "dimensions": __dirname + "/dimensions.json",
                    "context": ""
                },
                args = {};

            var dp = new dataProv(conf, args, __dirname + "/datadriven-descriptor.json");
            dp.mock = {
                exit: function (code) {
                    throw new Error("exit code is "+code);
                }
            };
            var dpvalues = dp.getTestData();

            Y.Assert.areEqual(2, dpvalues.length, 'Number of data driven descriptors dont match');

//            Y.Assert.areEqual("http://overridebase.url.com/testMock.html", dpvalues[0].dataprovider.test2.params.page);
//            Y.Assert.areEqual("sometest.js", dpvalues[0].dataprovider.test2.params.test);

        }
    }));



    Y.Test.Runner.add(suite);
}, '0.0.1', {requires:['test']});

 
 
 
 
 
 