/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/**
 * Properties is config management class, 
 * at commandline, and in config file, and then return values
 * @constructor
 *
 * @param defaultConfigPath : global location of config file 
 * @param configPath : local overriding config file 
 * @param overrides : overriding key value pairs
 */
function Properties(defaultConfigPath, configPath, overrides) {
    var overrideConfig,
        name;

    this.config = require(defaultConfigPath);

    // override with a local config
    if (configPath) {
        overrideConfig = require(configPath);
        for (name in overrideConfig) {
            this.config[name] = overrideConfig[name];
        }
    }

    if (!overrides) { return; }

    // override with cmd line
    for (name in overrides) {
        if (this.config.hasOwnProperty(name)) {
            this.config[name] = overrides[name];
        }
    }
}

Properties.prototype.getAll = function () {
    return this.config;
};

Properties.prototype.getValue = function (param) {
    return this.config[param];
};

module.exports = Properties;

//var prop = new Properties("../conf/config", null, {"browser": "foo", "xx": "yy"});
//console.log(prop.getAll());

