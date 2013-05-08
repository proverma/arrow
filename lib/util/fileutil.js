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
var existsSync = path.existsSync || fs.existsSync;

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

FileUtil.prototype.deleteFile = function(filePath, callback) {

    console.log('***Deleting :' + filePath);

    try {

        if (existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('***Deleted :' + filePath);
            callback();
        } else {
            console.log('***Doesnt exist :' + filePath);
            callback();
        }

    } catch (e) {
        callback();
    }

};

module.exports = FileUtil;