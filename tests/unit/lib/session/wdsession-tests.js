/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


YUI.add('wdsession-tests', function (Y) {

    var path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        wdSession = require(arrowRoot+'/lib/session/wdsession.js'),
        seleniumServer = require(arrowRoot + '/tests/unit/stub/seleniumserver.js'),
        suite = new Y.Test.Suite("wdsession test suite"),
        port = 4600,
        A = Y.Assert;

    suite.add(new Y.Test.Case({

        name : "Call getSessions when selenium server is unavailable",

        testGetSessionsWithoutSeleniumServer: function(){
            Y.log(port);
            var wds = new wdSession({"seleniumHost" :"http://localhost:" + port + "/wd/hub"}),
                test = this;
            wds.getSessions(function (error) {
                console.log('***Error::' + error);
                A.areEqual(error.toString(),"connect ECONNREFUSED", "Error should be 'connect ECONNREFUSED'");
                test.resume();
            },true);
            this.wait(5000);
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call getSessions when selenium server is available, but has no active sessions",

        testGetSessionsWithNoActiveSession: function(){
            this.server = new seleniumServer(port);
            this.server.startServer();
            var wds = new wdSession({"seleniumHost" :"http://localhost:" + port + "/wd/hub"}),
                test = this;

            wds.getSessions(function (error) {
                A.areEqual(error.toString(),"Error : No active selenium session found", "Error should be 'Error : No active selenium session found'");
                test.resume();
                test.server.stopServer();
            });
            this.wait(5000);
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call getSessions when selenium server is available, and has just one active session",

        testGetSessionsWithOneActiveSession: function(){
            this.server = new seleniumServer(port);
            this.server.startServer();
            this.server.setActiveSessionCount(1);
            var wds = new wdSession({"seleniumHost" :"http://localhost:" + port + "/wd/hub"}),
                test = this;

            wds.getSessions(function (error, arrSessions) {
                A.isNull(error);
                A.areEqual(arrSessions.length, 1, " There should be only one session id returned");
                A.areEqual(arrSessions[0], 1000000000000, "Session ID value should be 1000000000000");

                Y.log(arrSessions);
                test.resume();
                test.server.stopServer();
            }, true);
            this.wait(5000);
        }
    }));

    suite.add(new Y.Test.Case({

        name : "Call getSessions when selenium server is available, and has five active sessions",

        testGetSessionsWithFiveActiveSession: function(){
            this.server = new seleniumServer(port);
            this.server.startServer();
            this.server.setActiveSessionCount(5);
            var wds = new wdSession({"seleniumHost" :"http://localhost:" + port + "/wd/hub"}),
                test = this;

            wds.getSessions(function (error, arrSessions) {

                A.isNull(error);
                A.areEqual(arrSessions.length, 5, " There should be only one session id returned");
                A.areEqual(arrSessions[0], 1000000000000, "Session ID value should be 1000000000000");
                A.areEqual(arrSessions[1], 1000000000001, "Session ID value should be 1000000000001");
                A.areEqual(arrSessions[2], 1000000000002, "Session ID value should be 1000000000002");
                A.areEqual(arrSessions[3], 1000000000003, "Session ID value should be 1000000000003");
                A.areEqual(arrSessions[4], 1000000000004, "Session ID value should be 1000000000004");

                test.resume();
                test.server.stopServer();
            });
            this.wait(5000);
        }
    }));


    Y.Test.Runner.add(suite);

}, '0.0.1', {requires:['test']});
 
 
 
 
 
 
 
