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
function jasmineSeed(config) {
    this.config = config || {};
    seed.call(this, config);
}

jasmineSeed.prototype = Object.create(seed.prototype);

/**
 * jasmine generate server side seed
 * just require node package
 * @param cb
 */
jasmineSeed.prototype.generateServerSideSeed = function (cb) {

    // make it global
    jasmine = require('jasmine-node');
    cb();

};
/**
 * generate client side seed
 * for now load jasmine/jasmine-html.js from ydn.zenfs.com
 * @param cb
 */
jasmineSeed.prototype.generateClientSideSeed = function (cb) {

    var self = this,
        DEFAULT_HTML_JS = "https://raw.github.com/pivotal/jasmine/v1.3.1/lib/jasmine-core/jasmine-html.js",
        DEFAULT_JS = "https://raw.github.com/pivotal/jasmine/v1.3.1/lib/jasmine-core/jasmine.js";

    self.loadScript(DEFAULT_JS, function () {
        self.loadScript(DEFAULT_HTML_JS, function () {
            cb();
            }
        );
    });
};

new jasmineSeed(ARROW.engineConfig).run();

