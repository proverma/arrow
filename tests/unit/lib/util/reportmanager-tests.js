/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 * 
 * @author ivan alonso
 */

YUI.add('reportmanager-tests', function(Y) {

    var suite = new Y.Test.Suite("Report Manager test suite"),
        path = require('path'),
        arrowRoot = path.join(__dirname, '../../../..'),
        repManager = require(arrowRoot + '/lib/util/reportmanager.js'),
        A = Y.Assert;


    suite.add(new Y.Test.Case({

        "writeReports With Blank reportObj": function(){

            try {
                var rm = new repManager({});
                rm.writeReports();
            } catch (e){
                Y.Assert.areEqual(null, e.toString(), "There should be no error")
            }
            Y.Assert.areEqual(true,true) ;
        }
    }));



    Y.Test.Runner.add(suite);

}, '0.0.1' ,{requires:['test']});