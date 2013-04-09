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

                A.areEqual(fs.existsSync(dirPath), true, 'Not able to create directory ' + dirPath);

                // Clean up
                fileUtil.removeDirectory(dirPath, function() {
                    A.areEqual(fs.existsSync(dirPath), false, 'Not able to remove directory ' + dirPath);
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
                dirAPath = process.cwd() + path.sep + 'tmpFiles' + path.sep + 'dirA',
                dirBPath = dirAPath + path.sep + 'dirB',
                fd;

            function setup(callback) {

                logger.info('In setup..creating directory..' + dirAPath);
                fileUtil.createDirectory(dirAPath, function() {

                    logger.info('In callback of create directory..created..' + dirAPath);
                    fd = fs.openSync(dirAPath + path.sep + 'fileA.txt', 'w');
                    logger.info('In callback of setup..opening directory..' + dirAPath + path.sep + 'fileA.txt');
                    fs.writeSync(fd, 'This is file A');
                    fs.closeSync(fd);

                    fileUtil.createDirectory(dirBPath, function() {
                        logger.info('In callback of create directory..created..' + dirBPath);
                        fd = fs.openSync(dirBPath + path.sep + 'fileB.txt', 'w');
                        logger.info('In callback of setup..opening directory..' + dirBPath + path.sep + 'fileB.txt');
                        fs.writeSync(fd, 'This is file B');
                        fs.closeSync(fd);


                        fileUtil.removeDirectory(process.cwd() + path.sep + 'tmpFiles', function() {
                            A.areEqual(fs.existsSync(process.cwd() + path.sep + 'tmpFiles'),
                                false, 'Not able to remove directory ' + process.cwd() + path.sep + 'tmpFiles');
                        });

                    });

                });

            }

            setup(function() {
                logger.info('In callback of setup directory..created..' + dirBPath);

            });

        }
    }));


    Y.Test.Runner.add(suite);
}, '0.0.1', {requires: ['test']});
