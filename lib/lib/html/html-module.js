/*jslint browser:true*/
/*globals YUI*/
/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
/**
 * The Module Test Suite lets you pass in a data structure defining asserts
 * that need to be made for a module and automatically adds them in a format
 * YUITest can execute. 
 * Default assert is ensuring a child selector under a node is not null.
 *
 * @module html-module-lib
 * @namespace Test
 * @class Module
 */
YUI.add("html-module-lib", function (Y) {
    'use strict';

    var Module = function (config) {
        Module.superclass.constructor.call(this, config);

        var prop,
            modNode = null,
            modId = this.id,
            tests = this.asserts,
            Assert = Y.Assert,
            nodeMethods = ["nodeTextEquals", "nodeCount", "nodeContains"],
            simpleNodeValidation = ["isNode", "isImage"],
            defaultAssert = function (selector) {
                return function () {
                    Assert.isNode(modNode.one(selector), " '" + selector + "' is missing from Module markup");
                };
            },
            buildAssert = function (config) {
                var type = config.type,
                    locator = config.locator,
                    expected = config.expected,
                    message = config.message || '';

                if (Y.Array.indexOf(simpleNodeValidation, type) !== -1) {
                    return function () {
                        Y.Assert[type]("#" + modId + " " + locator, message);
                    };
                }

                if (Y.Array.indexOf(nodeMethods, type) !== -1) {
                    return function () {
                        Y.Assert[type]("#" + modId + " " + locator, expected, message);
                    };
                }

                return function () {
                    Y.Assert[type](expected, message);
                };
            };

        modNode = Y.one('#' + modId);

        this["Module Presence"] = function () {
            Assert.isNode(modNode, "Module is missing");
        };

        if (tests && (typeof tests === "object")) {
            for (prop in tests) {
                if (tests.hasOwnProperty(prop)) {
                    if (typeof tests[prop] === "object") {
                        this["Test Module " + prop] = buildAssert(tests[prop]);
                    } else {
                        this["Test Module " + prop] = defaultAssert(tests[prop]);
                    }
                }
            }
        }
    };

    Y.extend(Module, Y.Test.Case);
    Y.Test.Module = Module;

}, "0.1", { requires: ["node", "test", "oop", "dom-lib", "common-lib"] });