/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2014, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var log4js = require("log4js");
var ErrorManager = require("./errormanager");

function EngineUtil() {
    this.logger = log4js.getLogger("EngineUtil");
}

/**
 *
 * @param err
 */
EngineUtil.prototype.handleYUIRequireError = function(err) {

    var em = ErrorManager.getInstance(),
        self = this,
        match,
        yuiMissingMsg = 'Cannot find module \'yui\'';

    var proc = self.mock || process;

    match = err.message.match(yuiMissingMsg);

    if (match) {
        em.errorLog(1007,  err.message);
        proc.exit(2);
    }

};

module.exports = EngineUtil;