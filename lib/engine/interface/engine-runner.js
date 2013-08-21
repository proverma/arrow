/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/**
 * this is interface for container runer
 * users can extend other test container/engine if implement this interface
 */
var isCommonJS = typeof window === "undefined" && typeof exports === "object";

/**
 * @constructor
 * @param config
 */
function engineRunner(config) {
    this.config = config || {};
    if (!ARROW) {
        ARROW = {};
    }
}
/**
 * interface for set client side report
 * @param callback
 */
engineRunner.prototype.setClientSideReporter = function (callback) {
    callback();
};
/**
 * interface for set server side report
 * @param callback
 */
engineRunner.prototype.setServerSideReporter = function (callback) {
    callback();
};

/**
 * interface for collect report
 * @param callback
 */
engineRunner.prototype.collectReport = function (callback) {
    callback();
};

/**
 * interface for run runner
 * @param callback
 */
engineRunner.prototype.runRunner = function (callback) {
    callback();
};

/**
 * must be call in implementation,then runner will be called and collect report
 */
engineRunner.prototype.run = function () {
    var self = this;
    if (isCommonJS) {
        // server side
        self.setServerSideReporter(function () {
            self.runRunner(function () {
                self.collectReport(function (report) {
                    ARROW.testReport = JSON.stringify(report);
                });
            });
        });

    } else {
        // client side
        self.setClientSideReporter(function () {
            self.runRunner(function () {
                self.collectReport(function (report) {
                    ARROW.testReport = JSON.stringify(report);
                });
            });
        });
    }
};

if (isCommonJS) {
    module.exports.engineRunner = engineRunner;
} else {
    window.engineRunner = engineRunner;
}
