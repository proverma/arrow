/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2014, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var log4js = require("log4js");
var ErrorManager = require("../util/errormanager");

function EngineUtil() {
    this.logger = log4js.getLogger("EngineUtil");
}

/**
 *
 * @param err
 */
EngineUtil.prototype.handleYUIRequireError = function(err) {

    var em = ErrorManager.getInstance();
    var match;

    match = err.message.match('Cannot find module \'yui\'');

    if (match) {
        em.errorLog(1007,  err.message);
        process.exit(2);
    }

//    var errMsg = '';
//    if (err.message.indexOf('Cannot find module \'yui\'') > -1){
//        errMsg = '\nYUI is not installed.' +
//            '\nIf you are running using global installation of Arrow, please install yui globally.' +
//            'If you are running using local installation of Arrow, please add yui dependency in your package.json ';
//    }
//    console.error('\nException while requiring YUI - ' + err.message + ' '  + errMsg);
//    process.exit(2);


};

module.exports = EngineUtil;