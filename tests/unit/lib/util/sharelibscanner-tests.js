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

    var scanFolder = __dirname + "/sharelib/";
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

    function contains(arr,obj){
        for (i in arr) {
            if (arr[i] == obj) return true;
        }
        return false;
    }
    function assertFileExsit(filelist) {
        var isTrue = contains(filelist,'client_seed.js');
        Y.Assert.areEqual(true, isTrue, "Confirm client_seed.js is generated");
        isTrue = contains(filelist,'server_seed.js');
        Y.Assert.areEqual(true, isTrue, "Confirm server_seed.js is generated");
        isTrue = contains(filelist,'custom_controller.json');
        Y.Assert.areEqual(true, isTrue, "Confirm custom_controller.json is generated");
    }

    function assertFileContentExsit() {

        var readseed = function (seed, cb) {
            fs.readFile(path.join(metaPath, seed), 'utf8', function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    cb(data.toString());
                }
            });
        }

        readseed('client_seed.js', function (data) {
            Y.Assert.isTrue(data.indexOf("mymartini.client.js") != -1
                && data.indexOf("mymartini.common.js") != -1);
        });

        readseed('server_seed.js', function (data) {
            Y.Assert.isTrue(data.indexOf("mymartini.server.js") != -1
                && data.indexOf("mymartini.common.js") != -1);
        });

        readseed('custom_controller.json', function (data) {
            Y.Assert.isTrue(data.indexOf("my-test-controller.js") != -1);
        });

    }

    setup();
    new sharelibScanner().genSeedFile("Non-Exsit-Path", function () {
        suite.add(new Y.Test.Case({
            "Test generate Non-Exsit-Path Seed File":function () {
                fs.readdir(metaPath, function (err, list) {
                    assertFileExsit(list);
                });
            }
        }));
    });



    //check genSeedFile
    setup();
    new sharelibScanner().genSeedFile(undefined, function () {
        suite.add(new Y.Test.Case({
            "Test generate default Seed File":function () {
                fs.readdir(metaPath, function (err, list) {
                    assertFileExsit(list);
                });
            }
        }));

    });

    setup();
    new sharelibScanner().genSeedFile(scanFolder, function () {
        suite.add(new Y.Test.Case({
            "Test generate specified folder Seed File":function () {
                fs.readdir(metaPath, function (err, list) {
                    assertFileExsit(list);
                    assertFileContentExsit();
                });
            }
        }));

    });

    setup();
    new sharelibScanner().genSeedFile(scanMartiniFolder, function () {
        suite.add(new Y.Test.Case({
            "Test generate specified martini modules Seed File":function () {
                fs.readdir(metaPath, function (err, list) {
                    assertFileExsit(list);
                    assertFileContentExsit();
                });
            }
        }));
    });

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires:['test']});
 
 
 
 
 
 
 
