/*jslint node:true*/
/*globals YUI*/
/*
* Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
YUI.add("dom-lib", function (Y) {
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
        }

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

            Assert.operator(expected, operator, size, message);
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
            return Assert.isUrl(src, message || 'Image does not have a valid src URL: ' + src);
        }
    };

    Y.mix(Assert, ArrowAsserts);

}, "0.1", { requires: ["test", "oop", "common-lib"] });