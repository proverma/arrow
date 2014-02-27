/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 *
 * Parses the command line arguments
 */

var log4js = require("log4js");
var logger = log4js.getLogger("selenium");
var SelLib = require('./selLib');
var nopt = require("nopt");
/**
 *
 * @constructor
 */
function SelOptions() {
}

/**
 *
 * @returns {Command}
 */
SelOptions.prototype.getOptions = function () {

    var argv = nopt();
    return argv;

};

/**
 *
 * @param argv
 * Validate the arguments passed by the user in the command line
 * Exit with appropriate message , if arguments are not valid
 */
SelOptions.prototype.validateArgs = function (argv) {

    // If neither of open,list or close is passed ,exit
    if (!(argv.open || argv.list || argv.close)) {
        var selLib = new SelLib();
        selLib.printHelp();
        process.exit(1);
    }

    // Capabilities can only be passed when opening the browser
    if (argv.capabilities && !argv.open) {
        logger.fatal('Capabilities can only be passed when opening the browser. Exiting !!!!');
        process.exit(1);
    }

};

module.exports = SelOptions;
