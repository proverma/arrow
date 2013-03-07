/*jslint nomen: true */
/*global require: true, console: true, __dirname: true */
/*
 * Copyright (c) 2012 Yahoo! Inc.  All rights reserved.
 */
require('yui').YUI({modules: {
    "oauth-automator": {
        fullpath: __dirname+"/../../../../../../sharelib/lib/server/oauth-automator.js",
        requires: ['base', 'io-base']
    }
}}).use('oauth-automator');

YUI.add('oauth-automator-functional-tests', function (Y, NAME) {

    var path = require("path"),
        xml2js = require('xml2js'),
        parser = new xml2js.Parser(),
        config = path.join(__dirname, "../../../data/config.json"),
        config2 = path.join(__dirname, "../../../data/config2.json");
    // Use the following line if stl-oauth module is installed which is true
    // for real test project.
    // Y = require("stl-oauth").module();


    var testExternalOauthFunctional = new Y.Test.Case({
        name:'External OAuth functionnal Tests',

        setUp:function () {
            this.oauth = new Y.Arrow.OAuthAutomator({configPath:config});
        },

        "test external 3 legged oauth":function () {
            var self = this,
                url = "http://gamma.yql.yahooapis.com/v1/yql?q=show tables",
                method = "POST", // both POST and GET works.

//            attrs = {
//             oauthType: "external",
//             needUserCred: true,
//             wsUrl: url,
//             wsMethod: method,
//             wsQueryParams: null
//             };
            // OR either one works.
                attrs = {
                    oauthType:"external",
                    needUserCred:true,
                    wsUrl:"http://gamma.yql.yahooapis.com/v1/yql",
                    wsMethod:method,
                    wsQueryParams:{
                        q:"show tables" // don't encode here.
                    }
                };


            console.log("###########: OAuth Started");
            this.oauth.generateOAuth(attrs, function (err, headers) {
                console.log("###########: OAuth Resumed.");
                if (err) {
                    Y.Assert.fail(err.toString());
                }
                self.resume(function () {
                  Y.io(encodeURI(url), {
                        method:method,
                        headers:headers,
                        on:{
                            complete:function (id, response) {
                                self.resume(function () {
                                    parser.parseString(response.responseText, function (err, result) {
                                        if (!err) {
                                            console.log("test 1 result:");
                                            console.log(result);
                                            Y.Assert.isTrue(result.results !== null, "results should be present");
                                        } else {
                                            Y.Assert.fail("invalid response");
                                        }
                                    });
                                });
                            }
                        }
                    });
                    self.wait(30000);
                });
            });

            console.log("###########: OAuth Waiting Response...");
            this.wait(60000); // default wait, 10sec is too short.
        },

        "test external 3 legged oauth2":function () {
            var self = this,
                url = "http://staging.yql.yahooapis.com/v1/yql?debug=true&" +
                    "diagnostics=true&" +
                    "q=select%20%2A%20from%20rss%20where%20url%3D%27http%3A%2F%2Frss.news.yahoo.com%2Frss%2Ftopstories%27%20%7C%20tail%28count%3D2%29",
                attrs = {
                    oauthType:"external",
                    needUserCred:true,
                    wsUrl:url,
                    wsMethod:"GET",
                    wsQueryParams:null
                };

            console.log("###########: OAuth Started");
            this.oauth.generateOAuth(attrs, function (err, headers) {
                console.log("###########: OAuth Resumed.");
                if (err) {
                    Y.Assert.fail(err.toString());
                }

                self.resume(function () {
                    Y.io(url, {
                        method:'GET',
                        headers:headers,
                        on:{
                            complete:function (id, response) {
                                self.resume(function () {
                                    parser.parseString(response.responseText, function (err, result) {
                                        if (!err) {
                                            console.log("test 2 result:");
                                            console.log(result);
                                            Y.Assert.isTrue(result.results !== null, "results should be present");
//                                            Y.Assert.isTrue(result.results , "results should be present");
//                                            Y.Assert.isTrue(result.results.item , "items should be present");

//                                            var items = result.results.item;
//                                            Y.Assert.isTrue(items.length > 0, "no items in the result");
//                                            console.log("1st title: " + items[0].title);
                                        } else {
                                            Y.Assert.fail("invalid response");
                                        }
                                    });
                                });
                            }
                        }
                    });
                    self.wait(30000);
                });
            });
            console.log("###########: OAuth Waiting Response...");
            this.wait(60000); // default wait, 10sec is too short.
        }
    });

    Y.Test.Runner.add(testExternalOauthFunctional);

}, '0.0.1', {
    requires:['test', 'io-base','io-nodejs', 'oauth-automator']
});