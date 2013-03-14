/*jslint nomen: true */
/*global require: true, console: true, __dirname: true */
/*
 * Copyright (c) 2012 Yahoo! Inc.  All rights reserved.
 */
require('yui').YUI({modules:{
    "oauth-automator":{
        fullpath:__dirname + "/../../../../../../sharelib/lib/server/oauth-automator.js",
        requires:['base', 'io-base']
    }
}}).use('oauth-automator');

YUI.add('oauth-automator-tests', function (Y, NAME) {

    var path = require("path"),
        xml2js = require('xml2js'),
        parser = new xml2js.Parser(),
        config = path.join(__dirname, "../../../data/config.json"),
        config2 = path.join(__dirname, "../../../data/config2.json");

    var testExternalOauthUnit = new Y.Test.Case({
        name:'OAuth Automator Unit Tests',

        "test invaild attr and cb":function () {
            var self = this;
            var oauth;

            try {
                oauth = new Y.Arrow.OAuthAutomator(config);
                Y.Assert.isTrue(true);
            } catch (ex) {
            }

            try {
                oauth = new Y.Arrow.OAuthAutomator({
                    configPath:config + "invalid"
                });
                Y.Assert.isFalse(true);
            } catch (ex) {
                Y.Assert.isTrue(true);
                oauth = new Y.Arrow.OAuthAutomator({
                    configPath:config,
                    oauthType:"external"
                });
            }

            console.log("###########: OAuth Started");

            try {
                oauth.generateOAuth("invaild string", "and a invaild cb");
            } catch (ex) {
                Y.Assert.isTrue(true);
            }

            oauth.set("consumerKey", undefined);
            oauth.set("ConsumerAppId", undefined);
            try {
                oauth.generateOAuth("invaild string", function () {
                });
                Y.Assert.isTrue(false);
            } catch (ex) {
                Y.Assert.isTrue(true);
            }

            oauth.set("externalOAuthScope", true);
            oauth.generateOAuth(function () {
            });

            try {
                oauth.generateOAuth(); //empty
            } catch (ex) {
                Y.Assert.isTrue(true);
            }

            oauth = new Y.Arrow.OAuthAutomator({
                configPath:config,
                oauthType:"not-a-type",
                needUserCred:true
            });

            try {
                oauth.generateOAuth({
                    wsUrl:undefined,
                    wsMethod:"POST",
                    wsQueryParams:{
                    }
                }, function () {
                });
                Y.Assert.isTrue(false);
            } catch (ex) {
                Y.Assert.isTrue(true);
            }

            oauth.set("RequestTokenUrl", undefined);
            try {
                oauth.generateOAuth({
                    wsUrl:"http://gamma.yql.yahooapis.com/v1/yql",
                    wsMethod:"POST"
                }, function () {
                });
            } catch (ex) {
                Y.Assert.isTrue(true);
            }

            oauth.destructor();
        },

        "test external 3 legged oauth":function () {
            var self = this,
                oauth = new Y.Arrow.OAuthAutomator({
                    configPath:config,
                    oauthType:"external",
                    needUserCred:true
                });

            console.log("###########: OAuth Started");
            oauth.generateOAuth({
                    wsUrl:"http://gamma.yql.yahooapis.com/v1/yql",
                    wsMethod:"POST",
                    wsQueryParams:{
                    }
                },
                function (err, headers, token) {
                    self.resume(function () {
                        if (!err) {
                            console.log("###########: OAuth Resumed.");
                            Y.Assert.isTrue(!!token, "Access token should present.");
                            Y.Assert.isTrue(!!token.oauthToken, "No oauthToken property in the token");
                            Y.Assert.isTrue(!!token.oauthTokenSecret, "No oauthTokenSecret property in the token");
                            Y.Assert.isTrue(!!headers.Authorization, "No Authorization header");
                        } else {
                            Y.Assert.fail(err.toString());
                        }
                    });
                });

            console.log("###########: OAuth Waiting Response...");
            this.wait(30000);
        },

        /**
         * this is actually 0-legged oauth according to
         * http://blog.nerdbank.net/2011/06/what-is-2-legged-oauth.html
         */
        "test external 2 legged oauth":function () {
            var self = this,
                oauth = new Y.Arrow.OAuthAutomator({
                    configPath:config,
                    oauthType:"external",
                    needUserCred:false
                });

            console.log("###########: OAuth Started");
            oauth.generateOAuth({
                    wsUrl:"http://gamma.yql.yahooapis.com/v1/yql",
                    wsMethod:"POST",
                    wsQueryParams:{
                    }
                },
                function (err, headers) {
                    self.resume(function () {
                        if (!err) {
                            console.log("###########: OAuth Resumed");
                            Y.Assert.isTrue(!!headers.Authorization, "No Authorization header");
                        } else {
                            Y.Assert.fail(err.toString());
                        }
                    });
                });

            console.log("###########: OAuth Waiting Response...");
            this.wait(30000);
        },

        "test external 2 legged oauth with no-yahoo cert":function () {
            var self = this,
                oauth = new Y.Arrow.OAuthAutomator({
                    configPath:config,
                    oauthType:"external",
                    needUserCred:false
                });
            oauth.set("oauthProvider", "google");

            console.log("###########: OAuth Started");
            try {
                oauth.generateOAuth({
                        wsUrl:"http://gamma.yql.yahooapis.com/v1/yql",
                        wsMethod:"POST",
                        wsQueryParams:{
                        }
                    },
                    function (err, headers) {

                    });
            } catch (ex) {
                Y.Assert.isTrue(true);
            }
            console.log("###########: OAuth Waiting Response...");
        },

        "test external 3 legged oauth with wrong pass":function () {
            var self = this,
                oauth = new Y.Arrow.OAuthAutomator({
                    configPath:config,
                    oauthType:"external",
                    needUserCred:true
                });

            oauth.set("username", "wrongname");
            oauth.set("password", "wrongpassword");
            console.log("###########: OAuth Started");
            try {
                oauth.generateOAuth({
                        wsUrl:"http://gamma.yql.yahooapis.com/v1/yql"
                    },
                    function () {

                    });
            } catch (e) {
            }
        },


        "test configuration read":function () {
            var oauth,
                ne,
                p1,
                p2;

            oauth = new Y.Arrow.OAuthAutomator({configPath:config2});
            Y.Assert.isFalse(oauth.get("needUserCred"));

            // construct with the framework default attribute values.
            oauth = new Y.Arrow.OAuthAutomator();
            Y.Assert.isTrue(oauth.get("needUserCred"));
            oauth.set("needUserCred", false);
            Y.Assert.isFalse(oauth.get("needUserCred"));

            oauth = new Y.Arrow.OAuthAutomator({needUserCred:false});
            Y.Assert.isFalse(oauth.get("needUserCred"));

            ne = oauth.get("NotExistAttr");
            Y.Assert.isTrue(ne === undefined);
            oauth.set("legacy", false);
            Y.Assert.isFalse(oauth.get("legacy"));
            oauth.set("legacy", true);
            Y.Assert.isTrue(oauth.get("legacy"));

            Y.Assert.isTrue(oauth.get("v1RequestTokenUrl").length > 0);
            Y.Assert.isTrue(oauth.get("v2RequestTokenUrl").length > 0);
            Y.Assert.isTrue(oauth.get("v1AccessTokenUrl").length > 0);
            Y.Assert.isTrue(oauth.get("v2AccessTokenUrl").length > 0);
            Y.Assert.isTrue(oauth.get("v1RequestAuthUrl").length > 0);
            Y.Assert.isTrue(oauth.get("v2RequestAuthUrl").length > 0);

        },

        "test errer branch for generate oauth":function () {
            var self = this,
                oauth = new Y.Arrow.OAuthAutomator({
                    configPath:config,
                    oauthType:"external",
                    needUserCred:true
                });

            console.log("###########: OAuth Started");
            try {
                oauth.generateOAuth({
                        wsUrl:undefined,
                        wsMethod:"POST"
                    },
                    function () {
                    });
            } catch (ex) {
                Y.Assert.isTrue(true);
                oauth.set("oauthProvider", "google");
                oauth.set("RequestAuthUrl", undefined);
                try {
                    oauth.generateOAuth();
                } catch (ex) {
                }

            }

            try {
                oauth.generateOAuth({
                    wsUrl:undefined
                });
            } catch (ex) {
            }

            oauth.set("username", undefined);
            oauth.set("RequestAuthUrl", undefined);
            oauth.generateOAuth({
                    wsUrl:"http://gamma.yql.yahooapis.com/v1/yql/not-exist",
                    wsMethod:"POST"
                },
                function () {
                });
        }

    });

    Y.Test.Runner.add(testExternalOauthUnit);

}, '0.0.1', {
    requires:['test', 'io-base', 'oauth-automator']
});