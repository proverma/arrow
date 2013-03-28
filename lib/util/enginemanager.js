/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var log4js = require("log4js");
var fs = require("fs");
var path = require("path");
var arrowConfig=require('../../config/config');

function engineManager(config) {
	this.logger = log4js.getLogger("EngineManager");
	this.config = config || arrowConfig;

}

engineManager.prototype.getEngineSeed = function () {
	return this.config['engineSeed'];
}
engineManager.prototype.getEngineRunner = function () {
	return this.config['engineRunner'];
}
engineManager.prototype.getTestSeed = function (engineName) {
	var self = this;
	var engine = engineName || self.config.engine;
	engine = engine || "yui";
	if (engine && engine !== "yui") {
		try {
			var engineFloder = path.join(self.config['arrowModuleRoot'], "lib/engine"),
				seedfile = path.join(engineFloder, engine, engine + "-seed.js");

			if(!fs.statSync(seedfile).isFile()){
				throw new Error("test seed not exist");
			}
			return seedfile;
		} catch (e) {
			console.error("Finding engine seed" + engineName + " error , maybe it is not supported yet");
			throw e;
		}
	}
	return this.config['testSeed']; //default seed
}
engineManager.prototype.getTestRunner = function (engineName) {
	// some changes for engine
	var self = this;
	var engine = engineName || self.config.engine;
	engine = engine || "yui";
	if (engine && engine !== "yui") {
		try {
			var engineFloder = path.join(self.config['arrowModuleRoot'], "lib/engine"),
				runnerfile = path.join(engineFloder, engine, engine + "-runner.js");

			if ( !fs.statSync(runnerfile).isFile()) {
				throw new Error("test seed or runner not exist");
			}
			return runnerfile;
		} catch (e) {
			console.error("Finding engine runner" + engineName + " error , maybe it is not supported yet");
			throw e;
		}
	}
	return this.config['testRunner']; //default runner
}

module.exports = engineManager;