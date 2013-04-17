/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var isCommonJS = typeof window === "undefined" && typeof exports === "object";
var seed = isCommonJS ? require('../interface/engine-seed').engineSeed : window.engineSeed;

/**
 * @constructor
 * @param config
 */
function qunitSeed(config) {
    this.config = config || {};
    seed.call(this, config);
}

qunitSeed.prototype = Object.create(seed.prototype);

/**
 * qunit generate server side seed
 * just require node package
 * @param cb
 */
qunitSeed.prototype.generateServerSideSeed = function (cb) {

    // global use QUnit
    QUnit = require('qunit');
    QUnit.init();
    cb();

};
/**
 * qunit client side seed
 * for now load qunit-git.js from code.jquery.com
 * @param cb
 */
qunitSeed.prototype.generateClientSideSeed = function (cb) {

    var DEFAULT_SEED = "http://code.jquery.com/qunit/qunit-git.js";

    this.loadScript(DEFAULT_SEED, function () {
        window.QUnit.init();
        cb();
    });
};

new qunitSeed(ARROW.engineConfig).run();

