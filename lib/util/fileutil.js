/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var fs = require("fs");
var path = require('path');
var log4js = require("log4js");
var nodefs = require("node-fs");

function FileUtil() {
    this.logger = log4js.getLogger("FileUtil");
}

FileUtil.prototype.createDirectory = function (dirPath, callback) {

    if (!dirPath || dirPath === '') {
        console.log('****-Directory Path is empty or undefined..');
        return; //TODO -  To be handled by the caller
    }

//    console.log('****-Creating directory..' + dirPath);
    nodefs.mkdirSync(dirPath, 0777, true);

    if (callback) {
        callback();
    }
        // Check if the directory got created
//    if (fs.existsSync(dirPath)) {
//        //TODO - Return true ???
////        console.log('****-Directory created..' + dirPath);
//    } else {
////        console.log('****-Some error');
//    }

};

FileUtil.prototype.removeDirectory = function(dirPath, callback) {

    var files = [],
        file,
        stat,
        filePath,
        i;

//    console.log('****In removedirectory,Current path ' + dirPath);
    if (fs.existsSync(dirPath)) {

        files = fs.readdirSync(dirPath);

        for (i = 0; i < files.length; i += 1) {

            filePath = dirPath + path.sep + files[i];
//            console.log('****In removedirectory,File:' + filePath);
            stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                this.removeDirectory(filePath); //TODO - Pranav - Sharelibscanner fails if 'this' is not used here .. Why ??
            } else {
//                console.log('****In removedirectory,Deleting file::' + filePath);
                fs.unlinkSync(filePath);
            }

        }

//        console.log('****In removedirectory,Deleting directory::' + dirPath);
        fs.rmdirSync(dirPath);

    }

    if (callback) {
        callback();
    }


};

module.exports = FileUtil;