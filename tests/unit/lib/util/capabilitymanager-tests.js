/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('capabilitymanager-tests', function(Y) {

    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        capabilityMgr = require(arrowRoot+'/lib/util/capabilitymanager.js'),
        suite = new Y.Test.Suite("Capability Manager test suite");

    var cm = new capabilityMgr(__dirname + "/capabilities.json");

    suite.add(new Y.Test.Case({
        "Confirm constructor can take json": function(){
            Y.Assert.isNotNull(cm, "Make sure Capability Manager is not null");

        }
    }));

    suite.add(new Y.Test.Case({
        "Confirm getCapability works": function(){
            var expectedString = {"browserName":"firefox","platform":"WINDOWS","version":"6.0","javascriptEnabled":"true"};
            var cap = cm.getCapability("win_xp_ff_6");
            Y.Assert.areEqual(JSON.stringify(expectedString), JSON.stringify(cap), "Confirm the same JSON is returned");

            //Make sure null is returned and invalid capability is given
            cap = cm.getCapability("invalid");
            Y.Assert.isNull(cap, "Confirm null is returned if invalid cap is given");
        }
    }));


    Y.Test.Runner.add(suite);

}, '0.0.1' ,{requires:['test']});