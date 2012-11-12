/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add("media-greeter-tests", function (Y) {

    // NOTE: sourceUnderTest could also be passed as a parameter to test against dev or the 
    // instrumented version of the same code
    var sourceUnderTest = "../src/jsoncopy.js";
    var Assert = Y.Assert;

    var testThing1,
        testThing2 = null,
        testThing3 = "A string",
        testThing4 = 42,
        testThing5 = [ "one", 2, true ],
        testThing6 = { one: 1, two: "two", three: false },
        testThing7 = [
            { one1: 1, one2: "two", one3: false },
            [ "two1", 22, true ]
        ],
        testThing8 = {
            one: { one1: 1, one2: "two", one3: false },
            two: [ "two1", 22, true ]
        };


    var jsoncopyTestCase = new Y.Test.Case({
        name: "jsoncopy Test Case",

        testRequire: function () {
            var jsoncopy = require(sourceUnderTest);
            Assert.isNotNull(jsoncopy);
        },

        // Shallow copy tests

        testShallowCopySimpleTypes: function () {
            var jsoncopy = require(sourceUnderTest);

            Assert.isUndefined(jsoncopy.shallowCopy(testThing1));
            Assert.isNull(jsoncopy.shallowCopy(testThing2));
            Assert.areSame(testThing3, jsoncopy.shallowCopy(testThing3));
            Assert.areSame(testThing4, jsoncopy.shallowCopy(testThing4));
        },

        testShallowCopySimpleArray: function () {
            var jsoncopy = require(sourceUnderTest),
                actual,
                i;

            actual = jsoncopy.shallowCopy(testThing5);
            Assert.isArray(actual);
            Assert.areNotEqual(testThing5, actual);
            Assert.areSame(testThing5.length, actual.length);
            for (i = 0; i < actual.length; i++) {
                Assert.areSame(testThing5[i], actual[i]);
            }
        },

        testShallowCopySimpleObject: function () {
            var jsoncopy = require(sourceUnderTest),
                actual;

            actual = jsoncopy.shallowCopy(testThing6);
            Assert.isObject(actual);
            Assert.areNotEqual(testThing6, actual);
            Assert.areSame(Object.keys(testThing6).length, Object.keys(actual).length);
            Object.keys(actual).forEach(function (key) {
                Assert.areSame(testThing6[key], actual[key]);
            });
        },

        testShallowCopyComplexArray: function () {
            var jsoncopy = require(sourceUnderTest),
                actual;

            actual = jsoncopy.shallowCopy(testThing7);
            Assert.isArray(actual);
            Assert.areNotEqual(testThing7, actual);
            Assert.areSame(testThing7.length, actual.length);
            Assert.areSame(testThing7[0], actual[0]);
            Assert.areSame(testThing7[1], actual[1]);
        },

        testShallowCopyComplexObject: function () {
            var jsoncopy = require(sourceUnderTest),
                actual;

            actual = jsoncopy.shallowCopy(testThing8);
            Assert.isObject(actual);
            Assert.areNotEqual(testThing8, actual);
            Assert.areSame(Object.keys(testThing8).length, Object.keys(actual).length);
            Assert.areSame(testThing8.one, actual.one);
            Assert.areSame(testThing8.two, actual.two);
        },

        // Deep copy tests

        testDeepCopySimpleTypes: function () {
            var jsoncopy = require(sourceUnderTest);

            Assert.isUndefined(jsoncopy.deepCopy(testThing1));
            Assert.isNull(jsoncopy.deepCopy(testThing2));
            Assert.areSame(testThing3, jsoncopy.deepCopy(testThing3));
            Assert.areSame(testThing4, jsoncopy.deepCopy(testThing4));
        },

        testDeepCopySimpleArray: function () {
            var jsoncopy = require(sourceUnderTest),
                actual,
                i;

            actual = jsoncopy.deepCopy(testThing5);
            Assert.isArray(actual);
            Assert.areNotEqual(testThing5, actual);
            Assert.areSame(testThing5.length, actual.length);
            for (i = 0; i < actual.length; i++) {
                Assert.areSame(testThing5[i], actual[i]);
            }
        },

        testDeepCopySimpleObject: function () {
            var jsoncopy = require(sourceUnderTest),
                actual;

            actual = jsoncopy.deepCopy(testThing6);
            Assert.isObject(actual);
            Assert.areNotEqual(testThing6, actual);
            Assert.areSame(Object.keys(testThing6).length, Object.keys(actual).length);
            Object.keys(actual).forEach(function (key) {
                Assert.areSame(testThing6[key], actual[key]);
            });
        },

        testDeepCopyComplexArray: function () {
            var jsoncopy = require(sourceUnderTest),
                actual,
                i;

            actual = jsoncopy.deepCopy(testThing7);
            Assert.isArray(actual);
            Assert.areNotEqual(testThing7, actual);
            Assert.areSame(testThing7.length, actual.length);
            Assert.areNotSame(testThing7[0], actual[0]);
            Object.keys(actual[0]).forEach(function (key) {
                Assert.areSame(testThing7[0][key], actual[0][key]);
            });
            Assert.areNotSame(testThing7[1], actual[1]);
            for (i = 0; i < actual[1].length; i++) {
                Assert.areSame(testThing7[1][i], actual[1][i]);
            }
        },

        testDeepCopyComplexObject: function () {
            var jsoncopy = require(sourceUnderTest),
                actual,
                i;

            actual = jsoncopy.deepCopy(testThing8);
            Assert.isObject(actual);
            Assert.areNotEqual(testThing8, actual);
            Assert.areSame(Object.keys(testThing8).length, Object.keys(actual).length);
            Assert.areNotSame(testThing8.one, actual.one);
            Object.keys(actual.one).forEach(function (key) {
                Assert.areSame(testThing8.one[key], actual.one[key]);
            });
            Assert.areNotSame(testThing8.two, actual.two);
            for (i = 0; i < actual.two.length; i++) {
                Assert.areSame(testThing8.two[i], actual.two[i]);
            }
        },

        // Parameterized copy tests

        testCopySimpleTypes: function () {
            var jsoncopy = require(sourceUnderTest);

            Assert.isUndefined(jsoncopy.copy(testThing1, false));
            Assert.isNull(jsoncopy.copy(testThing2, false));
            Assert.areSame(testThing3, jsoncopy.copy(testThing3, false));
            Assert.areSame(testThing4, jsoncopy.copy(testThing4, false));

            Assert.isUndefined(jsoncopy.copy(testThing1, true));
            Assert.isNull(jsoncopy.copy(testThing2, true));
            Assert.areSame(testThing3, jsoncopy.copy(testThing3, true));
            Assert.areSame(testThing4, jsoncopy.copy(testThing4, true));
        }
    });

    Y.Test.Runner.add(jsoncopyTestCase);


}, "0.1", {requires:["test"]});
