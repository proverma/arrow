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

    var cm = new capabilityMgr();

    suite.add(new Y.Test.Case({
        "Confirm constructor can take json": function(){
            Y.Assert.isNotNull(cm, "Make sure Capability Manager is not null");

        }
    }));

    suite.add(new Y.Test.Case({
        "Confirm getCapability works if JSON filepath passed": function(){
            var expectedString = {"browserName":"firefox","platform":"WINDOWS","version":"6.0","javascriptEnabled":"true"};
            var cap = cm.getCapability(__dirname + "/capabilities.json", "win_xp_ff_6");
            Y.Assert.areEqual(JSON.stringify(expectedString), JSON.stringify(cap), "Confirm the same JSON is returned");

            //Make sure null is returned and invalid capability is given
            cap = cm.getCapability("", "invalid");
            Y.Assert.isNull(cap, "Confirm null is returned if invalid cap is given");
        }
    }));


    suite.add(new Y.Test.Case({
        "Confirm getCapability is null if both JSON blob or filePath is invalid": function(){
            var expectedString = {"browserName":"firefox","platform":"WINDOWS","version":"6.0","javascriptEnabled":"true"};
            var cap = cm.getCapability(__dirname + "/capabilities2.json", "win_xp_ff_6");
            Y.Assert.areEqual(null, cap, "Caps JSON shall be null");

        }
    }));


    suite.add(new Y.Test.Case({
        "Confirm getCapability works if JSON blob passed": function(){
            var caps = "{\"capabilities\": {\"win_xp_ff_6\": {\"browserName\": \"firefox\",\"platform\": \"WINDOWS\",\"version\": \"6.0\"},\"mac_chrome_18\": {"
                     + "\"browserName\": \"chrome\",\"platform\": \"MAC\",\"version\": \"18.0\"}},\"common_capabilities\": {\"javascriptEnabled\": \"true\"}}";
            var expectedString = {"browserName":"firefox","platform":"WINDOWS","version":"6.0","javascriptEnabled":"true"};
            var cap = cm.getCapability(caps, "win_xp_ff_6");
            Y.Assert.areEqual(JSON.stringify(expectedString), JSON.stringify(cap), "Confirm the same JSON is returned");

            //Make sure null is returned and invalid capability is given
            cap = cm.getCapability("", "invalid");
            Y.Assert.isNull(cap, "Confirm null is returned if invalid cap is given");
        }
    }));


    suite.add(new Y.Test.Case({
        "Test proxy capabilities - proxy true": function(){

           var args = {},
               caps = {};

           args.proxyUrl='someHost:10000';
           args.proxy = true;

           caps = cm.setProxyCaps(caps, args);

            Y.Assert.areEqual('someHost:10000',caps.proxy.httpProxy,"Http Proxy url doesnt match");
            Y.Assert.areEqual('someHost:10000',caps.proxy.sslProxy,"Ssl Proxy url doesnt match");
            Y.Assert.areEqual('manual',caps.proxy.proxyType,"proxy type doesnt match");

        }
    }));


    suite.add(new Y.Test.Case({
        "Test proxy capabilities - proxy undefined": function(){

            var args = {},
                caps = {};

            args.proxyUrl='someHost:10000';

            caps = cm.setProxyCaps(caps, args);

            Y.Assert.areEqual('someHost:10000',caps.proxy.httpProxy,"Http Proxy url doesnt match");
            Y.Assert.areEqual('someHost:10000',caps.proxy.sslProxy,"Ssl Proxy url doesnt match");
            Y.Assert.areEqual('manual',caps.proxy.proxyType,"proxy type doesnt match");

        }
    }));


    suite.add(new Y.Test.Case({
        "Test proxy capabilities - proxy false": function(){

            var args = {},
                caps = {};

            args.proxyUrl='someHost:10000';
            args.proxy = false;

            caps = cm.setProxyCaps(caps, args);
            Y.Assert.isUndefined(caps.proxy, ' Caps proxy should be undefined if proxy set to false');

        }
    }));


    suite.add(new Y.Test.Case({
        "Test proxy capabilities": function(){

            var args = {},
                caps = {};

            args.proxyUrl='someHost:10000';
            args.proxy = true;

            caps = cm.setProxyCaps(caps, args);

            Y.Assert.areEqual('someHost:10000',caps.proxy.httpProxy,"Http Proxy url doesnt match");
            Y.Assert.areEqual('someHost:10000',caps.proxy.sslProxy,"Ssl Proxy url doesnt match");
            Y.Assert.areEqual('manual',caps.proxy.proxyType,"proxy type doesnt match");

        }
    }));


    suite.add(new Y.Test.Case({
        "Test mobile capabilities": function(){

            var args = {},
                caps = {};

            caps.browserName = "iphone";
            caps.version = "latest";

            args.proxyUrl='someHost:10000';
            args.proxy = true;

            caps = cm.setMobileCaps(caps);

            Y.Assert.areEqual('iphone',caps.deviceName,"Caps deviceName should be iphone");
            Y.Assert.areEqual('iOS',caps.platformName,"Caps platformName should be iOS");
            Y.Assert.areEqual('Safari',caps.browserName,"Caps browserName should be Safari");

        }
    }));


    suite.add(new Y.Test.Case({
        "Test browser caps for reuse and proxy": function(){

            var args = {},
                caps = {},
                config = {};

            caps.browserName = "reuse";
            caps.proxy = {
                "httpProxy": "someHost:10000",
                "sslProxy": "someHost:10000",
                "proxyType": "manual"
            };

            caps = cm.setBrowserCaps(caps, args, config);

            Y.Assert.areEqual('firefox',caps.browserName,"Caps browser should be firefox");
            Y.Assert.areEqual('latest',caps.version,"Caps version should be latest");
        }
    }));


    suite.add(new Y.Test.Case({

        "Test process user capabilities": function(){

            var caps = {
                "platform": "ANY",
                "javascriptEnabled": true,
                "seleniumProtocol": "WebDriver"
            };
            caps.browserName = "mac_chrome_18";

            var config = {};
            config.capabilities = __dirname + "/capabilities.json";
            config.browser = "mac_chrome_18";

            caps = cm.processUserCapabilities(caps,config);

            Y.Assert.areEqual('WebDriver',caps.seleniumProtocol,"Caps seleniumProtocol should be WebDriver");
            Y.Assert.isTrue(true,caps.javascriptEnabled,"Caps javascriptEnabled should be true");
            Y.Assert.areEqual('chrome',caps.browserName,"Caps browserName should be chrome");
            Y.Assert.areEqual('MAC',caps.platform,"Caps platform should be MAC");
            Y.Assert.areEqual('18.0',caps.version,"Caps version should be 18.0");

        }
    }));

    suite.add(new Y.Test.Case({
        "Test Sauce capabilities - passed in config": function(){
           var args = {},
               caps = {},
               config = {};
           config.isSauceLabs = true;
           config.sauceUsername = "sauceuser";
           config.sauceAccesskey = "saucekey";

           caps = cm.setSauceCaps(caps, config);

            Y.Assert.areEqual('sauceuser',caps.username, "Capabilities username doesnt match when passed from config");
            Y.Assert.areEqual('saucekey',caps.accessKey, "Capabilities accesskey doesnt match when passed from config");
        }
    }));

    suite.add(new Y.Test.Case({
        "Test Sauce capabilities - isSauceLabs false": function(){
           var args = {},
               caps = {},
               config = {};

           config.isSauceLabs = false;
           caps = cm.setSauceCaps(caps, config);

            Y.Assert.isUndefined(caps.username, "Capabilities username should be undefined");
            Y.Assert.isUndefined(caps.accessKey, "Capabilities accesskey should be undefined");
        }
    }));



    suite.add(new Y.Test.Case({
        "Test Sauce capabilities - passed in environment": function(){
           var args = {},
               caps = {},
               config = {};
           config.isSauceLabs = true;
           process.env.SAUCE_USERNAME = "sauceuser";
           process.env.SAUCE_ACCESS_KEY = "saucekey";

           caps = cm.setSauceCaps(caps, config);

            Y.Assert.areEqual('sauceuser',caps.username, "Capabilities username doesnt match when passed from environment");
            Y.Assert.areEqual('saucekey',caps.accessKey, "Capabilities accesskey doesnt match when passed from environment");

            delete process.env.SAUCE_USERNAME;
            delete process.env.SAUCE_ACCESS_KEY;
        }
    }));

    Y.Test.Runner.add(suite);

}, '0.0.1' ,{requires:['test']});