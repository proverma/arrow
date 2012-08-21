/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('arrow-tests', function (Y, NAME) {
    
    var path = require('path'),
        curDir,
        arrowRoot = path.join(__dirname, '../../../..'),
        Arrow = require(arrowRoot + '/lib/interface/arrow'),
        StubDriver = require(arrowRoot + '/tests/unit/stub/driver.js');
        controllerName = 'tests/unit/stub/controller.js';
        suite = new Y.Test.Suite(NAME),
        A = Y.Assert;
   
    suite.add(new Y.Test.Case({        
        'setUp': function () {
           curDir = process.cwd();
           process.chdir(arrowRoot); 
        },
        'tearDown': function () {
           process.chdir(curDir); 
        },

        'test controller': function () {
            var driver = new StubDriver(),
                arrow,
                executed = false;

            arrow = new Arrow();
            arrow.runController(controllerName, {}, {param: "value"}, driver, function (errMsg, data, controller) {
                executed = true;
                A.isTrue(!errMsg, 'Should have successfully executed controller');
                A.areEqual(controller.testParams.param, "value", "Controller should get the parameter");
            });

            A.isTrue(executed, 'Should have executed controller');
        },

        'test error controller': function () {
            var driver = new StubDriver(),
                arrow,
                executed = false;

            arrow = new Arrow();
            arrow.runController(controllerName, {}, {error: "error"}, driver, function (errMsg) {
                executed = true;
                A.isString(errMsg, 'Should have failed to execute controller');
            });
            A.isTrue(executed, 'Should have executed controller');

            executed = false;
            arrow = new Arrow();
            arrow.runController(controllerName, {}, {testName: "error", error: "error"}, driver, function (errMsg) {
                executed = true;
                A.isString(errMsg, 'Should have failed to execute controller');
            });
            A.isTrue(executed, 'Should have executed controller with testName');

        }
    }));
    
    Y.Test.Runner.add(suite);    
}, '0.0.1' ,{requires:['test']});

