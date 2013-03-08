/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


YUI.add('sharelibscanner-tests', function (Y) {

    var path = require('path');
    global.appRoot = path.join(__dirname, '../../../..');
    var fs = require('fs'),
        arrowRoot = global.appRoot,
        sharelibScanner = require(arrowRoot + '/lib/util/sharelibscanner.js'),
        suite = new Y.Test.Suite("Share Lib Scanner test suite");

    var scanFolder = __dirname + "/sharelibtestdata/";
    var scanMartiniFolder = scanFolder + "martini_lib";
    var metaPath = path.join(arrowRoot, '/tmp/');

    function setup() {
        try {
            fs.unlinkSync(path.join(metaPath, 'client_seed.js'));
            fs.unlinkSync(path.join(metaPath, 'server_seed.js'));
            fs.unlinkSync(path.join(metaPath, 'custom_controller.json'));
        } catch (e) {
        }
    }

    function contains(arr, obj) {
        for (i in arr) {
            if (arr[i] == obj) return true;
        }
        return false;
    }

    function assertFileExsit(filelist) {
        var isTrue = contains(filelist, 'client_seed.js');
        Y.Assert.areEqual(true, isTrue, "Confirm client_seed.js is generated");
        isTrue = contains(filelist, 'server_seed.js');
        Y.Assert.areEqual(true, isTrue, "Confirm server_seed.js is generated");
        isTrue = contains(filelist, 'custom_controller.json');
        Y.Assert.areEqual(true, isTrue, "Confirm custom_controller.json is generated");
    }

    function assertFileContentExsit() {

        var readseed = function (seed, cb) {
            try {
                var data = fs.readFileSync(path.join(metaPath, seed), 'utf8');
                cb(data.toString());
            } catch (e) {
                console.log(e);
            }
        }
        readseed('client_seed.js', function (data) {
            console.log("~~~~~~~ read client seed");
            Y.Assert.isTrue(data.indexOf("mymartini.client.js") != -1
                && data.indexOf("mymartini.common.js") != -1);
        });

        readseed('server_seed.js', function (data) {
            console.log("~~~~~~~ read server seed");
            Y.Assert.isTrue(data.indexOf("mymartini.server.js") != -1
                && data.indexOf("mymartini.common.js") != -1);
        });

        readseed('custom_controller.json', function (data) {
            console.log("~~~~~~~ read controller");
            Y.Assert.isTrue(data.indexOf("my-test-controller.js") != -1);
            i++;
        });

    }

    suite.add(new Y.Test.Case({
        "Test generate Seed File given no scan path":function () {
            setup();
            new sharelibScanner().genSeedFile([], function () {
            });
        },
        "Test generate Non-Exsit-Path Seed File":function () {
            var self = this;
            setup();
            new sharelibScanner().genSeedFile(["Non-Exsit-Path", scanMartiniFolder + '/lib/common/mymartini.common.js'], function () {
                console.log("~~~~~~~~~~Non-exist-path");
                fs.readdir(metaPath, function (err, list) {
                    self.resume(function () {
                        assertFileExsit(list);
                    });
                });
            });
            self.wait(5000);
        },
        "Test generate default Seed File":function () {
            var self = this;
            setup();
            new sharelibScanner().genSeedFile(undefined, function () {
                self.resume(function () {
                    console.log("~~~~~~~~~~default");
                    fs.readdir(metaPath, function (err, list) {
                        self.resume(function () {
                            console.log("++++++++++++++++ assert file");
                            assertFileExsit(list);
                        });
                    });
                    self.wait(1000);
                });
            });
            self.wait(5000);
        },
        "Test generate specified folder Seed File":function () {
            var self = this;
            setup();
            new sharelibScanner().genSeedFile(scanFolder, function () {
                self.resume(function () {
                    console.log("~~~~~~~~~~specified folder");
                    fs.readdir(metaPath, function (err, list) {
                        self.resume(function () {
                            console.log("++++++++++++++++ assert file");
                            assertFileExsit(list);
                            assertFileContentExsit();
                        });
                    });
                    self.wait(1000);
                });
            });
            self.wait(5000);
        },
        "Test generate specified martini modules Seed File":function () {
            var self = this;
            setup();
            new sharelibScanner().genSeedFile(scanMartiniFolder, function () {
                self.resume(function () {
                    console.log("~~~~~~~~~~ matini folder");
                    fs.readdir(metaPath, function (err, list) {
                        self.resume(function () {
                            console.log("++++++++++++++++ assert file");
                            assertFileExsit(list);
                            assertFileContentExsit();
                        });
                    });
                    self.wait(1000);
                });
            });
            self.wait(5000);
        }
    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires:['test']});
 
 
 
 
 
 
 
