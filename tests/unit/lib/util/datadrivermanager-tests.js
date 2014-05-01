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

        "get config data from file": function() {

            var
                descPath = __dirname + '/datadriven-descriptor.json',
                descriptorJsonStr = fs.readFileSync(descPath, 'utf-8'),
                relativePath = path.dirname(descPath),
                descriptorJson,
                configArr;

            try {

                descriptorJson = JSON.parse(descriptorJsonStr);
                configArr = dataDriverMgr.getConfigData(relativePath, descriptorJson);
            }catch(e) {

            }

            Y.Assert.isNotUndefined(configArr, "Config array is undefined ( getting from file)");
            Y.Assert.areEqual(2, configArr.length);

            Y.Assert.areEqual('http://finance.yahoo.com', configArr[0]['finance']['baseUrl'], "Config baseurl ( 0th element doesn't match )");
            Y.Assert.areEqual('http://yahoo.com', configArr[1]['yahoo']['baseUrl'], "Config baseurl ( 1st element doesn't match )");

        },

        "get config data from array": function() {

            var
                descPath = __dirname + '/datadriven-descriptor-config.json',
                descriptorJsonStr = fs.readFileSync(descPath, 'utf-8'),
                descriptorJson,
                configArr;

            try {
                descriptorJson = JSON.parse(descriptorJsonStr);
                configArr = dataDriverMgr.getConfigData(descPath, descriptorJson);
            }catch(e) {

            }

            Y.Assert.isNotUndefined(configArr, "Config array is undefined (getting from config array)");
            Y.Assert.areEqual(2, configArr.length);

            Y.Assert.areEqual('http://finance.yahoo.com', configArr[0]['finance']['baseUrl'], "Config baseurl ( 0th element doesn't match");
            Y.Assert.areEqual('http://yahoo.com', configArr[1]['yahoo']['baseUrl'], "Config baseurl ( 1st element doesn't match");

        },

        "empty configuration": function() {

            var
                descPath = __dirname + '/datadriven-descriptor-config-empty.json',
                descriptorJsonStr = fs.readFileSync(descPath, 'utf-8'),
                descriptorJson,
                descriptorArr,
                msg;

            try {
                descriptorJson = JSON.parse(descriptorJsonStr);
                descriptorArr = dataDriverMgr.processDataDriver(descPath, descriptorJson);
            }catch(e) {

                msg = e.message;
            }

            Y.Assert.areEqual("exit code is 1", msg);


        },

        "duplicate keys in config data": function() {

            var
                descPath = __dirname + '/configdata-duplicatekeys.json',
                configDataStr = fs.readFileSync(descPath, 'utf-8'),
                configObj,
                errMsg;

            try {
                configObj = JSON.parse(configDataStr);
                dataDriverMgr.checkForDuplicateKeys(configObj.config);
            }catch(e) {
                errMsg = e.message;
            }

//            Y.Assert.isTrue(errMsg.indexOf('Duplicate key \'yahoo\' in the object') > -1);

            Y.Assert.isNotUndefined(errMsg, "Process data driver with duplicate keys in config data shall throw exception");
            if (errMsg) {
                Y.Assert.isTrue(errMsg.indexOf('Duplicate key \'yahoo\' in the object') > -1);
            }


        }


        ,"unique keys in config data": function() {

            var
                descPath = __dirname + '/configdata.json',
                configDataStr = fs.readFileSync(descPath, 'utf-8'),
                configObj,
                errMsg;

            try {
                configObj = JSON.parse(configDataStr);
                dataDriverMgr.checkForDuplicateKeys(configObj.config);
            }catch(e) {
                errMsg = e.message;
            }

            Y.Assert.isUndefined(errMsg, "No exception shall be thrown when keys are unique");

        }



    }));

    suite.add(new Y.Test.Case({

        "process data driver ": function() {

            var
                descPath = __dirname + '/datadriven-descriptor.json',
                descriptorJsonStr = fs.readFileSync(descPath, 'utf-8'),
                descriptorJson,
                descriptorArr = [];

                try {
                    descriptorJson = JSON.parse(descriptorJsonStr);
                    descriptorArr = dataDriverMgr.processDataDriver(descPath, descriptorJson);

                    var desc0 = '[{"settings":["master"],"name":"controllers - 0","dataprovider":{"Test Data Driven Descriptor":{"group":"func","params":{"scenario":[{"page":"$$config.baseUrl$$"},{"test":"dummytest.js"}]}}},"config":{"baseUrl":"http://finance.yahoo.com"}},{"settings":["environment:development"]}]';
                    var desc1 = '[{"settings":["master"],"name":"controllers - 1","dataprovider":{"Test Data Driven Descriptor":{"group":"func","params":{"scenario":[{"page":"$$config.baseUrl$$"},{"test":"dummytest.js"}]}}},"config":{"baseUrl":"http://yahoo.com"}},{"settings":["environment:development"]}]';

                    Y.Assert.areEqual(desc0, JSON.stringify(descriptorArr[0]));
                    Y.Assert.areEqual(desc1, JSON.stringify(descriptorArr[1]));

                }catch(e) {

                }

            Y.Assert.areEqual( 2, descriptorArr.length);


        },

        "process data driver duplicate keys ": function() {

            var
                descPath = __dirname + '/datadriven-descriptor-dup-keys.json',
                descriptorJsonStr = fs.readFileSync(descPath, 'utf-8'),
                descriptorJson,
                descriptorArr = [],
                errMsg;

            try {
                descriptorJson = JSON.parse(descriptorJsonStr);
                descriptorArr = dataDriverMgr.processDataDriver(descPath, descriptorJson);

            }catch(e) {
                errMsg = e.message;
            }

            Y.Assert.isNotUndefined(errMsg, "Process data driver with duplicate keys in config data shall throw exception");

            if (errMsg) {
                Y.Assert.isTrue(errMsg.indexOf("exit code is 1") > -1);
            }

        }

    }));

    suite.add(new Y.Test.Case({

        "process data driver invalid config file": function() {

            var
                descPath = __dirname + '/datadriven-descriptor-invalid.json',
                descriptorJsonStr = fs.readFileSync(descPath, 'utf-8'),
                descriptorJson,
                msg;

            try {

                descriptorJson = JSON.parse(descriptorJsonStr);
                dataDriverMgr.getConfigData(descPath, descriptorJson);

            }catch(e) {
                msg = e.message;
            }

            Y.Assert.areEqual("exit code is 1",msg,'Error message doesnt match when data driven descriptor is invalid' );


        }
    }));


    Y.Test.Runner.add(suite);
}, '0.0.1', {requires:['test']});

 
 
 
 
 
 