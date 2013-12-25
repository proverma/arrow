/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
/*global chai, describe, it, before*/
/*jslint expr:true */
var
    Y,
    chai,
    sourceUnderTest = "../src/jsoncopy.js",
    testThing1,
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
;

describe('media-greeter-tests', function () {
    describe('test', function () {

        before(function (done) {

            // Initialize chai and YUI
            if(typeof window  == "undefined" && typeof chai  == "undefined") {
                chai = require('chai');
            }
            else {
                chai = window.chai;
            }


            Y = YUI().use('', function () {
                done();
            });

        });

        it('testRequire', function (done) {

            var jsoncopy = require(sourceUnderTest);
            chai.assert.isNotNull(jsoncopy);

            done();

        });

        it('testShallowCopySimpleTypes',  function (done) {
            var jsoncopy = require(sourceUnderTest);

            chai.assert.isUndefined(jsoncopy.shallowCopy(testThing1));

            chai.assert.isNull(jsoncopy.shallowCopy(testThing2));

            chai.assert.isNull(jsoncopy.shallowCopy(testThing2));
            chai.assert.equal(testThing3, jsoncopy.shallowCopy(testThing3));
            chai.assert.equal(testThing4, jsoncopy.shallowCopy(testThing4));

            done();
        });

        it('testShallowCopySimpleArray', function (done) {

            var jsoncopy = require(sourceUnderTest),
                actual,
                i;

            actual = jsoncopy.shallowCopy(testThing5);

            chai.assert.isArray(actual);
            chai.assert.notEqual(testThing5, actual);
            chai.assert.equal(testThing5.length, actual.length);

            for (i = 0; i < actual.length; i++) {
                chai.assert.equal(testThing5[i], actual[i]);
            }
            done();
        });


        it('testShallowCopySimpleObject', function (done) {
            var jsoncopy = require(sourceUnderTest),
                actual;

            actual = jsoncopy.shallowCopy(testThing6);

            chai.assert.isObject(actual);
            chai.assert.notEqual(testThing6, actual);

            chai.assert.equal(Object.keys(testThing6).length, Object.keys(actual).length);
            Object.keys(actual).forEach(function (key) {
                chai.assert.equal(testThing6[key], actual[key]);
            });
            done();
        });

        it('testShallowCopyComplexArray', function (done) {

            var jsoncopy = require(sourceUnderTest),
                actual;

            actual = jsoncopy.shallowCopy(testThing7);
            chai.assert.isArray(actual);
            chai.assert.notEqual(testThing7, actual);
            chai.assert.equal(testThing7.length, actual.length);
            chai.assert.equal(testThing7[0], actual[0]);
            chai.assert.equal(testThing7[1], actual[1]);
            done();
        });
//
        it('testShallowCopyComplexObject', function (done) {

            var jsoncopy = require(sourceUnderTest),
                actual;

            actual = jsoncopy.shallowCopy(testThing8);

            chai.assert.isObject(actual);
            chai.assert.notEqual(testThing8, actual);
            chai.assert.equal(Object.keys(testThing8).length, Object.keys(actual).length);
            chai.assert.equal(testThing8.one, actual.one);
            chai.assert.equal(testThing8.two, actual.two);

            done();
        });

        // Deep copy tests

        it('testDeepCopySimpleTypes', function (done) {
            var jsoncopy = require(sourceUnderTest);

            chai.assert.isUndefined(jsoncopy.deepCopy(testThing1));
            chai.assert.isNull(jsoncopy.deepCopy(testThing2));
            chai.assert.equal(testThing3, jsoncopy.deepCopy(testThing3));
            chai.assert.equal(testThing4, jsoncopy.deepCopy(testThing4));
            done();
        });

        it('testDeepCopySimpleArray', function (done) {
            var jsoncopy = require(sourceUnderTest),
                actual,
                i;

            actual = jsoncopy.deepCopy(testThing5);
            chai.assert.isArray(actual);
                chai.assert.notEqual(testThing5, actual);
                chai.assert.equal(testThing5.length, actual.length);
            for (i = 0; i < actual.length; i++) {
                chai.assert.equal(testThing5[i], actual[i]);
            }

            done();

        });

        it('testDeepCopySimpleObject', function (done) {
            var jsoncopy = require(sourceUnderTest),
                actual;

            actual = jsoncopy.deepCopy(testThing6);
            chai.assert.isObject(actual);
            chai.assert.notEqual(testThing6, actual);
            chai.assert.equal(Object.keys(testThing6).length, Object.keys(actual).length);
            Object.keys(actual).forEach(function (key) {
                chai.assert.equal(testThing6[key], actual[key]);
            });
            done();
        });

        it('testDeepCopyComplexArray',  function (done) {
            var jsoncopy = require(sourceUnderTest),
                actual,
                i;

            actual = jsoncopy.deepCopy(testThing7);
            chai.assert.isArray(actual);
            chai.assert.notEqual(testThing7, actual);
            chai.assert.equal(testThing7.length, actual.length);
            chai.assert.notEqual(testThing7[0], actual[0]);
            Object.keys(actual[0]).forEach(function (key) {
                chai.assert.equal(testThing7[0][key], actual[0][key]);
            });
            chai.assert.notEqual(testThing7[1], actual[1]);
            for (i = 0; i < actual[1].length; i++) {
                chai.assert.equal(testThing7[1][i], actual[1][i]);
            }
            done();
        });

        it('testDeepCopyComplexObject', function (done) {
            var jsoncopy = require(sourceUnderTest),
                actual,
                i;

            actual = jsoncopy.deepCopy(testThing8);
            chai.assert.isObject(actual);
            chai.assert.notEqual(testThing8, actual);
            chai.assert.equal(Object.keys(testThing8).length, Object.keys(actual).length);
            chai.assert.notEqual(testThing8.one, actual.one);
            Object.keys(actual.one).forEach(function (key) {
                chai.assert.equal(testThing8.one[key], actual.one[key]);
            });

            chai.assert.notEqual(testThing8.two, actual.two);
            for (i = 0; i < actual.two.length; i++) {
                chai.assert.equal(testThing8.two[i], actual.two[i]);
            }
            done();
        });

        // Parameterized copy tests

        it('testCopySimpleTypes' , function (done) {

            var jsoncopy = require(sourceUnderTest);

            chai.assert.isUndefined(jsoncopy.copy(testThing1, false));
            chai.assert.isNull(jsoncopy.copy(testThing2, false));
            chai.assert.equal(testThing3, jsoncopy.copy(testThing3, false));
            chai.assert.equal(testThing4, jsoncopy.copy(testThing4, false));

            chai.assert.isUndefined(jsoncopy.copy(testThing1, true));
            chai.assert.isNull(jsoncopy.copy(testThing2, true));
            chai.assert.equal(testThing3, jsoncopy.copy(testThing3, true));
            chai.assert.equal(testThing4, jsoncopy.copy(testThing4, true));

            done();

        });



    });
});


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
        }


    });

    Y.Test.Runner.add(jsoncopyTestCase);


}, "0.1", {requires:["test"]});
