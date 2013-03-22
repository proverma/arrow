/*global require: true, YUI: true, __dirname: true, global: true, console: true, messageconfig:true*/

/*
 * Copyright (c) 2012 Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
//YUI_config = {
//    groups:{
//        "sharelib":{
//            modules:{
//                "cookieUtil":{
//                    fullpath:__dirname + "/../../../../../../sharelib/lib/common/cookieUtil.js",
//                    requires:[]
//                }
//            }
//        }
//    }
//}

require('yui').YUI({modules:{
    "cookieUtil":{
        fullpath:__dirname + "/../../../../../../sharelib/lib/common/cookieUtil.js",
        requires:['base']
    }
}}).use('cookieUtil');

YUI.add('cookieUtil-unit-tests', function (Y, NAME) {

    var cookies, cookieUtil = new Y.Arrow.CookieUtil({});
    var testCookie = new Y.Arrow.CookieUtil({urlEncode:true}),
        messageconfig = {
            UNKNOWN_COOKIE_NAME:"unknown cookie name ",
            INVALID_COOKIE_NAME:"invalid cookie name ",
            INVALID_COOKIE_VALUE:"invalid cookie value",

            MISSING_PARAMETER_NAME:"missing parameter: name is expected. ",
            MISSING_PARAMETER_VALUE:"missing parameter: cookie value is expected.",

            UNSUPPORTED_OPTION:"unsupported option is found.",
            INVALID_SUBCOOKIE:"invalid subcookie name or subcookie value.",
            UNEXPECTED_RESPONSE:"unexpected response received. either cookies or location is missing.",
            INVALID_OBJECT:" is expected as an object.",

            WRONG_PARAMETER_COOKIEVALUE:"wrong parameter: cookie value(string) is expected.",
            WRONG_PARAMETER_SUBFIELDS_ARRAY:"wrong parameter: a subFields array expected.",
            WRONG_PARAMETER_SUBFIELDS_OBJECT:"wrong parameter: a subFields object is expected.",
            WRONG_PARAMETER_CALLBACK:"wrong parameter: a callback is expected.",
            INVALID_COOKIEJAR:"cookiejar is undefined or blank, please input a valid value. ",
            UNDEFINED_HEADER:"header is undfined, please input a valid header. ",
            WRONG_PARAMETER_COOKIES_OBJECT:"wrong parameter: a cookies object is expected.",
            ILLEGAL_RESPONSE:"illegal response",
            NO_COOKIE_FROM_SERVER:"no cookies info from server side",
            INVALID_PARAMETER:"wrong parameter: following parameters are expected:",
            EXISTING_COOKIE:"the cookie has existed. name: ",
            NONEXISTING_COOKIE:"the cookie doesn't exist. name: ",
            INVALID_CONFIG:"invalid configuration file type."
        };


    // TEST CASES: cookies in header
    var cookieInHeaderCases = new Y.Test.Case({
        name:"cookie in header test case",
        tearDown:function () {
            console.log('collect code coverage');
        },

        "test getCookiesFromHeader: invalid response":function () {
            //response is null;
            cookieUtil.getCookiesFromHeader(null, function (err, cookies) {
                Y.Assert.areEqual(messageconfig.ILLEGAL_RESPONSE, err.message);
            });
            var response;
            cookieUtil.getCookiesFromHeader(response, function (err, cookies) {
                Y.Assert.areEqual(messageconfig.ILLEGAL_RESPONSE, err.message);
            });
            response = 2;
            cookieUtil.getCookiesFromHeader(response, function (err, cookies) {
                Y.Assert.areEqual(messageconfig.ILLEGAL_RESPONSE, err.message);
            });
        },
        "test getCookiesFromHeader: no cookie in response":function () {
            var self = this;
            var url = "http://www.yahoo.com";
            console.log('send IO request to receive cookie');
            Y.io(url, {
                method:'GET',
                on:{
                    complete:function (id, response) {
                        self.resume(function () {
                            console.log('complete: complete the request, header=' + response.getAllResponseHeaders());
                            cookies = cookieUtil.getCookiesFromHeader(response, function (err, cookies) {
                                Y.Assert.areEqual(messageconfig.NO_COOKIE_FROM_SERVER, err.message);
                            });
                        });
                    }
                }
            });
            this.wait(18000);
        },

        "test SetCookiejarToHeader: cookie is null or blank":function () {

            cookieUtil.setCookiejarToHeader(null, {}, function (err, headers) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIEJAR, err.message);
                console.log("Complete set null to header['Cookie']");
            });
            cookieUtil.setCookiejarToHeader("", {}, function (err, headers) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIEJAR, err.message);
                console.log("Complete set blank to header['Cookie']");
            });
        },

        "test SetCookiejarToHeader: cookie is undefined":function () {
            var name;
            cookieUtil.setCookiejarToHeader(name, {}, function (err, headers) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIEJAR, err.message);
                console.log("Complete set undefined to header['Cookie']");
            });
        },
        "test SetCookiejarToHeader: header is undefined":function () {
            var tmpXcookie = 'X=fo&a=4&d=G', headers;
            cookieUtil.setCookiejarToHeader(tmpXcookie, headers, function (err, headers) {
                Y.Assert.areEqual(messageconfig.UNDEFINED_HEADER, err.message);
                console.log("Complete set undefined to header['Cookie']");
            });
        },

        "test SetCookiejarToHeader: valid cookiejar, headers has no Cookie header.":function () {
            var tmpXcookie = 'X=fo&a=4&d=G';
            cookieUtil.setCookiejarToHeader(tmpXcookie, {}, function (err, headers) {
                Y.Assert.areEqual(null, err);
                Y.Assert.areEqual(tmpXcookie, headers.Cookie);
                console.log("Complete set valid cookiejar to header['Cookie']=" + headers.Cookie);
            });
        },

        "test SetCookiejarToHeader using in nodejs side: headers has Cookie header, replace with valid cookiejar.":function () {
            var tmpXcookie = 'X=fo&a=4&d=G';
            cookieUtil.setCookiejarToHeader(tmpXcookie, {
                Cookie:'M=TESTCOOKIE'
            }, function (err, headers) {
                Y.Assert.areEqual(tmpXcookie, headers.Cookie);
                Y.Assert.isTrue(err === null, "error is not null");
                console.log("Complete set valid cookiejar to header['Cookie']=" + headers.Cookie);
            });
        },
        /** reserved when using cookieUtil from browser side test
         "test SetCookiejarToHeader using in browser side: .": function (){

         },**/

        "test parse cookies to cookiejar: normal flow":function () {
            var cookies = {};
            cookies.X = 'X=fo&a=4&d=G';
            cookies.K = "n=6jms8d55&p=m1n2";
            cookieUtil.parseCookiesObjToCookiejar(cookies, function (error, cookiejar) {
                var xi = cookiejar.indexOf("X=" + cookies.X);
                var ki = cookiejar.indexOf("K=" + cookies.K);
                Y.Assert.isTrue(xi !== -1, "there is no X cookie in cookiejar");
                Y.Assert.isTrue(ki !== -1, "there is no K cookie in cookiejar");
            });
        },

        "test parse cookies to cookiejar: cookie object is undfined":function () {
            var cookies;
            cookieUtil.parseCookiesObjToCookiejar(cookies, function (error, cookiejar) {
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_COOKIES_OBJECT, error.message);
            });
        },
        "test parse cookies to cookiejar: cookie object is not object":function () {
            var cookies = 3;
            cookieUtil.parseCookiesObjToCookiejar(cookies, function (error, cookiejar) {
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_COOKIES_OBJECT, error.message);
            });
        },

        "test parse cookies to cookiejar: cookie object is blank":function () {
            var cookies = {};
            cookieUtil.parseCookiesObjToCookiejar(cookies, function (error, cookiejar) {
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_COOKIES_OBJECT, error.message);
            });
        },
        "test parse cookies to cookiejar: invalid cookie name in cookieObject":function () {
            var cookies = {};
            cookies['X,'] = "dihc9&b=4";
            cookies.K = "n=6jms8d5&l=oei&np=1";
            cookieUtil.parseCookiesObjToCookiejar(cookies, function (error, cookiejar) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_VALUE, error.message);
            });
        },
        "test parse cookies to cookiejar: invalid cookie value in cookieObject":function () {
            var cookies = {};
            cookies['X,'] = "dihc9&b=4";
            cookies.K = "n=6jms8d5&l=oei&np=1";
            cookieUtil.parseCookiesObjToCookiejar(cookies, function (error, cookiejar) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_VALUE, error.message);
            });
        }
    });

    // TEST CASES: create cookie
    var createCookeTestCases = new Y.Test.Case({
        name:"create cookie test cases",

        'setUp':function () {
            this.value = {
                "name1":"Jim",
                "name2":"Tom"
            };
            var date = new Date();
            this.date = date;
            this.options = {
                "domain":"xx.com",
                "path":"/dir1/",
                "expires":date,
                "secure":true
            };
        },
        'create Customized cookie: ':function () {

            var date = this.date;
            cookieUtil.createCustCookie("stl", this.value, this.options, function (err, cookieString) {
                Y.Assert.areEqual(null, err);
                console.log("the customized cookie is " + cookieString);
                var expected = 'stl=name1=Jim&name2=Tom; expires=' + date.toUTCString() + "; path=/dir1/; domain=xx.com; secure";
                Y.Assert.areEqual(expected, cookieString);
            });
        },
        'create Customized cookie: option is not object ':function () {
            cookieUtil.createCustCookie("stl", this.value, 2, function (err, cookieString) {
                Y.Assert.areEqual("option" + messageconfig.INVALID_OBJECT, err.message);
            });
        },
        'create Customized cookie: unsupported option ':function () {

            var tmpoptions = {
                "domain":"xx.com",
                "xxpath":"/dir1/"
            };

            cookieUtil.createCustCookie("stl", this.value, tmpoptions, function (err, cookieString) {
                console.log("cookieString =" + cookieString);
                Y.Assert.areEqual(messageconfig.UNSUPPORTED_OPTION, err.message);
            });

            tmpoptions = {
                "domainn":"xx.com",
                "path":"/dir1/"
            };
            cookieUtil.createCustCookie("stl", this.value, tmpoptions, function (err, cookieString) {
                console.log("cookieString =" + cookieString);
                Y.Assert.areEqual(messageconfig.UNSUPPORTED_OPTION, err.message);
            });

        },
        'create Customized cookie: value is not object ':function () {

            cookieUtil.createCustCookie("stl", 4, this.options, function (err, cookieString) {
                Y.Assert.areEqual("4" + messageconfig.INVALID_OBJECT, err.message);
            });
        },
        'create Customized cookie: name is undefined ':function () {
            var name;
            cookieUtil.createCustCookie(name, this.value, this.options, function (err, cookieString) {

                Y.Assert.areEqual(messageconfig.MISSING_PARAMETER_NAME, err.message);
            });
        },
        'create Customized cookie: cookie value is undefined ':function () {
            var value;
            cookieUtil.createCustCookie("stl", value, this.options, function (err, cookieString) {
                Y.Assert.areEqual(messageconfig.MISSING_PARAMETER_VALUE, err.message);
            });
        },
        'create Customized cookie: expire is not date ':function () {

            var tmpoptions = {
                "domain":"xx.com",
                "expires":"2012/10/31"
            };

            cookieUtil.createCustCookie("stl", this.value, tmpoptions, function (err, cookieString) {
                console.log("[expire is not date] cookieString =" + cookieString);
                var i = cookieString.indexOf("; expires");
                Y.Assert.isTrue(i === -1, "expires is not Date but it is in new cookie");
            });
        },

        'create Customized cookie: expires is Date ':function () {

            var tmpoptions = {
                "domain":"xx.com",
                "expires":new Date()
            };

            cookieUtil.createCustCookie("stl", this.value, tmpoptions, function (err, cookieString) {
                console.log("[expires is Date] cookieString =" + cookieString);
                var i = cookieString.indexOf("; expires");
                Y.Assert.isTrue(i !== -1, "expires is  Date but it is not in new cookie");
            });

        },
        'create Customized cookie: path is null ':function () {

            var tmpoptions = {
                "domain":"xx.com",
                "expires":new Date(),
                "path":""
            };

            cookieUtil.createCustCookie("stl", this.value, tmpoptions, function (err, cookieString) {
                console.log("[path is null ] cookieString =" + cookieString);
                var i = cookieString.indexOf("; path");
                Y.Assert.isTrue(i === -1, "path is null but it is in new cookie");
            });

        },

        'create Customized cookie: path is not String ':function () {

            var tmpoptions = {
                "domain":"xx.com",
                "expires":new Date(),
                "path":1
            };

            cookieUtil.createCustCookie("stl", this.value, tmpoptions, function (err, cookieString) {
                console.log("[path is not String] cookieString =" + cookieString);
                var i = cookieString.indexOf("; path");
                Y.Assert.isTrue(i === -1, "path is number but it is in new cookie");
            });

        },

        'create Customized cookie: path is String ':function () {
            var tmpoptions = {
                "domain":"xx.com",
                "expires":new Date(),
                "path":"/dir1/"
            };
            cookieUtil.createCustCookie("stl", this.value, tmpoptions, function (err, cookieString) {
                console.log("[path is String] cookieString =" + cookieString);
                var i = cookieString.indexOf("; path");
                Y.Assert.isTrue(i !== -1, "path is String but it is not in new cookie");
            });
        },
        'create Customized cookie: domain is null ':function () {
            var tmpoptions = {
                "domain":"",
                "expires":new Date()
            };

            cookieUtil.createCustCookie("stl", this.value, tmpoptions, function (err, cookieString) {
                console.log("[domain is null] cookieString =" + cookieString);
                var i = cookieString.indexOf("; domain");
                Y.Assert.isTrue(i === -1, "domain is null but it is in new cookie");
            });
        },
        'create Customized cookie: domain is number ':function () {
            var tmpoptions = {
                "domain":23,
                "expires":new Date()
            };

            cookieUtil.createCustCookie("stl", this.value, tmpoptions, function (err, cookieString) {
                console.log("[domain is number] cookieString =" + cookieString);
                var i = cookieString.indexOf("; domain");
                Y.Assert.isTrue(i === -1, "domain is number but it is in new cookie");
            });
        },
        'create Customized cookie: domain is String ':function () {
            var tmpoptions = {
                "domain":"xx.com",
                "expires":new Date()
            };

            cookieUtil.createCustCookie("stl", this.value, tmpoptions, function (err, cookieString) {
                console.log("[domain is String ] cookieString =" + cookieString);
                var i = cookieString.indexOf("; domain");
                Y.Assert.isTrue(i !== -1, "domain is string but it is not in new cookie");
            });
        },

        'create Customized cookie: secure is true ':function () {
            var tmpoptions = {
                "domain":"xx.com",
                "expires":new Date(),
                "secure":true
            };

            cookieUtil.createCustCookie("stl", this.value, tmpoptions, function (err, cookieString) {
                console.log("[secure is true] cookieString =" + cookieString);
                var i = cookieString.indexOf("; secure");
                Y.Assert.isTrue(i !== -1, "secure is true but it is not in new cookie");
            });

        },
        'create Customized cookie: secure is false ':function () {
            var tmpoptions = {
                "domain":23,
                "expires":new Date(),
                "secure":false
            };

            var cookieString = cookieUtil.createCustCookie("stl", this.value, tmpoptions, function (err, cookieString) {
                console.log("[secure is false] cookieString =" + cookieString);
                var i = cookieString.indexOf("; secure");
                Y.Assert.isTrue(i === -1, "secure is false but it is in new cookie");
            });
            tmpoptions = {
                "domain":23,
                "expires":new Date()
            };
            cookieUtil.createCustCookie("stl", this.value, tmpoptions, function (err, cookieString) {
                console.log("[secure is not set] cookieString =" + cookieString);
                var i = cookieString.indexOf("; secure");
                Y.Assert.isTrue(i === -1, "there is no secure but it is in new cookie");
            });
        },

        'create Customized cookie:: field name is invalid':function () {
            var tmpvalue = {
                "name1;":"Jim",
                "name2":"Tom"
            };

            cookieUtil.createCustCookie("stl", tmpvalue, this.options, function (err, cookieString) {
                console.log("[name is invalid with ;] cookieString =" + cookieString);
                Y.Assert.areEqual(messageconfig.INVALID_SUBCOOKIE, err.message);
            });
            tmpvalue = {
                "name1 ":"Jim",
                "name2":"user_**&"
            };
            cookieUtil.createCustCookie("stl", tmpvalue, this.options, function (err, cookieString) {
                console.log("[name is invalid with space] cookieString =" + cookieString);
                Y.Assert.areEqual(messageconfig.INVALID_SUBCOOKIE, err.message);
            });
            tmpvalue = {
                "name1,":"Jim",
                "name2":"user_**&"
            };
            cookieUtil.createCustCookie("stl", tmpvalue, this.options, function (err, cookieString) {
                console.log("[name is invalid with ,] cookieString =" + cookieString);
                Y.Assert.areEqual(messageconfig.INVALID_SUBCOOKIE, err.message);
            });
        },
        'create Customized cookie:: name is blank':function () {
            var tmpvalue = {
                "name1":"Jim",
                "name2":"user_**&"
            };
            cookieUtil.createCustCookie("", this.value, this.options, function (err, cookieString) {
                console.log("[name is blank] cookieString ");
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_NAME, err.message);
            });
        },
        'create Customized cookie:: value is blank':function () {
            var tmpvalue = {
                "name1":"",
                "name2":"user_**&"
            };

            var date = this.date;
            cookieUtil.createCustCookie("stl", tmpvalue, this.options, function (err, cookieString) {
                console.log("[value is blank] cookieString =" + cookieString);
                Y.Assert.areEqual("stl=name1=&name2=user_**&; expires=" + date.toUTCString() + "; path=/dir1/; domain=xx.com; secure", cookieString);
            });
        },
        'create Customized cookie:: value is invalid':function () {
            var tmpvalue = {
                "name1":"Jim",
                "name2":"user_**& "
            };
            cookieUtil.createCustCookie("stl", tmpvalue, this.options, function (err, cookieString) {
                console.log("[value is invalid with space] cookieString =" + cookieString);
                Y.Assert.areEqual(messageconfig.INVALID_SUBCOOKIE, err.message);
            });
            tmpvalue = {
                "name1":"Jim",
                "name2":"user_**&,"
            };
            cookieUtil.createCustCookie("stl", tmpvalue, this.options, function (err, cookieString) {
                console.log("[value is invalid with ,] cookieString =" + cookieString);
                Y.Assert.areEqual(messageconfig.INVALID_SUBCOOKIE, err.message);
            });
            tmpvalue = {
                "name1":"Jim",
                "name2":"user_**&;"
            };
            cookieUtil.createCustCookie("stl", tmpvalue, this.options, function (err, cookieString) {
                console.log("[value is invalid with ;] cookieString =" + cookieString);
                Y.Assert.areEqual(messageconfig.INVALID_SUBCOOKIE, err.message);
            });
        },
        'create Customized cookie:: cb is not function':function () {
            var tmpvalue = {
                "name1":"",
                "name2":"user_**&"
            };
            try {
                cookieUtil.createCustCookie("", this.value, this.options, "test");
            } catch (thrown) {
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_CALLBACK, thrown.message);
            }

        }
    });
    // TEST CASES: validate cookie
    var validatecookiecase = new Y.Test.Case({
        name:"validate cookie test case",

        " validate cookie: name is blank":function () {
            Y.Assert.areEqual(cookieUtil._validateCookieName(""), false);
        },
        "validate cookie: name is null":function () {
            Y.Assert.areEqual(cookieUtil._validateCookieName(null), false);
        },
        "validate cookie: name includes ;,and space":function () {
            var name = "x,y";
            Y.Assert.areEqual(cookieUtil._validateCookieName(name), false);
            name = "xy;";
            Y.Assert.areEqual(cookieUtil._validateCookieName(name), false);
            name = "xy ";
            Y.Assert.areEqual(cookieUtil._validateCookieName(name), false);
        },
        "validate cookie: name does not include ;, and space":function () {
            var name = "xy&";
            Y.Assert.areEqual(cookieUtil._validateCookieName(name), true);
            name = "x=y";
            Y.Assert.areEqual(cookieUtil._validateCookieName(name), true);
        },
        "validate cookie url encoded: value includes ;,and space ":function () {
            var value = "x%2Cy";
            Y.Assert.areEqual(testCookie._validateCookieSpec(value), false);
            value = "xy%3B";
            Y.Assert.areEqual(testCookie._validateCookieSpec(value), false);
            value = "xy%20";
            Y.Assert.areEqual(testCookie._validateCookieSpec(value), false);
        },
        "validate cookie url encoded: value does not include ;, and space":function () {
            var name = "xy%26";
            Y.Assert.areEqual(testCookie._validateCookieSpec(name), true);
            name = "x%3Dy";
            Y.Assert.areEqual(testCookie._validateCookieSpec(name), true);
        },
        "validate cookie: cookie name is not string":function () {
            Y.Assert.areEqual(cookieUtil._validateCookieName(1), false);
        }
    });

    // TEST CASES: modify cookie
    var modifycookiecase = new Y.Test.Case({
        name:"modify cookie test case",

        'delete sub cookie: browser id':function () {
            cookieUtil.deleteSubCookie("27&b=3&s=8q", ["_f1"], function (err, cookieString) {
                console.log("the cookie string is " + cookieString);
                Y.Assert.areEqual("b=3&s=8q", cookieString);
            });
        },

        'add a sub cookie: e':function () {
            cookieUtil.addSubCookie("f=27&b=3&s=8q", {
                e:'edata'
            }, function (err, cookieString) {
                console.log("the cookie string is " + cookieString);
                Y.Assert.areEqual("f=27&b=3&s=8q&e=edata", cookieString);
            });
        },

        "delete sub cookie: delete one/  multiple fields":function () {
            var cookie = "cn&b=4&d=GX&s=kdo";
            cookieUtil.deleteSubCookie(cookie, ["b"], function (err, updatecookie) {
                Y.Assert.areEqual("cn&d=GX&s=kdo", updatecookie);
            });

            cookieUtil.deleteSubCookie(cookie, ["b", "s"], function (err, updatecookie) {
                Y.Assert.areEqual("cn&d=GX", updatecookie);
            });
        },
        "delete sub cookie: callback is not function":function () {
            try {
                cookieUtil.deleteSubCookie("27&b=3&s=8q", ["b"], "test");
            } catch (thrown) {
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_CALLBACK, thrown.message);
            }
        },
        "delete sub cookie: cookie value is blank":function () {

            cookieUtil.deleteSubCookie("", ["b"], function (err) {
                console.log("delete a field from blank cookie");
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_COOKIEVALUE, err.message);
            });
        },
        "delete sub cookie: cookie value is undefined":function () {
            var tmp;
            cookieUtil.deleteSubCookie(tmp, ["b"], function (err) {
                console.log("delete a field from undefined cookie");
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_COOKIEVALUE, err.message);
            });
        },
        "delete sub cookie: subfields parameter is not array":function () {
            var tmp;
            cookieUtil.deleteSubCookie("27&b=3&s=8q", "b", function (err) {
                console.log("delete a non-array field from cookie");
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_SUBFIELDS_ARRAY, err.message);
            });

            cookieUtil.deleteSubCookie("27&b=3&s=8q", null, function (err) {
                console.log("delete a non-array field from cookie");
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_SUBFIELDS_ARRAY, err.message);
            });
        },
        "delete sub cookie: subfields is blank":function () {
            cookieUtil.deleteSubCookie("1hs269982e27&b=3&s=8q", [], function (err, text) {
                Y.Assert.areEqual("1hs269982e27&b=3&s=8q", text);
                Y.Assert.areEqual(null, err);
            });
        },
        "delete sub cookie: subfiled to be deleted does not exist in cookie value":function () {
            cookieUtil.deleteSubCookie("27&b=3&s=8q", ["a"], function (err, text) {
                Y.Assert.areEqual("27&b=3&s=8q", text);
                Y.Assert.areEqual(null, err);
            });
        },
        "delete sub cookie: invalid subfield like t=":function () {
            cookieUtil.deleteSubCookie("27&b=3&s=8q", ["t="], function (err, text) {
                Y.Assert.areEqual("27&b=3&s=8q", text);
                Y.Assert.areEqual(null, err);
            });
        },
        "add sub cookie: add  one sub field ":function () {
            var subcookie = {
                s:"xxxde3*&"
            };
            cookieUtil.addSubCookie("27&b=3", subcookie, function (err, cookieValue) {
                Y.Assert.areEqual("27&b=3&s=xxxde3*&", cookieValue);
            });
        },
        "add sub cookie: add  blank subcookieobject ":function () {
            var subcookie = {};
            cookieUtil.addSubCookie("e27&b=3", subcookie, function (err, cookieValue) {
                Y.Assert.areEqual("e27&b=3", cookieValue);
            });
        },
        "add sub cookie: add  multi sub fields":function () {
            var subcookie = {
                s:"xxxde3*&",
                p:"9fe30sk"
            };
            cookieUtil.addSubCookie("e27&b=3", subcookie, function (err, cookieValue) {
                Y.Assert.areEqual("e27&b=3&s=xxxde3*&&p=9fe30sk", cookieValue);
            });
        },
        "add sub cookie: add multi sub fields with invalid format":function () {
            var subcookie = {
                s:";xxxde3*&",
                p:"9fe30sk"
            };
            cookieUtil.addSubCookie("e27&b=3", subcookie, function (err, cookieValue) {
                console.log("add subfiled with invalid format, error message =" + err.message);
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_VALUE, err.message);
            });

            subcookie = {
                "s,":"xxxde3*&",
                p:"9fe30sk"
            };
            cookieUtil.addSubCookie("e27&b=3", subcookie, function (err, cookieValue) {
                console.log("add subfiled with invalid format, error message =" + err.message);
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_VALUE, err.message);
            });
            subcookie = {
                "s ":"xxxde3*&",
                p:"9fe30sk"
            };
            cookieUtil.addSubCookie("e27&b=3", subcookie, function (err, cookieValue) {
                console.log("add subfiled with invalid format, error message =" + err.message);
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_VALUE, err.message);
            });
        },
        "add sub cookie: add existing sub field":function () {
            var subcookie = {
                s:"xxxde3*",
                p:"9fe30sk"
            };
            cookieUtil.addSubCookie("e27&b=3&s=xoooo3*", subcookie, function (err, cookieValue) {
                Y.Assert.areEqual("e27&b=3&s=xxxde3*&p=9fe30sk", cookieValue);
            });
        },
        "add sub cookie: callback is not function":function () {
            var subcookie = {
                s:"xxxde3*",
                p:"9fe30sk"
            };
            try {
                cookieUtil.addSubCookie("e27&b=3&s=xoooo3*", subcookie, 2);
            } catch (thrown) {
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_CALLBACK, thrown.message);
            }
        },
        "add sub cookie: cookie value is blank":function () {
            var subcookie = {
                s:"xxxde3*",
                p:"9fe30sk"
            };
            cookieUtil.addSubCookie("", subcookie, function (err) {
                console.log("add a field to a blank cookie");
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_COOKIEVALUE, err.message);
            });
        },
        "add sub cookie: cookie value is undefined":function () {
            var subcookie = {
                s:"xxxde3*",
                p:"9fe30sk"

            };
            var tmp;
            cookieUtil.addSubCookie(tmp, subcookie, function (err) {
                console.log("add a field to a undefined cookie");
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_COOKIEVALUE, err.message);
            });

        },

        "add sub cookie: subfields parameter is not object":function () {

            cookieUtil.addSubCookie("e27&b=3&s=8q", "b", function (err) {
                console.log("add a non-object fields parameters to cookie");
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_SUBFIELDS_OBJECT, err.message);
            });

            cookieUtil.addSubCookie("e27&b=3&s=8q", null, function (err) {
                console.log("add a non-object field from cookie");
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_SUBFIELDS_OBJECT, err.message);
            });
        },
        "modify sub cookie: callback is not function":function () {
            try {
                cookieUtil.modifyCookie("e27&b=3&s=8q", {
                    b:"6"
                }, 23);
            } catch (thrown) {
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_CALLBACK, thrown.message);
            }
        },

        "modify sub cookie: cookie value is undefined or blank":function () {
            var name;

            cookieUtil.modifyCookie(name, {
                b:"6"
            }, function (err) {
                console.log("modify a undefined cookie value");
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_COOKIEVALUE, err.message);
            });

            cookieUtil.modifyCookie("", {
                b:"6"
            }, function (err) {
                console.log("modify a blank cookie value");
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_COOKIEVALUE, err.message);
            });

        },

        "modify sub cookie: cookie value invalid":function () {
            var cookievalue = "e27&b=3=0&s=8q";
            cookieUtil.modifyCookie(cookievalue, {
                b:"6"
            }, function (err, cookieValue) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_VALUE + "[" + cookievalue + "]", err.message);
            });
        },
        "modify sub cookie: subfields parameter is not a object":function () {

            cookieUtil.modifyCookie("e27&b=3&s=8q", "b", function (err) {
                console.log("modify a cookie value with invalid subfield parameter");
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_SUBFIELDS_OBJECT, err.message);
            });
            cookieUtil.modifyCookie("e27&b=3&s=8q", 8, function (err) {
                console.log("modify a cookie value with invalid subfield parameter");
                Y.Assert.areEqual(messageconfig.WRONG_PARAMETER_SUBFIELDS_OBJECT, err.message);
            });
        },
        "modify sub cookie: sub filed does not exist":function () {
            cookieUtil.modifyCookie("27&b=3&s=8q", {
                n:"6"
            }, function (err, cookieValue) {
                Y.Assert.areEqual("27&b=3&s=8q", cookieValue);
                //should no change.
            });
        },
        "modify sub cookie: modify one field":function () {
            cookieUtil.modifyCookie("e27&b=3&s=8q", {
                b:"6"
            }, function (err, cookieValue) {
                Y.Assert.areEqual("e27&b=6&s=8q", cookieValue);
            });
        },
        "modify sub cookie: modify multi field":function () {
            cookieUtil.modifyCookie("e27&b=3&s=8q", {
                b:"6",
                s:"9u"
            }, function (err, cookieValue) {
                Y.Assert.areEqual("e27&b=6&s=9u", cookieValue);
            });
        },
        "modify sub cookie: modify one field with invalid value":function () {
            cookieUtil.modifyCookie("e27&b=3&s=8q", {
                b:"6,",
                s:"9u"
            }, function (err, cookieValue) {
                Y.Assert.areEqual(messageconfig.INVALID_SUBCOOKIE, err.message);
                // need confim
            });
        },
        "modify sub cookie: modify a cookie with one field only":function () {
            cookieUtil.modifyCookie("e27", {
                _f1:"testingtesting"
            }, function (err, cookieValue) {
                Y.Assert.areEqual("testingtesting", cookieValue);
                //need confim
            });
        }
    });

    var parsecookiecase = new Y.Test.Case({
        name:"parse cookie case",
        'parse valid cookie value without url encode':function () {
            //begin without sub cookie key,
            var cookievalue = "bgs7e&b=4&d=GX&s=gk";
            cookieUtil._parseCookieString(cookievalue, function (err, cookieObj) {
                Y.Assert.areEqual("bgs7e", cookieObj._f1);
                Y.Assert.areEqual(4, cookieObj.b);
                Y.Assert.areEqual("GX", cookieObj.d);
                Y.Assert.areEqual("gk", cookieObj.s);
            });
            //begin with a subcookie key
            cookievalue = "m=bgs7e&b=4&d=GX&s=gk";
            cookieUtil._parseCookieString(cookievalue, function (err, cookieObj) {
                Y.Assert.areEqual("bgs7e", cookieObj.m);
                Y.Assert.areEqual(4, cookieObj.b);
                Y.Assert.areEqual("GX", cookieObj.d);
                Y.Assert.areEqual("gk", cookieObj.s);
            });
        },
        'parse valid cookie value with url encode':function () {
            // begin with subcookie key,
            var cookievalue = "sign%3Dywsw%26time%3D1351478056%26expires%3D600%26ip%3D10.10.10.10%26roles%3D%7C1.IEywsw";
            testCookie._parseCookieString(cookievalue, function (err, cookieObj) {
                Y.Assert.areEqual("ywsw", cookieObj.sign);
                Y.Assert.areEqual("1351478056", cookieObj.time);
                Y.Assert.areEqual("10.10.10.10", cookieObj.ip);
                Y.Assert.areEqual("%7C1.IEywsw", cookieObj.roles);
            });

            //begin without a key
            cookievalue = "bgs7e%26b%3D4%26d%3DGX%26s%3Dgk%26i%3DiihVCD7C3NAAoCes41gt";
            testCookie._parseCookieString(cookievalue, function (err, cookieObj) {
                Y.Assert.areEqual("bgs7e", cookieObj._f1);
                Y.Assert.areEqual(4, cookieObj.b);
                Y.Assert.areEqual("GX", cookieObj.d);
                Y.Assert.areEqual("gk", cookieObj.s);
                Y.Assert.areEqual("iihVCD7C3NAAoCes41gt", cookieObj.i);
            });
        },

        'parse invalid cookie value format === without url encode':function () {
            var cookievalue = "bgs7e&b====4&d=GX&s=gk&i=iihVCD7C3NAAoCes41gt";
            cookieUtil._parseCookieString(cookievalue, function (err, cookieObj) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_VALUE + "[" + cookievalue + "]", err.message);
            });

        },
        'parse invalid cookie value format without url encode':function () {

            var cookievalue = "bgs7e&b=4&&&&d=GX&s=gk&i=iihVCD7C3NAAoCes41gt";
            cookieUtil._parseCookieString(cookievalue, function (err, cookieObj) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_VALUE, err.message);
            });
            //need confim

        },
        'parse invalid cookie value format with url encode':function () {
            var cookievalue = "m%3D164959%26x%3D%3D%3D%3D%3D%3Dxxxx";
            testCookie._parseCookieString(cookievalue, function (err, cookieObj) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_VALUE + "[" + cookievalue + "]", err.message);
            });

            cookievalue = "id%3D1ssef%26%26%26%26m%3Dyui";
            testCookie._parseCookieString(cookievalue, function (err, cookieObj) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_VALUE, err.message);
            });
            //need confirm
        },
        // 'parse blank cookie value': function (){
        // }, // value is check null and blank in add/delete/modify method
        'parse cookie value with invalid sub cookie':function () {
            var cookievalue = "id,=jieiaifjeisie232&username=test";
            cookieUtil._parseCookieString(cookievalue, function (err, cookieObj) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_VALUE, err.message);
            });
            cookievalue = "id=jieiaifjeisie232&username=,test";
            cookieUtil._parseCookieString(cookievalue, function (err, cookieObj) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_VALUE, err.message);
            });
        }, /* begin test _parseCookieObjToString*/
        'parse valid cookieobj to cookie value without url encode':function () {
            //cookie value fields have sequence?
            var cookieobj = {}, cookievalue;
            cookieobj.id = "jieiaifjeisie232";
            cookieobj.username = "test";
            cookieUtil._parseCookieObjToString(cookieobj, function (err, cookievalue) {
                Y.Assert.areEqual("id=jieiaifjeisie232&username=test", cookievalue);
            });

            cookieobj._f1 = "beggggg";
            cookieUtil._parseCookieObjToString(cookieobj, function (err, cookievalue) {
                Y.Assert.areEqual("beggggg&id=jieiaifjeisie232&username=test", cookievalue);
            });

        },
        'parse valid cookieobj to cookie value with url encode':function () {
            //cookie value fields have sequence?
            var cookieobj = {}, cookievalue;
            cookieobj.id = "jieiaifjeisie232";
            cookieobj.username = "test";

            testCookie._parseCookieObjToString(cookieobj, function (err, cookievalue) {
                Y.Assert.areEqual("id%3Djieiaifjeisie232%26username%3Dtest", cookievalue);
            });

            cookieobj._f1 = "beggggg";
            testCookie._parseCookieObjToString(cookieobj, function (err, cookievalue) {
                Y.Assert.areEqual("beggggg%26id%3Djieiaifjeisie232%26username%3Dtest", cookievalue);
            });
        },
        'parse invalid cookieobj to cookie value':function () {
            var cookieobj = {}, cookievalue;
            cookieobj.id = "jie;iaifjeisie232";
            cookieobj.username = "test";
            cookieUtil._parseCookieObjToString(cookieobj, function (err, cookievalue) {
                Y.Assert.areEqual("id=jie;iaifjeisie232&username=test", cookievalue);
            });

        }
    });

    //TEST CASES: generate invalid cookie
    var invalidCookieCase = new Y.Test.Case({
        name:"test invalid cookie",
        "test generateInvalidFormatCookie: normal flow":function () {
            var cookiejar = "X=a=1&n=6jms8d; PH=l=en-US&i=us;";
            cookieUtil.generateInvalidFormatCookie(cookiejar, function (error, invalidCookiejar) {
                Y.Assert.areEqual(";X=a=1&n=6jms8d; PH=l=en-US&i=us;, ", invalidCookiejar);
            });
        },
        "test generateInvalidFormatCookie: undefined cookiejar":function () {
            var cookiejar;
            cookieUtil.generateInvalidFormatCookie(cookiejar, function (error, invalidCookiejar) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIEJAR, error.message);
            });
            cookieUtil.generateInvalidFormatCookie(1, function (error, invalidCookiejar) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIEJAR, error.message);
            });
        },
        "test CookieUtil: invalid config: config is blank":function () {
            var cookieUtilSample = new Y.Arrow.CookieUtil({}), error;
            cookieUtilSample = new Y.Arrow.CookieUtil({});
            try {
                cookieUtilSample = new Y.Arrow.CookieUtil();
            } catch (thrown) {
                error = thrown.message;
            }
            Y.Assert.areEqual(messageconfig.INVALID_CONFIG, error);
        },
        "test CookieUtil: invalid config: config is not object":function () {
            var error, cookieUtilSample;
            try {
                cookieUtilSample = new Y.Arrow.CookieUtil("name");
            } catch (thrown) {
                error = thrown.message;
                Y.Assert.isTrue(true);
            }
            try {
                cookieUtilSample = new Y.Arrow.CookieUtil(5);
            } catch (thrown1) {
                error = thrown1.message;
                Y.Assert.isTrue(true);
            }
        },
        "test CookieUtil: invalid config: config is undefined":function () {
            var tmpconfig, error, cookieUtilSample;
            try {
                cookieUtilSample = new Y.Arrow.CookieUtil(tmpconfig);
            } catch (thrown) {
                error = thrown.message;
            }
            Y.Assert.areEqual(messageconfig.INVALID_CONFIG, error);
        }
    });

    var cookiejarcase = new Y.Test.Case({
        name:'cookiejar test cases',

        //getCookieInCookiejar(cookiejar, name, cb)
        'getCookieInCookiejar: invalid parameters':function () {
            var validCookiejar = "H=k%3D1622%26userid%3Dxxx";
            try {
                cookieUtil.getCookieInCookiejar({}, "H", function (err, cookieArray) {
                });
            } catch (thrown) {
                console.log("verify when cookiejar is not a string, the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, cb {Function}", thrown.message);
            }

            try {
                cookieUtil.getCookieInCookiejar(validCookiejar, NaN, function (err, cookieArray) {
                });
            } catch (error) {
                console.log("verify when cookie name is not a string , the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, cb {Function}", error.message);
            }

            try {
                cookieUtil.getCookieInCookiejar(validCookiejar, "H", "should be callback");
            } catch (thrown1) {
                console.log("verify when cb is not a function, the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, cb {Function}", thrown1.message);
            }
        },

        'getCookieInCookiejar: cookie name is not in the cookie jar':function () {
            cookieUtil.getCookieInCookiejar("cookieA=valueA;cookieB=valueB", "C", function (err, cookieArray) {
                Y.Assert.areEqual(messageconfig.NONEXISTING_COOKIE + "C", err.message);
            });
        },

        'getCookieInCookiejar: cookie name is in the cookie jar':function () {
            cookieUtil.getCookieInCookiejar("cookieA=valueA", "cookieA", function (err, cookieArray) {
                Y.Assert.areEqual("cookieA=valueA", cookieArray[0]);
            });
        },

        'getCookieInCookiejar: cookie name is appeared more than once in the cookie jar':function () {
            cookieUtil.getCookieInCookiejar("cookieA=valueA1; cookieB=valueB; cookieA=valueA2", "cookieA", function (err, cookieArray) {
                Y.Assert.areEqual("cookieA=valueA1", cookieArray[0]);
                Y.Assert.areEqual("cookieA=valueA2", cookieArray[1]);
            });
        },

        //deleteCookieInCookiejar(cookiejar, name, cb)
        'deleteCookieInCookiejar: invalid parameters':function () {
            var validCookiejar = "H=k%3D1659%26userid%3Dxxxx";
            try {
                cookieUtil.deleteCookieInCookiejar(null, "H", function (err, cookieArray) {
                });
            } catch (thrown) {
                console.log("verify when cookiejar is not a string, the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, cb {Function}", thrown.message);
            }

            try {
                cookieUtil.deleteCookieInCookiejar(validCookiejar, undefined, function (err, cookiejarString) {
                });
            } catch (thrown1) {
                console.log("verify when cookie name is not a string , the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, cb {Function}", thrown1.message);
            }

            try {
                cookieUtil.deleteCookieInCookiejar(validCookiejar, "H", "should be callback");
            } catch (thrown2) {
                console.log("verify when cb is not a function, the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, cb {Function}", thrown2.message);
            }
        },

        'deleteCookieInCookiejar: cookie name is not in the cookie jar':function () {
            cookieUtil.deleteCookieInCookiejar("cookieA=valueA&subA=vsubA&subB=vsubB;cookieB=valueB", "subA", function (err, cookiejarString) {
                Y.Assert.areEqual(messageconfig.NONEXISTING_COOKIE + "subA", err.message);
            });
        },

        'deleteCookieInCookiejar: cookie name is in the cookie jar':function () {
            cookieUtil.deleteCookieInCookiejar("cookieA=valueA;cookieB=valueB", "cookieB", function (err, cookiejarString) {
                console.log("verify when the deleted cookie is at the tail of the cookie string", "info");
                Y.Assert.areEqual("cookieA=valueA", cookiejarString);
            });
            cookieUtil.deleteCookieInCookiejar("cookieA=valueA;cookieB=valueB", "cookieA", function (err, cookiejarString) {
                console.log("verify when the deleted cookie is at the header of the cookie string", "info");
                Y.Assert.areEqual("cookieB=valueB", cookiejarString);
            });
            cookieUtil.deleteCookieInCookiejar("cookieA=valueA; cookieB=valueB; cookieC=valueC", "cookieB", function (err, cookiejarString) {
                console.log("verify when the deleted cookie is at the middle of the cookie string", "info");
                Y.Assert.areEqual("cookieA=valueA;  cookieC=valueC", cookiejarString);
            });
        },

        'deleteCookieInCookiejar: target delete cookie appeared more than once in the cookiejar':function () {
            cookieUtil.deleteCookieInCookiejar("cookieA=valueA1; cookieB=valueB; cookieA=valueA2", "cookieA", function (err, cookiejarString) {
                Y.Assert.areEqual("cookieB=valueB", cookiejarString);
            });
        },

        //modifyCookieInCookiejar(cookiejar, name, value, cb)
        'modifyCookieInCookiejar: invalid parameters':function () {
            var validCookiejar = "H=k%3D169%26userid%3Dxxxxx";
            var validValue = "661u0g9896sja&b=3&s=6i";
            try {
                cookieUtil.modifyCookieInCookiejar(null, "H", validValue, function (err, cookieString) {
                });
            } catch (thrown) {
                console.log("verify when cookiejar is not a string, the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, value {String}, cb {Function}", thrown.message);
            }

            try {
                cookieUtil.modifyCookieInCookiejar(validCookiejar, undefined, validValue, function (err, cookieString) {
                });
            } catch (thrown1) {
                console.log("verify when cookie name is not a string , the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, value {String}, cb {Function}", thrown1.message);
            }

            try {
                cookieUtil.modifyCookieInCookiejar(validCookiejar, "B", Infinity, function (err, cookieString) {
                });
            } catch (thrown2) {
                console.log("verify when cookie value is not a string , the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, value {String}, cb {Function}", thrown2.message);
            }

            try {
                cookieUtil.modifyCookieInCookiejar(validCookiejar, "H", validValue, "should be callback");
            } catch (thrown3) {
                console.log("verify when cb is not a function, the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, value {String}, cb {Function}", thrown3.message);
            }
        },

        'modifyCookieInCookiejar: cookie name is not in the cookie jar':function () {
            cookieUtil.modifyCookieInCookiejar("cookieA=valueA&subA=vsubA&subB=vsubB;cookieB=valueB", "subA", "modifySubA", function (err, cookieString) {
                console.log("the error message is " + err.message, "warn");
                Y.Assert.areEqual(messageconfig.NONEXISTING_COOKIE + "subA", err.message);
            });
        },

        ' modifyCookieInCookiejar: cookie name is in the cookie jar':function () {
            cookieUtil.modifyCookieInCookiejar("cookieA=valueA; cookieB=valueB", "cookieB", "modifiedB", function (err, cookieString) {
                console.log("verify when the modified cookie is at the tail of the cookie string", "info");
                Y.Assert.areEqual("cookieA=valueA; cookieB=modifiedB", cookieString);
            });
            cookieUtil.modifyCookieInCookiejar("cookieA=valueA; cookieB=valueB", "cookieA", "modifiedA", function (err, cookieString) {
                console.log("verify when the modified cookie is at the header of the cookie string", "info");
                Y.Assert.areEqual("cookieA=modifiedA; cookieB=valueB", cookieString);
            });
            cookieUtil.modifyCookieInCookiejar("cookieA=valueA; cookieB=valueB; cookieC=valueC", "cookieB", "modifiedB", function (err, cookieString) {
                console.log("verify when the modified cookie is at the middle of the cookie string", "info");
                Y.Assert.areEqual("cookieA=valueA; cookieB=modifiedB; cookieC=valueC", cookieString);
            });
        },

        'modifyCookieInCookiejar: the target cookie value does not meet the spec':function () {
            cookieUtil.modifyCookieInCookiejar("H=hValue", "H", "invalid H value", function (err, cookieString) {
                console.log("verify when the target value is not a valid value, the error will be shown");
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_VALUE + "invalid H value", err.message);
            });
        },

        'modifyCookieInCookiejar: duplicated cookies in the cookiejar':function () {
            cookieUtil.modifyCookieInCookiejar("cookieA=valueA; cookieB=valueB; cookieA=valueA", "cookieA", "dupValueA", function (err, cookieString) {
                Y.Assert.areEqual("cookieA=dupValueA; cookieB=valueB; cookieA=dupValueA", cookieString);
            });
        },

        'appendCookieInCookiejar: invalid parameters':function () {
            var validCookiejar = "H=a%3D133%26userid%3Dxxx";
            var validValue = "661u0g9896sja&b=3&s=6i";
            try {
                cookieUtil.appendCookieInCookiejar(null, "H", validValue, function (err, cookieString) {
                });
            } catch (thrown) {
                console.log("verify when cookiejar is not a string, the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, value {String}, cb {Function}", thrown.message);
            }

            try {
                cookieUtil.appendCookieInCookiejar(validCookiejar, undefined, validValue, function (err, cookieString) {
                });
            } catch (thrown1) {
                console.log("verify when cookie name is not a string , the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, value {String}, cb {Function}", thrown1.message);
            }

            try {
                cookieUtil.appendCookieInCookiejar(validCookiejar, "H", Infinity, function (err, cookieString) {
                });
            } catch (thrown2) {
                console.log("verify when cookie value is not a string , the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, value {String}, cb {Function}", thrown2.message);
            }

            try {
                cookieUtil.appendCookieInCookiejar(validCookiejar, "H", validValue, "should be callback");
            } catch (thrown3) {
                console.log("verify when cb is not a function, the correct error will be thrown.", "info");
                Y.Assert.areEqual(messageconfig.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, value {String}, cb {Function}", thrown3.message);
            }
        },

        ' appendCookieInCookiejar: new cookie name is not in the cookie jar':function () {
            cookieUtil.appendCookieInCookiejar("cookieA=valueA&subA=vsubA&subB=vsubB; cookieB=valueB", "cookieC", "valueC", function (err, cookieString) {
                Y.Assert.areEqual("cookieA=valueA&subA=vsubA&subB=vsubB; cookieB=valueB; cookieC=valueC", cookieString);
            });
        },

        'appendCookieInCookiejar: new cookie name is already in the cookie jar':function () {
            cookieUtil.appendCookieInCookiejar("cookieA=valueA; cookieB=valueB", "cookieB", "appendB", function (err, cookieString) {
                console.log("verify when the append cookie is already existing, the correct prompt message is shown", "info");
                Y.Assert.areEqual(messageconfig.EXISTING_COOKIE + "cookieB", err.message);
            });
        },

        'appendCookieInCookiejar: the cookie name and value user want to append do not meet the spec':function () {
            cookieUtil.appendCookieInCookiejar("H=hValue", "append cookie", "appendValue", function (err, cookieString) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_NAME + "or " + messageconfig.INVALID_COOKIE_VALUE, err.message);
            });
            cookieUtil.appendCookieInCookiejar("H=hValue", "appendCookie", "append,Value", function (err, cookieString) {
                Y.Assert.areEqual(messageconfig.INVALID_COOKIE_NAME + "or " + messageconfig.INVALID_COOKIE_VALUE, err.message);
            });
        }
    });


    Y.Test.Runner.add(cookieInHeaderCases);
    Y.Test.Runner.add(createCookeTestCases);
    Y.Test.Runner.add(validatecookiecase);
    Y.Test.Runner.add(modifycookiecase);
    Y.Test.Runner.add(parsecookiecase);
    Y.Test.Runner.add(cookiejarcase);
    Y.Test.Runner.add(invalidCookieCase);
//    Y.Test.Runner.add(cookieUtilIsMethodsCase);

}, '0.0.1', {
    requires:['test', 'io-nodejs', 'cookieUtil']
});

