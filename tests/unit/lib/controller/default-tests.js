/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('default-tests', function (Y, NAME) {
    
    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        DefaultController = require(arrowRoot + '/lib/controller/default.js'),
        Arrow = require(arrowRoot + '/lib/interface/arrow'),
        StubArrow = require(arrowRoot + '/tests/unit/stub/arrow.js'),
        StubDriver = require(arrowRoot + '/tests/unit/stub/driver.js');
        suite = new Y.Test.Suite(NAME),
        A = Y.Assert;
   
    suite.add(new Y.Test.Case({        
        'test scenario': function () {
            var driver = new StubDriver(),
                arrow = new StubArrow(),
                dc,
                scenario,
                executed = false,
                controllers;

            Arrow.instance = arrow;
            scenario = [
                {
                    page: 'test.html'
                },
                {
                    controller: 'controller.js'
                }
            ];

            dc = new DefaultController({}, {scenario: scenario}, driver);
            dc.execute(function (errMsg) {
                executed = true;
                A.isTrue(!errMsg, 'Should have executed scenario');
            });

            A.isTrue(executed, 'Scenario should be executed');
            controllers = arrow.controllers;
            A.areEqual(controllers[0].params.page, 'test.html', 'First atom should have a page');
            A.areEqual(controllers[1].controller, 'controller.js', 'Second atom should have a controller');
        },
        
        'test error scenario': function () {
            var driver = new StubDriver(),
                arrow = new StubArrow(),
                dc,
                scenario,
                executed = false,
                controllers;

            Arrow.instance = arrow;
            scenario = [
                {
                    controller: 'controller.js',
                    params: {
                        error: 'error'
                    }
                }
            ];

            dc = new DefaultController({}, {scenario: scenario}, driver);
            dc.execute(function (errMsg) {
                console.log(errMsg);
                executed = true;
                A.isString(errMsg, 'Should fail the scenario');
            });

            A.isTrue(executed, 'Scenario should be executed');
            controllers = arrow.controllers;
            A.areEqual(controllers[0].controller, 'controller.js', 'atom should have a controller');
            A.areEqual(controllers[0].params.error, 'error', 'atom should have a param');
        },

        'test simple': function () {
            var driver = new StubDriver(),
                dc,
                testExecuted = false,
                actionExecuted = false,
                navExecuted = false;
                
            dc = new DefaultController({}, {}, driver);
            dc.execute(function (errMsg) {
                console.log(errMsg);
                A.isString(errMsg, 'Should have failed with no test no page');
            });
            dc = new DefaultController({}, {test: 'test.js'}, driver);
            dc.execute(function() {
                testExecuted = true;
            });
            dc = new DefaultController({}, {action: 'action.js'}, driver);
            dc.execute(function() {
                actionExecuted = true;
            });
            dc = new DefaultController({}, {page: 'test.html'}, driver);
            dc.execute(function (errMsg) {
                console.log(errMsg);
                A.isString(errMsg, 'Should have failed with no webdriver');
            });
            dc = new DefaultController({}, {page: 'test.html'}, driver);
            driver.webdriver = {};
            dc.execute(function (errMsg) {
                A.isTrue(!errMsg, 'Should have navigated');
                navExecuted = true;
            });

            A.isTrue(testExecuted, "test should be executed");
            A.isTrue(actionExecuted, "action should be executed");
            A.isTrue(navExecuted, "nav should be executed");
        }
    }));
    
    Y.Test.Runner.add(suite);    
}, '0.0.1' ,{requires:['test']});

