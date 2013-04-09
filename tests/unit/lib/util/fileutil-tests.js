/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


YUI.add('fileutil-tests', function (Y) {

    var suite = new Y.Test.Suite("File Util test suite"),
        path = require('path'),
        fs = require('fs'),
        log4js = require("log4js"),
        arrowRoot = path.join(__dirname, '../../../..'),
        FileUtil = require(arrowRoot + '/lib/util/fileutil.js'),
        logger = log4js.getLogger("FileUtilTests"),
        A = Y.Assert;

    suite.add(new Y.Test.Case({
        "Create Directory": function() {

            var fileUtil = new FileUtil(),
                dirPath = "tmp/dirA";

            fileUtil.createDirectory(dirPath, function() {

                path.exists(dirPath, function(exists) {
                    A.areEqual(exists, true, 'Not able to create directory ' + dirPath);
                });

            });

        }
    }));

    suite.add(new Y.Test.Case({
        "Create Directory Empty Path": function() {

            var fileUtil = new FileUtil(),
                dirPath = "";

            fileUtil.createDirectory(dirPath, function(e) {
                A.areEqual(null, e.toString(), "There should be no error");
            });

            dirPath = undefined;
            fileUtil.createDirectory(dirPath, function(e) {
                A.areEqual(null, e.toString(), "There should be no error");
            });


        }
    }));


    suite.add(new Y.Test.Case({
        "Remove Directory": function() {

            var fileUtil = new FileUtil(),
                dirAPath = path.resolve(process.cwd(), 'tmpFiles', 'dirA'),
                dirBPath = path.resolve(dirAPath, 'dirB'),
                fd,
                exists;

            fileUtil.createDirectory(dirAPath, function() {
                logger.info('DirAPath..' + dirAPath);
                logger.info('In callback of createDirectory..' + dirAPath);
                fd = fs.openSync(path.resolve(dirAPath, 'fileA.txt'), 'w');
                fs.writeSync(fd, 'This is file A');
                fs.closeSync(fd);

                fileUtil.createDirectory(dirBPath, function() {
                    logger.info('In callback of createDirectory..' + dirBPath);
                    fd = fs.openSync(path.resolve(dirBPath, 'fileB.txt'), 'w');
                    fs.writeSync(fd, 'This is file B');
                    fs.closeSync(fd);

                    fileUtil.removeDirectory(path.resolve(process.cwd(), 'tmpFiles'), function() {
                        logger.info('In callback of removeDirectory..' + path.resolve(process.cwd(), 'tmpFiles'));
                        path.exists(path.resolve(process.cwd(), 'tmpFiles'), function(exists) {
                            A.areEqual(exists, false, 'Not able to remove directory... ' + path.resolve(process.cwd(), 'tmpFiles'));
                        });

                    });

                });

            });


        }
    }));


    Y.Test.Runner.add(suite);
}, '0.0.1', {requires: ['test']});
