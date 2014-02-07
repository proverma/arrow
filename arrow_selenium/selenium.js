#!/usr/bin/env node

/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var nopt = require("nopt");
var log4js = require("log4js");

var Properties = require("../lib/util/properties");
var ArrowSetup = require('../lib/util/arrowsetup');
var SelLib = require('./selLib');
//getting command line args
var argv = nopt();

var wd = require("../lib/util/wd-wrapper");
//setup config
var prop = new Properties(__dirname + "/../config/config.js", argv.config, argv);
var config = prop.getAll();
var logger = log4js.getLogger("selenium");

var arrowSetup = new ArrowSetup(config, argv);
arrowSetup.setuplog4js();
arrowSetup.setupSeleniumHost();
logger.info("Selenium host: " + config["seleniumHost"]);

var selLib = new SelLib(config,argv);
selLib.seleniumSessionSetup(); //TODO - Method rename
