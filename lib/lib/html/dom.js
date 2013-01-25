/*jslint browser:true*/
/*globals YUI*/
/*
* Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
YUI.add("dom-lib", function (Y) {
    'use strict';

    var Assert = Y.Assert,
        ArrowAsserts,
        getNode = function (node) {
            if (typeof node === 'string') {
                node = Y.one(node);
            }
            return node;
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
            Assert.isNotNull(actual, message || ("Missing Node: " + node.toString()));
        },

        /**
        * Validates text from a node against expected value
        *
        * @method nodeTextEquals
        * @param {Node|String} node Domnode or Selector to run assertion on
        * @param {String} expected Text to assert contents of node
        * @param {String} message Message to return in case of failure 
        */
        nodeTextEquals: function (node, expected, message) {
            node = getNode(node);
            var actual = node.get("text");
            Assert.areEqual(expected, actual, message);
        },

        /**
        * Validates text from a node is not empty
        *
        * @method nodeTextExists
        * @param {Node|String} node Domnode or Selector to run assertion on
        * @param {String} message Message to return in case of failure 
        */
        nodeTextExists: function (node, message) {
            node = getNode(node);
            var text = node.get("text");
            Assert.isTrue(text !== "", message || "Empty node encountered");
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
        nodeCount: function (nodeList, expected, message) {
            var size,
                regEx = /\d+/,
                operator;

            if (typeof nodeList === 'string') {
                nodeList = Y.all(nodeList);
            }

            size = nodeList.size();

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

            Assert.operator(size, operator, expected, message);
        },

        /**
        * Validate needle exists in HTML source of the page
        *
        * @method nodeContains
        * @param {Node|String} node Domnode or Selector to run assertion on
        * @param {String} expected Needle to search with Node HTML
        * @param {String} message Message to return in case of failure 
        */
        nodeContains: function (node, expected, message) {
            var source = getNode(node).get("innerHTML"),
                found = source.indexOf(expected) > -1;

            Assert.isTrue(found, message || 'Failed to locate "' + expected + '" in ' + source);
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
        },

        /**
        * Verify if dom node is a valid anchor
        *
        * @method isAnchor
        * @param {String|Node} node Node/Selector for image
        * @param {String} message Message to return in case of failure
        */
        isAnchor : function (node, message) {
            node = getNode(node);
            var href = node.getAttribute("href");
            return Assert.isUrl(href, message || 'Anchor does not have a valid href: ' + href);
        }
    };

    Y.mix(Assert, ArrowAsserts);

}, "0.1", { requires: ["test", "oop", "common-lib", "node"] });