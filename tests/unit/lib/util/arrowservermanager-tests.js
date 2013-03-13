/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


YUI.add('arrowservermanager-tests', function (Y) {

    var path = require('path');
    global.appRoot = path.join(__dirname, '../../../..');
    var fs = require('fs'),
        arrowRoot = global.appRoot,
        servermanager = require(arrowRoot + '/lib/util/arrowservermanager.js'),
        suite = new Y.Test.Suite("arrow server manager test suite");

     suite.add(new Y.Test.Case({

        "Test get localhost ip":function () {

            Y.Assert.isTrue(/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.test(servermanager.getLocalhostIPAddress()));
            Y.Assert.isTrue(/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.test(servermanager.getProperIPAddressForArrowServer()));

        },
        "Test server host":function () {

           Y.Assert.isTrue(servermanager.getArrowServerHost()==undefined);

           servermanager.getArrowServerStatus(function(res){
               Y.Assert.isFalse(res);
           });
        },

         "ignore:Test start/stop server":function () {

             var self =this;

             servermanager.startArrowServer();
             var exec = require('child_process').exec;
             exec('ps aux|grep arrow_server/server.js | grep -v \'grep\'',
                 function (error, stdout, stderr) {
                     self.resume(function(){
                         console.log(stdout);
                         Y.Assert.isTrue(stdout.length>0);
                     })
                 });
             self.wait(5000);

             servermanager.stopArrowServer(true);

             self.wait(5000,function(){
                 var exec = require('child_process').exec;
                 exec('ps aux|grep arrow_server/server.js | grep -v \'grep\'',
                     function (error, stdout, stderr) {
                         console.log(stdout);
                         Y.Assert.isFalse(stdout.length>0);
                     });
             });
         }
    }));

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires:['test']});
 
