/*jslint forin:true sub:true undef: true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/
/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

// Provided by the fw
// ARROW = {};
// ARROW.autoTest = false; // for self contained app and test, such as html
// ARROW.testParams = {};
// ARROW.appSeed = ""; // YUI min or equivalent
// ARROW.testLibs = [];
// ARROW.scriptType = "test";
// ARROW.testScript = "test-file.js";
// ARROW.actionScript = "action-file.js";
// ARROW.onSeeded = function() { /* add test, hand over to runner */}

ARROW.testBag = ["test"];
ARROW.testReport = null;
ARROW.actionReport = null;
ARROW.actionReported = false;


var isCommonJS = typeof window === "undefined" && typeof exports === "object";
var seed = isCommonJS ? require('../interface/engine-seed').engineSeed : window.engineSeed;

/**
 * @constructor
 * @param config
 */
function yuitestSeed(config) {
    this.config = config || {};
    seed.call(this, config);
}

yuitestSeed.prototype = Object.create(seed.prototype);

yuitestSeed.prototype.captureModuleTests = function (cb) {
    var module = ARROW.testParams["module"],
        yuiAddFunc = YUI.add;

    // capture module style tests
    YUI.add = function (name, fn, version, meta) {
        yuiAddFunc(name, fn, version, meta);

        if (module && (name !== module)) {
            return;
        }

        if (("test" === ARROW.scriptType) && (-1 !== name.indexOf("-tests"))) {
            //console.log("Found test module: " + name);
            ARROW.testBag.push(name);
        } else if (("action" === ARROW.scriptType) && (-1 !== name.indexOf("-action"))) {
            //console.log("Found test action: " + name);
            ARROW.testBag.push(name);
        }
    };
};
/**
 * yuitest generate server side seed
 * default we will have yui required
 * @param cb
 */
yuitestSeed.prototype.generateServerSideSeed = function (cb) {
    this.captureModuleTests();
    cb();
};
/**
 * yuitest client side seed
 * for now load yui-min.js
 * @param cb
 */
yuitestSeed.prototype.generateClientSideSeed = function (cb) {

    // parseFloat(YUI.version) < parseFloat("3.4.0")
    // or yui version > 3.x,both inject yui seed
    var self = this;
    if (ARROW.useYUISandbox) {  // no need to inject yui seed into page
        self.captureModuleTests();
        cb();
    } else {   // force inject yui-seed no matter if the page has yui
        this.loadScript(ARROW.appSeed, function () {
            self.captureModuleTests();
            cb();
        });
    }

};

new yuitestSeed(ARROW.engineConfig).run();