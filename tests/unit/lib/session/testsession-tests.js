/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('testsession-tests', function (Y) {

    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        testSession = require(arrowRoot+'/lib/session/testsession.js'),
        suite = new Y.Test.Suite("testsession test suite"),
        StubArrow = require(arrowRoot + '/tests/unit/stub/arrow.js'),
        Arrow = require(arrowRoot + '/lib/interface/arrow'),
        A = Y.Assert;



    suite.add(new Y.Test.Case({

        name : "Call testSessions setup with all null params",

        testSetupWithAllNullParams: function(){
            var ts = new testSession({},{},null);
            ts.setup(function() {
                A.areEqual(ts.driverName, "nodejs" ,"default driver name if all params are null, should be 'nodejs'") ;
                A.isNotNull(ts.driver, "driver object should be created")
            });
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call testSessions setup with custom controller",

        testSetupWithController: function(){
            var ts = new testSession({},{"controller" : "SuperIntelligentController"},null);
            ts.setup(function() {
                A.areEqual(ts.driverName, "selenium" ,"For any custom controller driver name should be 'selenium'") ;
                A.isNotNull(ts.driver, "driver object should be created")
            });
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call testSessions setup with browser",

        testSetupWithBrowser: function(){
            var ts = new testSession({},{"browser" : "firefox"},null);
            ts.setup(function() {
                A.areEqual(ts.driverName, "selenium" ,"if browser is passed, driver name should be 'selenium'") ;
                A.isNotNull(ts.driver, "driver object should be created")
            });
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call testSessions setup with Page",

        testSetupWithPage: function(){
            var ts = new testSession({},{"params":{"page" : "http://www.yahoo.com"}},null);
            ts.setup(function() {
                A.areEqual(ts.driverName, "selenium" ,"if page is passed, driver name should be 'selenium'") ;
                A.isNotNull(ts.driver, "driver object should be created")
            });
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call testSessions setup with SessionID",

        testSetupWithSessionID: function(){
            var ts = new testSession({},{},1);
            ts.setup(function() {
                A.areEqual(ts.driverName, "selenium" ,"if sessionID is passed, driver name should be 'selenium'") ;
                A.isNotNull(ts.driver, "driver object should be created");
                A.areEqual(ts.driver.sessionId,1,"SessionID should be '1'");
            });
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call testSessions setup without page but with defaultTestHost",

        testSetupForDefaultTestHost: function(){
            var ts = new testSession({"defaultTestHost":"SuperHost"},{},null);
            ts.setup(function() {
                A.isNotNull(ts.driver, "driver object should be created");
                A.areEqual(ts.testParams.page,"SuperHost","page should be 'SuperHost'");
            });
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Run a testsession test",

        testSessionRun: function(){
            var ts = new testSession({},{},null),
                arrow = new StubArrow();

            Arrow.instance = arrow;

            ts.runTest(function(error) {
                A.areEqual(error,undefined);
            });
        }
    }));





    Y.Test.Runner.add(suite);

}, '0.0.1', {requires:['test']});
 
 
 
 
 
 
 
