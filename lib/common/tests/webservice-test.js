/*jslint forin:true sub:true undef: true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/*
 * This module is for common test function of webservice controller
 * So that the user can create test only by test descriptor, not need
 * to write test code
 *
 * You can use assertStatusCode to test HTTP response status code as below example;
 * You can assign a json object to assertHeaders to test HTTP response headers;
 * You can assign a JSONPath array to assertPresent to test HTTP response data
 *
 * For more information about JSONPath, please check https://npmjs.org/package/JSONPath
 *
 * Sample test descriptor file
 *
 * [
 *     {
 *         "settings": [ "master" ],
 *         "name": "webservice controller test",
 *         "config": {
 *             "baseUrl": "http://login.yahoo.com"
 *         },
 *         "dataprovider" : {
 * 
 *             "share testParams from webservice controller" : {
 *                 "group" : "func",
 *                 "params" :{
 *                     "scenario": [
 *                         {
 *                             "controller": "webservice-controller",
 *                             "params": {
 *                                 "url": "http://weather.yahooapis.com/forecastrss?p=94089"
 *                             }
 *                         },
 *                         {
 *                             "test": "/path/to/arrow/root//lib/common/tests/webservice-test.js",
 *                             "assertStatusCode": "200",
 *                             "assertHeaders": {
 *                                 "content-type": "text/xml;charset=UTF-8",
 *                                 "server": "YTS/1.20.13"
 *                             },
 *                             "assertPresent": ["$..xmlns:yweather", "$..title"]
 *                         }
 *                     ]
 *                 }
 *             }
 *         }
 *     },
 *     {
 *         "settings": [ "environment:development" ]
 *     }
 * ]
 *
 */

YUI.add("webservice-common-tests", function (Y) {

    var suite = new Y.Test.Suite("Test using webservice commont test function");
    suite.add(new Y.Test.Case({

        "webservice result test": function() {

            // get test params share variable 
            var shared = this.testParams["shared"];
            Y.Assert.isNotNull(shared); 
            
            // check HTTP response status code
            if (this.testParams["assertStatusCode"]) {
                Y.Assert.isNotNull(shared.statusCode); 
                Y.Assert.areEqual(shared.statusCode, this.testParams["assertStatusCode"]); 
            }

            // check HTTP response headers
            if (this.testParams["assertHeaders"]) {
                Y.Assert.isNotNull(shared.headers); 
                //console.dir(shared.headers); 
                var headers = this.testParams["assertHeaders"];
                for (var prop in headers) {
                    Y.Assert.areEqual(shared.headers[prop], headers[prop]);
                }
            }

            // check HTTP response data with JSONPath 
            if (this.testParams["assertPresent"]) {
                Y.Assert.isNotNull(shared.data); 
                //console.log(JSON.stringify(shared.data));
                var jsonpath = require("JSONPath").eval;

                var arr = this.testParams["assertPresent"];
                arr.forEach(function (element) {
                    console.log("Assert present: " + element);
                    var node = jsonpath(shared.data, element);
                    Y.Assert.areNotEqual(node.length, 0); 
                });
            }
        }
    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
}, "0.1", { requires: ["test"]});
