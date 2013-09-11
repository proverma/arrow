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
    console.log('****Capjson::' + JSON.stringify(this.capJson));
}

CapabilityManager.prototype.getCapability = function (capName) {

    console.log('***In getCapability 1 : ' + capName);
    var cap = clone(this.capJson.capabilities[capName]);
    console.log('***In getCapability 2');
    var commonCap = this.capJson.common_capabilities,
        k;
    console.log('***In getCapability, capname:' + capName);
    console.log('***In getCapability, cap:' + cap);

    if (cap) {
        for (k in commonCap) {
            console.log('***k:' + k + ', commonCap[' + k + ']:' + commonCap[k]);
            cap[k] = commonCap[k];
            console.log('cap[k]:' + cap[k]);
        }
        return cap;
    }

    return null;

};

module.exports = CapabilityManager;

