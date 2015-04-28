/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require("fs");
var path = require('path');
var log4js = require("log4js");
var mkdirp = require("mkdirp");
var existsSync = fs.existsSync || path.existsSync;

function FileUtil() {
    this.logger = log4js.getLogger("FileUtil");
}

FileUtil.prototype.createDirectory = function (dirPath, callback) {

    if (!dirPath || dirPath === '') {
        this.logger.info('Directory Path is empty or undefined..');
        return;
    }

    mkdirp.sync(dirPath);

    if (callback) {
        callback();
    }

};

FileUtil.prototype.removeDirectory = function(dirPath, callback) {

    var files = [],
        stat,
        filePath,
        i;

    if (existsSync(dirPath)) { // path.existsSync is used to support node 0.6 ( use fs.existsSync for versions >= 0
        files = fs.readdirSync(dirPath);

        for (i = 0; i < files.length; i += 1) {

            filePath = path.resolve(dirPath, files[i]);
            stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                this.removeDirectory(filePath);
            } else {
                fs.unlinkSync(filePath);
            }
        }

        fs.rmdirSync(dirPath);
    }

    if (callback) {
        callback();
    }

};

module.exports = FileUtil;