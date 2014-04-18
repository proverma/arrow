/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('datadrivermanager-tests', function (Y) {

    var fs = require("fs");
    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        DataDriverMgr = require(arrowRoot+'/lib/util/datadrivermanager.js'),
        suite = new Y.Test.Suite("Data Driver Manager test suite");

    var dataDriverMgr = new DataDriverMgr();

    dataDriverMgr.mock = {
        exit: function (code) {
            throw new Error("exit code is "+code);
        }
    };

    suite.add(new Y.Test.Case({

        "process data driver ": function() {

            var
                dataDriverPath = __dirname + '/configdata.json',
                descriptorJsonStr = fs.readFileSync(__dirname + '/datadriven-descriptor.json', 'utf-8'),
                descriptorJson,
                descriptorArr = [];

                try {
                    descriptorJson = JSON.parse(descriptorJsonStr);
                    descriptorArr = dataDriverMgr.processDataDriver(dataDriverPath, descriptorJson);

                    var desc0 = '[{"settings":["master"],"name":"controllers - 0","dataprovider":{"Test Data Driven Descriptor":{"group":"func","params":{"scenario":[{"page":"$$config.baseUrl$$"},{"test":"dummytest.js"}]}}},"config":{"baseUrl":"http://finance.yahoo.com"}},{"settings":["environment:development"]}]';
                    var desc1 = '[{"settings":["master"],"name":"controllers - 1","dataprovider":{"Test Data Driven Descriptor":{"group":"func","params":{"scenario":[{"page":"$$config.baseUrl$$"},{"test":"dummytest.js"}]}}},"config":{"baseUrl":"http://yahoo.com"}},{"settings":["environment:development"]}]';

                    Y.Assert.areEqual(desc0, JSON.stringify(descriptorArr[0]));
                    Y.Assert.areEqual(desc1, JSON.stringify(descriptorArr[1]));

                }catch(e) {

                }

            Y.Assert.areEqual( 2, descriptorArr.length);


        }
    }));


    suite.add(new Y.Test.Case({

        "process data driver invalid data driven descriptor ": function() {

            var
                dataDriverPath = __dirname + '/invalid.json',
                descriptorJson,
                msg;

            try {
                descriptorJson = '[{"settings":["master"],"name":"controllers","dataDriver":"./configdata.json","dataprovider":{"Test Data Driven Descriptor":{"group":"func","params":{"scenario":[{"page":"$$config.baseUrl$$"},{"test":"dummytest.js"}]}}}},{"settings":["environment:development"]}]';
                dataDriverMgr.processDataDriver(dataDriverPath, JSON.parse(descriptorJson));

            }catch(e) {
                msg = e.message;
            }

            Y.Assert.areEqual("exit code is 1",msg,'Error message doesnt match when data driven descriptor is invalid' );


        }
    }));


    Y.Test.Runner.add(suite);
}, '0.0.1', {requires:['test']});

 
 
 
 
 
 