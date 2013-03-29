/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var log4js = require("log4js");
var fs = require("fs");
var path = require("path");
var arrowConfig = require('../../config/config');

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
	var self = this,
		engine = engineName || "yui";
	if (engine && engine !== "yui") {
		try {
			var engineFloder = path.join(self.config['arrowModuleRoot'], "lib/engine"),
				seedfile = path.join(engineFloder, engine, engine + "-seed.js");

			if (!fs.statSync(seedfile).isFile()) {
				throw new Error("test seed not exist");
			}
			return seedfile;
		} catch (e) {
			this.logger.error("Finding engine seed" + engineName + " error , maybe it is not supported yet");
			throw e;
		}
	}
	return this.config['testSeed']; //default seed
}

engineManager.prototype.getTestRunner = function (engineName) {
	// some changes for engine
	var self = this,
		engine = engineName || "yui";
	if (engine && engine !== "yui") {
		try {
			var engineFloder = path.join(self.config['arrowModuleRoot'], "lib/engine"),
				runnerfile = path.join(engineFloder, engine, engine + "-runner.js");

			if (!fs.statSync(runnerfile).isFile()) {
				throw new Error("test seed or runner not exist");
			}
			return runnerfile;
		} catch (e) {
			this.logger.error("Finding engine runner" + engineName + " error , maybe it is not supported yet");
			throw e;
		}
	}
	return this.config['testRunner']; //default runner
}


engineManager.prototype.getConfigJason = function (configjson) {

	if (!configjson)return {};
	if (typeof configjson === "string") {
		try {// it is a path
			var config = fs.readFileSync(path.normalize(configjson), 'utf8');
			try {
				config = JSON.parse(config);
				return config;
			} catch (e) {
				// maybe key-value formart file
				this.logger.error("Please confirm the config file" + configjson + "  is json formart");
				return {};
			}
		} catch (e) {
			// no such file
			try {
				config = JSON.parse(configjson);
				return config;
			} catch (e) {
				this.logger.error("Please confirm the config string" + configjson + " is json formart");
				return {}
			}
		}
	} else if (typeof configjson === "object") {
		return configjson;
	} else {
		this.logger.error("Please confirm the config " + configjson + " is object or json formart file/string");
		return {};
	}
}

module.exports = engineManager;