/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var log4js = require("log4js");
var fs = require("fs");
var glob = require("glob");
var path = require("path");

function LibManager() {
    this.logger = log4js.getLogger("LibManager");
}

LibManager.prototype.getAllTest = function (strLibPath, relativePath) {
    var libs = "",
        arrLib,
        stat,
        dir,
        tmpArr,
        result,
        i,
        j,
        lib;
    this.strLibPath = strLibPath;
    this.logger.trace("Normalizing libs: " + strLibPath);
    arrLib = this.strLibPath.split(",");
    for (i = 0; i < arrLib.length; i += 1) {
        lib = arrLib[i].trim();
        try {
            if (relativePath) {
                lib = path.resolve(global.workingDirectory, relativePath, lib);
            }
            if (fs.statSync(lib)) {
                stat = fs.statSync(lib);
                if (stat.isFile()) {
                    if (-1 !== lib.indexOf(".js")) {
                        libs += lib + ",";
                    } else {
                        this.logger.warn(lib + " is not a .js file, ignoring this library !");
                    }
                } else if (stat.isDirectory()) {
                    dir = lib;
                    if ("/" === dir.substr(dir.length - 1, dir.length)) {
                        dir = dir.substr(0, dir.length - 1);
                    }
                    tmpArr = fs.readdirSync(dir);
                    for (j = 0; j < tmpArr.length; j += 1) {
                        if (-1 !== tmpArr[j].indexOf(".js")) {
                            libs += dir + "/" + tmpArr[j] + ",";
                        }
                    }
                } else {
                    this.logger.warn("Unable to read :" + lib + ", ignoring this library !");
                }

            }
        } catch (e) {
            // checking if its a framework lib
            if (lib.indexOf(".") === -1) {
                result = glob.sync(path.resolve(global.appRoot, "sharelib", "lib") + "/**/" + lib + ".js");
                if (result.length > 0) {
                    stat = fs.statSync(result[0]);
                    if (stat.isFile()) {
                        libs += result[0] + ",";
                    }
                } else {
                    this.logger.warn("Unable to read :" + lib + ", ignoring this library !");
                }
            } else {

                this.logger.error(e.toString());
            }
        }
    }

    if (libs) {
        libs = libs.substr(0, libs.length - 1);
    }

    this.logger.debug("Normalized libs: " + libs);
    return libs;
};

LibManager.prototype.getAllCommonLib = function (config, lib) {
    var commonLib = "";

    if (config["autolib"] && lib) {
        commonLib = config["autolib"] + "," + lib;
    } else if (config["autolib"]) {
        commonLib = config["autolib"];
    } else if (lib) {
        commonLib = lib;
    }
    
    if (commonLib) {
        this.logger.trace("Global libs: " + commonLib);
        return this.getAllTest(commonLib);
    }

    return "";
};

module.exports = LibManager;

