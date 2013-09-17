/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var log4js = require("log4js");
var fs = require("fs");
var clone = require("clone");

function CapabilityManager(capJsonPath) {
    this.logger = log4js.getLogger("CapabilityManager");
    this.capJson = JSON.parse(fs.readFileSync(capJsonPath, "utf-8"));
}

CapabilityManager.prototype.getCapability = function (capName) {

    var cap = clone(this.capJson.capabilities[capName]),
        commonCap = this.capJson.common_capabilities,
        k;

    if (cap) {
        for (k in commonCap) {
            cap[k] = commonCap[k];
        }
        return cap;
    }

    return null;

};

module.exports = CapabilityManager;

