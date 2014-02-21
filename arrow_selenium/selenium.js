#!/usr/bin/env node

/*jslint forin:true sub:true unparam:true, sloppy:true, stupid:true nomen:true, node:true continue:true es5:true*/
/*global boolean, alias, demand, describe, default, check, usage*/
/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var log4js = require("log4js");
var nomnom = require("nomnom");
var Properties = require("../lib/util/properties");
var ArrowSetup = require('../lib/util/arrowsetup');
var wd = require("../lib/util/wd-wrapper");
var logger = log4js.getLogger("selenium");
var SelLib = require('./selLib');
var SelOptions = require('./selOptions');

//getting command line args
var selOptions = new SelOptions();
var argv = selOptions.getOptions();

//Validate arg
selOptions.validateArgs(argv);

//setup config
var prop = new Properties(__dirname + "/../config/config.js", argv.config, argv);
var config = prop.getAll();

// Setup log4js and selenium host
var arrowSetup = new ArrowSetup(config, argv);
arrowSetup.setuplog4js();
arrowSetup.setupSeleniumHost();
logger.info("Selenium host: " + config["seleniumHost"]);

// Instantiate SelLib
var selLib = new SelLib(config);

if (argv.ls || argv.list) {
    selLib.list(); // List open sessions
} else if (argv.open) { // Open sessions
    selLib.open(argv.open, argv.capabilities, function(error) {
        if (error) {
            logger.error('Error while opening browser :' + error);
        }
    });
} else if (argv.close) { // Close sessions
    selLib.close(function(error){
        if (error) {
            logger.error('Error while opening browser :' + error);
        }
    });
}
