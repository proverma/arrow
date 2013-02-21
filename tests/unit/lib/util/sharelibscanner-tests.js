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
        sharelibScanner = require(arrowRoot+'/lib/util/sharelibscanner.js'),
        suite = new Y.Test.Suite("Share Lib Scanner test suite");

    var scanFolder = __dirname + "/sharelib/";

    var metaPath = path.join(arrowRoot, '/tmp/');
    fs.unlink(path.join(metaPath, 'client_seed.js'), function(){});
    fs.unlink(path.join(metaPath, 'server_seed.js'), function(){});
    fs.unlink(path.join(metaPath, 'custom_controller.json'), function(){});

    //check genSeedFile
    suite.add(new Y.Test.Case({
        "Check genSeedFile Method": function(){
            sharelibScanner.genSeedFile(scanFolder, function () {
                fs.readdir(metaPath, function (err, list) {
                    var isTrue = list.contains('client_seed.js'); 
                    Y.Assert.areEqual(true, isTrue, "Confirm client_seed.js is generated");
                    isTrue = list.contains('server_seed.js'); 
                    Y.Assert.areEqual(true, isTrue, "Confirm server_seed.js is generated");
                    isTrue = list.contains('custom_controller.json'); 
                    Y.Assert.areEqual(true, isTrue, "Confirm custom_controller.json is generated");
                });
            });
        }
    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires:['test']});
 
 
 
 
 
 
 
