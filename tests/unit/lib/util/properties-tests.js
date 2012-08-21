/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


YUI.add('properties-tests', function (Y) {

    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        properties = require(arrowRoot+'/lib/util/properties.js'),
        suite = new Y.Test.Suite("Properties test suite");

    var defaultConfigPath = __dirname + "/config/defaultconfig.js";
    var overrideConfigPath = __dirname + "/config/configoverride.js";
    var overrides = {"autolib":"ivan/lib/common"}

    //Check only giving the main param
    suite.add(new Y.Test.Case({
        "Confirm constructor with default config path only": function(){
            var props = new properties(defaultConfigPath);
            Y.Assert.isNotNull(props, "Confirm properties is not null with one param");
            Y.Assert.areEqual(false, props.getAll().parallel, "Confirm default parallel value");
            Y.Assert.areEqual("http://default.url.com", props.getAll().baseUrl, "Confirm default baseURL is returned");
        }
    }));

    //Check constructor with all params
    suite.add(new Y.Test.Case({
        "Confirm normal constructor": function(){
            var props = new properties(defaultConfigPath, overrideConfigPath, overrides);
            Y.Assert.isNotNull(props, "Checking Properties is not null");
            Y.Assert.isObject(props.getAll(), "Confirm getAll Method returns an object");
        }
    }));



    //check giving is an override config, with no individual overrides
    suite.add(new Y.Test.Case({
        "Check constructor with default path and override path": function(){
            var props = new properties(defaultConfigPath, overrideConfigPath);
            Y.Assert.isNotNull(props, "confirm constructor is not null");
            Y.Assert.areEqual(true, props.getAll().parallel, "Confirm overriding parallel");
            Y.Assert.areEqual("http://new.base.url.com", props.getAll().baseUrl, "Confirm override baseURL is returned");
            Y.Assert.areEqual("INFO", props.getAll().logLevel, "Make sure default values are still returned, if not overridden");
        }
    }));

    //Check overriding individual configs
    suite.add(new Y.Test.Case({
         "Check constructor with three params": function(){
             var props = new properties(defaultConfigPath, overrideConfigPath, overrides);
             Y.Assert.isNotNull(props, "confirm constructor is not null");
             Y.Assert.areEqual("ivan/lib/common", props.getAll().autolib, "Make sure individual overrides work");
             Y.Assert.areEqual("http://new.base.url.com", props.getAll().baseUrl, "Confirm override baseURL is returned");
             Y.Assert.areEqual("INFO", props.getAll().logLevel, "Make sure default values are still returned, if not overridden");
         }
    }));

    //Test get individual value
    suite.add(new Y.Test.Case({
        "Check method getValue": function(){
            var props = new properties(defaultConfigPath, overrideConfigPath, overrides);
            Y.Assert.isNotNull(props, "confirm constructor is not null");
            Y.Assert.areEqual("ivan/lib/common", props.getValue("autolib"), "Make sure individual overrides work");
            Y.Assert.areEqual("http://new.base.url.com", props.getValue("baseUrl"), "Confirm override baseURL is returned");
            Y.Assert.areEqual("INFO", props.getValue("logLevel"), "Make sure default values are still returned, if not overridden");
        }
    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires:['test']});
 
 
 
 
 
 
 