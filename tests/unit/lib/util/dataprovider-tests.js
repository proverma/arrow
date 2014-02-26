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

    suite.add(new Y.Test.Case({
        "Confirm constructor works": function(){
            Y.Assert.isNotNull(dp, "Confirm initiallizing does not return null");
        }
    }));

    //Test getting all values in a descriptor
    suite.add(new Y.Test.Case({
        "Confirm Config params": function(){
            Y.Assert.areEqual("tabview", dpvalues.name);
            Y.Assert.areEqual("./test-lib.js", dpvalues.commonlib);
            Y.Assert.areEqual("<yourhostname>:8033", dpvalues.config.baseUrl);
        }
    }));

    suite.add(new Y.Test.Case({
        "Confirm dataprovider values": function(){
            Y.Assert.areEqual("test-func.js", dpvalues.dataprovider.test1.params.test);
            Y.Assert.areEqual("testMock.html", dpvalues.dataprovider.test1.params.page);
            Y.Assert.areEqual("unit", dpvalues.dataprovider.test1.group);
        }
    }));

    //Test overriding values in the descriptor using $$ value
    suite.add(new Y.Test.Case({
        "Confirm you can share config values within descriptor": function(){
            Y.Assert.areEqual("<yourhostname>:8033/testMock.html", dpvalues.dataprovider.test2.params.page);
            Y.Assert.areEqual("sometest.js", dpvalues.dataprovider.test2.params.test);
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
            var dpvalues = dp.getTestData();

            Y.Assert.areEqual("http://overridebase.url.com/testMock.html", dpvalues.dataprovider.test2.params.page);
            Y.Assert.areEqual("sometest.js", dpvalues.dataprovider.test2.params.test);
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
            var dpvalues = dp.getTestData();

            Y.Assert.areEqual("http://overridebase.url.com/testMock.html", dpvalues.dataprovider.test2.params.page);
            Y.Assert.areEqual("sometest.js", dpvalues.dataprovider.test2.params.test);
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

        "Import descriptor testname": function(){
            var conf = {
                    "baseUrl": "http://overridebase.url.com",
                    "arrowModuleRoot": __dirname + "/",
                    "dimensions": __dirname + "/dimensions.json",
                    "context": "environment:development",
                    "replaceParamJSON" : __dirname + "/replaceParams/replaceParam2.json",
                    "defaultParamJSON" : __dirname + "/replaceParams/defaultParam.json"
                },
                args = {};

            var dp = new dataProv(conf, args,__dirname + "/importDescriptor/baseDescriptorTest.json");
            var descriptorJsonStr = fs.readFileSync(__dirname + "/importDescriptor/baseDescriptorTest.json", "utf-8");
            var descriptorJson = JSON.parse(descriptorJsonStr);

            var descriptorJson = dp.processImportDescriptor(descriptorJson);
            var expectedJsonStr = "[{\"settings\":[\"master\"],\"name\":\"tabview\",\"commonlib\":\".\/test-lib.js\",\"config\":{\"baseUrl\":\"my.com\",\"testsValue\":\"sometest.js\"},\"dataprovider\":{\"base test 1\":{\"params\":{\"test\":\"test-func.js\",\"page\":\"testMock.html\"},\"group\":\"unit\"},\"base test 2\":{\"params\":{\"test\":\"$$config.testsValue$$\",\"page\":\"$$config.baseUrl$$\/testMock.html\"},\"group\":\"func\"},\"imported test 1\":{\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"}}}},{\"settings\":[\"environment:development\"],\"config\":{\"baseUrl\":\"http:\/\/dimensions.url.override.com\"}}]";

            Y.Assert.areEqual(expectedJsonStr, JSON.stringify(descriptorJson), "Import Descriptor by testname - Json does not match");

        }
    }));


    suite.add(new Y.Test.Case({

        "Import descriptor group": function(){
            var conf = {
                    "baseUrl": "http://overridebase.url.com",
                    "arrowModuleRoot": __dirname + "/",
                    "dimensions": __dirname + "/dimensions.json",
                    "context": "environment:development",
                    "replaceParamJSON" : __dirname + "/replaceParams/replaceParam2.json",
                    "defaultParamJSON" : __dirname + "/replaceParams/defaultParam.json"
                },
                args = {};

            var dp = new dataProv(conf, args,__dirname + "/importDescriptor/baseDescriptorGroup.json");
            var descriptorJsonStr = fs.readFileSync(__dirname + "/importDescriptor/baseDescriptorGroup.json", "utf-8");
            var descriptorJson = JSON.parse(descriptorJsonStr);

            var descriptorJson = dp.processImportDescriptor(descriptorJson);
            console.log('***DescriptorJson::' + JSON.stringify(descriptorJson));
            Y.Assert.isTrue(true);
            var expectedJsonStr = "[{\"settings\":[\"master\"],\"name\":\"tabview\",\"commonlib\":\".\/test-lib.js\",\"config\":{\"baseUrl\":\"my.com\",\"testsValue\":\"sometest.js\"},\"dataprovider\":{\"base test 1\":{\"params\":{\"test\":\"test-func.js\",\"page\":\"testMock.html\"},\"group\":\"unit\"},\"base test 2\":{\"params\":{\"test\":\"$$config.testsValue$$\",\"page\":\"$$config.baseUrl$$\/testMock.html\"},\"group\":\"func\"},\"imported test 2\":{\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"}}}},{\"settings\":[\"environment:development\"],\"config\":{\"baseUrl\":\"http:\/\/dimensions.url.override.com\"}}]";

            Y.Assert.areEqual(expectedJsonStr, JSON.stringify(descriptorJson), "Import Descriptor by group - Json does not match");

        }
    }));

    suite.add(new Y.Test.Case({

        "Import descriptor": function(){
            var conf = {
                    "baseUrl": "http://overridebase.url.com",
                    "arrowModuleRoot": __dirname + "/",
                    "dimensions": __dirname + "/dimensions.json",
                    "context": "environment:development",
                    "replaceParamJSON" : __dirname + "/replaceParams/replaceParam2.json",
                    "defaultParamJSON" : __dirname + "/replaceParams/defaultParam.json"
                },
                args = {};

            var dp = new dataProv(conf, args,__dirname + "/importDescriptor/baseDescriptor.json");
            var descriptorJsonStr = fs.readFileSync(__dirname + "/importDescriptor/baseDescriptor.json", "utf-8");
            var descriptorJson = JSON.parse(descriptorJsonStr);

            var descriptorJson = dp.processImportDescriptor(descriptorJson);
            console.log('***DescriptorJson::' + JSON.stringify(descriptorJson));

            var expectedJsonStr = "[{\"settings\":[\"master\"],\"name\":\"tabview\",\"commonlib\":\".\/test-lib.js\",\"config\":{\"baseUrl\":\"my.com\",\"testsValue\":\"sometest.js\"},\"dataprovider\":{\"base test 1\":{\"params\":{\"test\":\"test-func.js\",\"page\":\"testMock.html\"},\"group\":\"unit\"},\"base test 2\":{\"params\":{\"test\":\"$$config.testsValue$$\",\"page\":\"$$config.baseUrl$$\/testMock.html\"},\"group\":\"func\"},\"imported test 1\":{\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"}},\"imported test 2\":{\"params\":{\"page\":\"$$config.baseUrl$$\",\"test\":\"test.js\"}}}},{\"settings\":[\"environment:development\"],\"config\":{\"baseUrl\":\"http:\/\/dimensions.url.override.com\"}}]";

            Y.Assert.areEqual(expectedJsonStr, JSON.stringify(descriptorJson), "Import Descriptor  - Json does not match");

        }
    }));


    Y.Test.Runner.add(suite);
}, '0.0.1', {requires:['test']});

 
 
 
 
 
 