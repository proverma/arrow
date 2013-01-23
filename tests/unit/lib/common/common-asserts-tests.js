/*jslint node:true*/
/*globals YUI*/

/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('common-asserts-tests', function (Y, NAME) {
    'use strict';

    var suite = new Y.Test.Suite(NAME),
        Assert = Y.Assert;

    suite.add(new Y.Test.Case({

        testIsUrl: function () {
            Assert.isUrl("http://yahoo.com");
            Assert.isUrl("http://yahoo.com/?foo=bar");
            Assert.isUrl("http://yahoo.com/#foo=bar");
            Assert.isUrl("http://yahoo.com/favicon.gif");
        },

        testIsMatch: function () {
            Assert.isMatch("123566", /\d+/);
        },

        testHasKey: function () {
            Assert.hasKey({"foo" : "bar" }, "foo");
            Assert.hasKey({"foo" : "bar", "baz" : null }, "baz");
        },

        testHasValue: function () {
            Assert.hasValue({"foo" : "bar" }, "bar");
            Assert.hasValue({"foo" : "bar", "baz" : null }, null);
        },

        testHasDeepKey: function () {
            Assert.hasDeepKey({
                "foo": {
                    "bar": {
                        "baz": "hello"
                    }
                }
            }, "foo.bar.baz");
        },

        testHasDeepValue: function () {
            var obj = {
                "foo": {
                    "bar": {
                        "baz": "hello",
                        "foobar": [
                            { "test" : "1" },
                            { "test" : "2" }
                        ]
                    }
                }
            };

            Assert.hasDeepValue(obj, "foo.bar.baz", "hello");
            Assert.hasDeepValue(obj, "foo.bar.foobar[1].test", "2");
        },

        testOperator: function () {
            Assert.operator(5, ">", 2);
            Assert.operator("7", "<", 100);
            Assert.operator("3", "=", "3");
            Assert.operator("3", "==", "3");
            Assert.operator("3", "===", 3);
        }

    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', { requires: ['test', 'common-asserts'] });