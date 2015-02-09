/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2014, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var SauceLabs = require('saucelabs');
var log4js = require("log4js");

function SauceLabsUtil() {
    this.logger = log4js.getLogger("SauceLabsUtil");
}

/**
 * Update sauce labs job status
 * @param result
 * @param sessionId
 * @param sauceUser
 * @param sauceKey
 * @param callback
 */
SauceLabsUtil.prototype.updateJobStatus = function(result, sessionId, sauceUser,
                                                   sauceKey, callback) {
    var sauceLabs = new SauceLabs({username: sauceUser, password: sauceKey}),
        self = this;

    sauceLabs.updateJob(sessionId, result, function(err) {
        if (err) {
            callback(new Error('Error updating Sauce pass/fail status: ' + err));
            return;
        }

        self.logger.debug('Updated result successfully to SauceLabs for session id - '
            + sessionId);

        callback(null);
        return;
    });

};

module.exports = SauceLabsUtil;