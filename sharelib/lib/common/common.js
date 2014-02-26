/*jslint node:true*/
/*globals YUI*/
/*
* Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
YUI.add("common-lib", function (Y) {
    'use strict';

    var Assert = Y.Assert,
        Object = Y.Object,
        ArrowAsserts,
        stringToPath = function (string) {
            return string.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '').split('.');
        };

    ArrowAsserts = {
        /**
        * Asserts if string is a valid URL
        *
        * @method isUrl
        * @param {String} string Potential URL string
        * @param {String} message Message to return in case of failure
        */
        isUrl : function (string, message) {
            var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
            this.isMatch(string, regexp, message || 'Invalid URL: ' + string);
        },

        /**
        * Match string against a supplied regex
        *
        * @method isMatch
        * @param {String} string String to match
        * @param {RegExp} regexp Regexp to match given string
        * @param {String} message Message to return in case of failure
        */
        isMatch : function (string, regexp, message) {
            Assert.isTrue(regexp.test(string), message || string + " does not match expression " + regexp);
        },

        /**
        * Asserts if an Object has specified key
        * Does not perform a deep search. Use hasDeepKey for deep search
        *
        * @method hasValue
        * @param {Object} object Object to find key in
        * @param {String|Integer} expected Expected key
        * @param {String} message Message to return in case of failure
        */
        hasKey : function (object, expected, message) {
            Assert.isTrue(Object.hasKey(object, expected), message);
        },

        /**
        * Asserts if an Object has specified Value
        * Does not perform a deep search. Use hasDeepValue for deep search
        *
        * @method hasValue
        * @param {Object} object Object to find value in
        * @param {Mixed} expected Expected value
        * @param {String} message Message to return in case of failure
        */
        hasValue : function (object, expected, message) {
            Assert.isTrue(Object.hasValue(object, expected), message);
        },

        /**
        * Looks within a nested Object for the specified key
        *
        * @method hasDeepKey
        * @param {Object} object Object to find key in
        * @param {String} key Expressive key locator
        *                     eg: foo.bar.foobar[1].test
        * @param {String} message Message to return in case of failure 
        */
        hasDeepKey : function (object, key, message) {
            var err = key,
                n;

            key = stringToPath(key);

            while (key.length) {
                n = key.shift();
                if (!object.hasOwnProperty(n)) {
                    Assert.fail(message || err + " key could not be found in Object");
                } else {
                    object = object[n];
                }
            }

            Assert.isNotUndefined(object, message || err + " key could not be found in Object");
        },

        /**
        * Looks within a nested Object for the specified key and assert its value
        *
        * @method hasDeepValue
        * @param {Object} object Object to find value in
        * @param {String} key Expressive key to find value.
        *                     eg: foo.bar.foobar[1].test
        * @param {String|Integer} expected Expected Value for given key
        * @param {String} message Message to return in case of failure 
        */
        hasDeepValue : function (object, key, expected, message) {
            var err = key,
                n;
            key = stringToPath(key);

            while (key.length) {
                n = key.shift();
                if (object.hasOwnProperty(n)) {
                    object = object[n];
                } else {
                    Assert.fail(message || "Value could not be found for " + err);
                }
            }

            Assert.areEqual(expected, object, message || "Value could not be found for " + err);
        },

        /**
        * Compares two values
        *
        * @method operator
        * @param {String|Integer} value1 First Value
        * @param {String} operator Accepts >,<,==,===,=
        * @param {String|Integer} value2 Second Value
        * @param {String} message Message to return in case of failure
        */
        operator : function (value1, operator, value2, message) {
            if (operator === ">") {
                Assert.isTrue(value1 > value2, message);
            } else if (operator === "<") {
                Assert.isTrue(value1 < value2, message);
            } else if (operator.indexOf("=") !== -1) {
                Assert.areEqual(value1, value2, message);
            } else {
                Assert.fail("Invalid operator: " + operator);
            }
        }
    };

    Y.mix(Assert, ArrowAsserts);

}, "0.1", { requires: ["test", "oop"] });