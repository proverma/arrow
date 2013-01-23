/*jslint node:true*/
/*globals YUI*/
/*
* Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
YUI.add("common-asserts", function (Y) {
    'use strict';

    var Assert = Y.Assert,
        Object = Y.Object,
        Test = Y.Test,
        ArrowAsserts,
        getNode = function (node) {
            if (typeof node === 'string') {
                node = Y.one(node);
            }
            return node;
        },
        stringToPath = function (string) {
            return string.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '').split('.');
        };

    ArrowAsserts = {
        /**
        * Confirm module is present
        *
        * @method isNode
        * @param {Node|String} node Domnode or Selector to run assertion on
        * @param {message} message Message to output upon failure
        */
        isNode: function (node, message) {
            var actual = getNode(node);
            Assert.isInstanceOf(Y.Node, actual, message || "Missing Node: " + node.toString());
        },

        /**
        * Validates text from a node against expected value
        *
        * @method isNodeTextEqual
        * @param {Node|String} node Domnode or Selector to run assertion on
        * @param {String} expected Text to assert contents of node
        * @param {String} message Message to return in case of failure 
        */
        nodeText: function (node, expected, message) {
            node = getNode(node);
            var actual = node.get("text");
            Assert.areEqual(expected, actual, message);
        },

        /**
        * Validate number of li's
        * Assumes element passed in is a ul
        *
        * @method nodeCount
        * @param {Node|String} node Domnode or Selector to run assertion on
        * @param {String|Number} expected Text to assert contents of node.
        * @param {String} message Message to return in case of failure 
        */
        nodeCount: function (selector, expected, message) {
            var nodeList = Y.all(selector),
                size = nodeList.size(),
                regEx = /\d+/,
                operator;

            if (typeof expected === 'string') {

                if (expected.indexOf(">") !== -1) {
                    operator = ">";
                } else if (expected.indexOf("<") !== -1) {
                    operator = "<";
                } else if (expected.indexOf("=") !== -1) {
                    operator = "=";
                } else {
                    Assert.fail("Invalid expected value: " + expected);
                }

                expected = expected.match(regEx);
            }

            this.operator(expected, operator, size, message);
        },

        /**
        * Validate needle exists in HTML source of the page
        *
        * @method sourceContains
        * @param {String} needle Needle to search with HTML
        */
        sourceContains: function (needle) {
            var source = Y.config.doc.getElementsByTagName('html')[0].innerHTML,
                found = source.indexOf(needle) > -1;

            Assert.isTrue(found, 'Failed to locate "' + needle + '" in HTML source.');
        },

        /**
        * Verify if dom node is a valid image
        *
        * @method isImage
        * @param {String|Node} node Node/Selector for image
        * @param {String} message Message to return in case of failure
        */
        isImage : function (node, message) {
            node = getNode(node);
            var src = node.getAttribute("src");
            return this.isUrl(src, message || 'Image does not have a valid src URL: ' + src);
        },

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