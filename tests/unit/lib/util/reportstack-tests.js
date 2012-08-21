/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true, nomen:true, node:true continue:true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 * 
 * @author ivan alonso
 */

YUI.add('reportstack-tests', function(Y) {

    var suite = new Y.Test.Suite("Report Stack test suite");
    var path = require('path'),
       arrowRoot = path.join(__dirname, '../../../..'),
       repstack = require(arrowRoot + '/lib/util/reportstack.js');

    var report = new repstack();

    suite.add(new Y.Test.Case({

        "Basic object checks": function(){
            Y.Assert.isNotNull(report, "Confirm the report is not null");
        }
    }));

    //Test startReport, check it can start and it can return a report                     ~
    suite.add(new Y.Test.Case({

        "Test startReport method": function(){
            //Create a new report object
            var rep = new repstack();
            //start a new report
            rep.startReport();

            //confirm the report is empty
            //I expect just an empty report
            var expected = {"results":[]};
            Y.Assert.areEqual(JSON.stringify(expected), JSON.stringify(rep.getReport()), "Make sure the report only has an empty results node");
        }
    }));

    //Test addReport, make sure you can add and get a report back
    suite.add(new Y.Test.Case({

        "Test addReport Method": function(){
            //Create a new report object
            var rep = new repstack();
            //start a new report
            rep.startReport();

            //Add to the report
            var expected =  {"results":[{"passed":2,"failed":0,"total":2,"ignored":0,"duration":28,"type":"report","name":"TabView functional test suite","testCaseyui_3_4_1_3_1337192244962_27":{"passed":2,"failed":0,"total":2,"ignored":0,"duration":26,"type":"testcase","name":"testCaseyui_3_4_1_3_1337192244962_27","test tab structure":{"result":"pass","message":"Test passed","type":"test","name":"test tab structure","duration":2},"test tab selection":{"result":"pass","message":"Test passed","type":"test","name":"test tab selection","duration":15}},"timestamp":"Wed May 16 11:17:25 2012","ua":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:11.0) Gecko/20100101 Firefox/11.0"}]};

            var report = {"passed":2,"failed":0,"total":2,"ignored":0,"duration":28,"type":"report","name":"TabView functional test suite","testCaseyui_3_4_1_3_1337192244962_27":{"passed":2,"failed":0,"total":2,"ignored":0,"duration":26,"type":"testcase","name":"testCaseyui_3_4_1_3_1337192244962_27","test tab structure":{"result":"pass","message":"Test passed","type":"test","name":"test tab structure","duration":2},"test tab selection":{"result":"pass","message":"Test passed","type":"test","name":"test tab selection","duration":15}},"timestamp":"Wed May 16 11:17:25 2012","ua":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:11.0) Gecko/20100101 Firefox/11.0"};

            rep.addReport(report);
            //Confirm they are the same
            Y.Assert.areEqual(JSON.stringify(expected), JSON.stringify(rep.getReport()), "Confirm reports are the same, created vs. received");
        }
    }));

    //Test startReportScenario
    suite.add(new Y.Test.Case({

        "Test startScenarioReport Method": function(){
            //Create a new report object
            var rep = new repstack();
            //start a new report
            rep.startScenarioReport();

            //Add to the report
            var expected =  {"scenario":[{"passed":2,"failed":0,"total":2,"ignored":0,"duration":28,"type":"report","name":"TabView functional test suite","testCaseyui_3_4_1_3_1337192244962_27":{"passed":2,"failed":0,"total":2,"ignored":0,"duration":26,"type":"testcase","name":"testCaseyui_3_4_1_3_1337192244962_27","test tab structure":{"result":"pass","message":"Test passed","type":"test","name":"test tab structure","duration":2},"test tab selection":{"result":"pass","message":"Test passed","type":"test","name":"test tab selection","duration":15}},"timestamp":"Wed May 16 11:17:25 2012","ua":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:11.0) Gecko/20100101 Firefox/11.0"}]};

            var report = {"passed":2,"failed":0,"total":2,"ignored":0,"duration":28,"type":"report","name":"TabView functional test suite","testCaseyui_3_4_1_3_1337192244962_27":{"passed":2,"failed":0,"total":2,"ignored":0,"duration":26,"type":"testcase","name":"testCaseyui_3_4_1_3_1337192244962_27","test tab structure":{"result":"pass","message":"Test passed","type":"test","name":"test tab structure","duration":2},"test tab selection":{"result":"pass","message":"Test passed","type":"test","name":"test tab selection","duration":15}},"timestamp":"Wed May 16 11:17:25 2012","ua":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:11.0) Gecko/20100101 Firefox/11.0"};

            rep.addReport(report);
            //Confirm they are the same
            Y.Assert.areEqual(JSON.stringify(expected), JSON.stringify(rep.getReport()), "Confirm reports are the same, created vs. received");
        }
    }));

    //Test getReport when it's not been started
    suite.add(new Y.Test.Case({

        "Test getReport Method without starting it": function(){
            //Create a new report object
            var rep = new repstack();
            //DO NOT start a new report
            //Confirm report is empty
            var expected = {};
            Y.Assert.areSame(JSON.stringify(expected), JSON.stringify(rep.getReport()), "Confirm reports are the same I created, received");
        }
    }));

    Y.Test.Runner.add(suite);

}, '0.0.1' ,{requires:['test']});