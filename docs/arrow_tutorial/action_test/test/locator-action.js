/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add("navigate-action", function (Y) {
    var buttonNode = null;

    console.log("action initialized");

    Y.namespace("arrow").action = {
        setUp: function (callback) {
            var locators,
                locator,
                doc = Y.one(document.body),
                node,
                buttonTarget,
                i;

            console.log("action setUp");

            locators = this.testParams["locators"];
            if (!locators) {
                locators = [this.testParams["locator"]];
            }

            // all locators except the last one enter texts
            for (i = 0; i < (locators.length - 1); i += 1) {
                locator = locators[i];
                node = doc.one(locator.target);
                node.set("value", locator.text);
            }

            // save the buttonNode to click later
            buttonTarget = locators[locators.length - 1].target;
            buttonNode = doc.one(buttonTarget);
            if (!buttonNode) {
                callback("Could not find button node to click: " + buttonTarget);
            } else {
                callback();
            }
        },

        execute: function() {
            console.log("action executed");
            buttonNode.simulate("click");
        }
    }

}, "0.1", {requires: ["node", "node-event-simulate"]});

