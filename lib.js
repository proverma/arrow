#!/usr/bin/env node

/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

//expose classes for custom controller usage
this.controller = require('./lib/interface/controller');
this.log4js = require('log4js');

//expose classes for multiple selenium sessions creation
this.webdrivermanager = require('./lib/util/webdrivermanager');
