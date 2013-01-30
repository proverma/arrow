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

    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        dataProv = require(arrowRoot+'/lib/util/dataprovider.js'),
        suite = new Y.Test.Suite("Data Provider test suite");

    var dp = new dataProv(conf, __dirname + "/testDescriptor.json");
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
            };

            var dp = new dataProv(conf, __dirname + "/testDescriptor.json");
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
                "context": "environment:development"
            };

            var dp = new dataProv(conf, __dirname + "/testDescriptor.json");
            var dpvalues = dp.getTestData();

            Y.Assert.areEqual("http://dimensions.url.override.com/testMock.html", dpvalues.dataprovider.test2.params.page);
            Y.Assert.areEqual("sometest.js", dpvalues.dataprovider.test2.params.test);
        }
    }));

    Y.Test.Runner.add(suite);
}, '0.0.1', {requires:['test']});

 
 
 
 
 
 