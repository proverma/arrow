/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */



YUI.add('libmanager-tests', function (Y) {

    var conf = {
        "autolib" : __dirname + "/config/"
    };

    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        libmgr = require(arrowRoot+'/lib/util/libmanager.js'),
        suite = new Y.Test.Suite("Lib Manager test suite");

    var libpath = __dirname + "/config/";
    var badlibpath = __dirname + "/badlibs/";
    var libmanager = new libmgr();

    suite.add(new Y.Test.Case({
        "Confirm Constructor": function(){
            Y.Assert.isNotNull(libmanager, "Confirm Lib Manager is not null");
        }
    }));

    //check getAllTests
    suite.add(new Y.Test.Case({
        "Check getAllTest Method": function(){
            //Expected is concatenation of the values js and json files in config
            var result = libmanager.getAllTest(libpath).split(",");
            result.sort();

            Y.Assert.areEqual(__dirname + "/config/configoverride.js", result[0], "Check Files are Returned");
            Y.Assert.areEqual(__dirname + "/config/defaultconfig.js", result[1], "Check Files are Returned");
            Y.Assert.areEqual(__dirname + "/config/descriptor-schema.json", result[2], "Check Files are Returned");

            //Check that when I give it a path wich includes no extension, the file is not returned
            expected = __dirname + "/badlibs/nonJsFileGoodExtension.js";
            Y.Assert.areEqual(expected, libmanager.getAllTest(badlibpath), "Check only file with JS extension is returned");
        }
    }));

    //Check getAllCommonLib
    suite.add(new Y.Test.Case({
        "Check getAllCommonLib method": function(){
            //Check when conf is given, autolib, pointing to local config, we get the correct information

            var result = libmanager.getAllCommonLib(conf).split(",");
            result.sort();

            Y.Assert.areEqual(__dirname + "/config/configoverride.js", result[0], "Testing with one Param");
            Y.Assert.areEqual(__dirname + "/config/defaultconfig.js", result[1], "Testing with one Param");
            Y.Assert.areEqual(__dirname + "/config/descriptor-schema.json", result[2], "Testing with one Param");

            //Check getAllCommonLib with two params
            // expected += "," +__dirname + "/config/defaultconfig.js";

            result = libmanager.getAllCommonLib(conf, __dirname + "/config/defaultconfig.js").split(",");
            result.sort();

            Y.Assert.areEqual(__dirname + "/config/defaultconfig.js", result[2], "Testing with two Params");
        }
    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires:['test']});
 
 
 
 
 
 
 