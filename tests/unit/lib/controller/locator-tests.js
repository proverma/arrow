/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('locator-tests', function (Y, NAME) {

    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        LocatorController = require(arrowRoot + '/lib/controller/locator.js'),
        StubDriver = require(arrowRoot + '/tests/unit/stub/driver.js'),
        StubWdApp = require(arrowRoot + '/tests/unit/stub/webdriver.js'),
        suite = new Y.Test.Suite(NAME),
        A = Y.Assert;

    function validateLocator(params) {
        var wasCalled = false,
            config = {},
            wd = require(arrowRoot + '/tests/unit/stub/webdriver.js'),
            driver = new StubDriver(),
            lc;

        driver.webdriver = new wd.Builder().build();
        lc = new LocatorController(config, params, driver);
        lc.execute(function () {
            wasCalled = true;
        });

        // validations
        A.isTrue(wasCalled, 'The execution callback function should be called.');
        return driver.webdriver._actions;
    }

    suite.add(new Y.Test.Case({
        'test text locator': function () {
            var actions = validateLocator({value: '#text', text: "foo"});
            A.isTrue('foo' === actions[0].value, 'Must have entered text');
        },
        'test click locator': function () {
            var actions = validateLocator({value: '#button', click: true});
            A.isTrue('click' === actions[0].name, 'Must have clicked');
        },
        'test wait locator': function () {
            var actions = validateLocator({value: '#button', click: true, wait: true});
            A.isTrue('click' === actions[0].name, 'Must have clicked');
        },
        'test hover locator': function () {
            var actions = validateLocator({value: '#element', hover: true, waitForElement: "#next"});
            A.isTrue('mouseMove.perform' === actions[0].name, 'Must have hovered');
        },
        'test locator error': function () {
            var driver = new StubDriver(),
                yc;
            yc = new LocatorController({}, {}, driver);
            yc.execute(function (errMsg) {
                console.log(errMsg);
                A.isString(errMsg, 'Should have failed no webdriver check');
            });
            driver.webdriver = {};
            yc.execute(function (errMsg) {
                console.log(errMsg);
                A.isString(errMsg, 'Should have failed "using" check');
            });
        }
    }));
    Y.Test.Runner.add(suite);
}, '0.0.1', {requires: ['test']});

