/*jslint forin:true sub:true undef: true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/
/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

// Provided by the fw
// ARROW = {};
// ARROW.autoTest = false; // for self contained app and test, such as html
// ARROW.testParams = {};
// ARROW.appSeed = ""; // YUI min or equivalent
// ARROW.testLibs = [];
// ARROW.scriptType = "test";
// ARROW.testScript = "test-file.js";
// ARROW.onSeeded = function() { /* add test, hand over to runner */}

ARROW.testBag = ["test"];
ARROW.testReport = null;

// try to catch unhandled errors
if ((typeof window !== "undefined") && !window.onerror) {
    window.onerror = function (errorMsg, sourceUrl, lineNumber) {

        try {
            console.log("javascript error: " + errorMsg + " at " + lineNumber + ", url: " + sourceUrl);
        } catch (e) {

        }
        return true;
    };
}

(function () {


    // return true if a < b
    function version_lt(a, b) {
        var i;
        a = a.split('.');
        b = b.split('.');
        for (i = 0; i < a.length; i += 1) {
            if (parseInt(a[i], 10) < parseInt(b[i], 10)) {
                return true;
            }
        }
        return false;
    }


    function loadScript(url, callback) {

        if (typeof url === "undefined"
            || (typeof url === "string" && url.length === 0 )
            || (Array.isArray && Array.isArray(url) && url.length === 0))return callback();

        function injectScript(item, finish) {

            if (typeof item === "undefined"
                || (typeof item === "string" && item.length === 0 ))return finish();

            var script = document.createElement("script");
            script.type = "text/javascript";

            if (script.readyState) { // IE
                script.onreadystatechange = function () {
                    if (("loaded" === script.readyState) || ("complete" === script.readyState)) {
                        script.onreadystatechange = null;
                        finish();
                    }
                };
            } else { // Others
                script.onload = function () {
                    finish();
                };
            }
            script.src = item;
            document.body.appendChild(script);
        }

        if (typeof url === 'string') {  // one single url,support comma seperator
            url = url.split(',');
        }

        url = [].concat(url);   // with url, we can load multiple script like [yui.js,chai.js]

        function asyncForEach(array, fn, done) {
            var completed = 0;

            if (array.length === 0) {
                done(); // done immediately
            }
            var len = array.length;
            for (var i = 0; i < len; i++) {
                fn(array[i], function () {
                    completed++;
                    if (completed === array.length) {
                        done();
                    }
                });
            }
        };

        asyncForEach(url, injectScript, callback);

    }

    function captureConsoleMessages() {

        try {
            if (console) {
                //Making sure we dont redefine console methods
                if (!console.oldLog) {

                    //capturing console log
                    console.oldLog = console.log;
                    console.log = function (line) {
                        ARROW.consoleLog += "[LOG] " + line + "\n";
                        console.oldLog(line);
                    };

                    //capturing console info
                    console.oldInfo = console.info;
                    console.info = function (line) {
                        ARROW.consoleLog += "[INFO] " + line + "\n";
                        console.oldInfo(line);
                    };

                    //capturing console warn
                    console.oldWarn = console.warn;
                    console.warn = function (line) {
                        ARROW.consoleLog += "[WARN] " + line + "\n";
                        console.oldWarn(line);
                    };

                    //capturing console debug
                    console.oldDebug = console.debug;
                    console.debug = function (line) {
                        ARROW.consoleLog += "[DEBUG] " + line + "\n";
                        console.oldDebug(line);
                    };

                    //capturing console debug
                    console.oldError = console.error;
                    console.error = function (line) {
                        ARROW.consoleLog += "[ERROR] " + line + "\n";
                        console.oldError(line);
                    };
                }
            }
        } catch (e) {

        }

    }

    function onYUIAvailable() {
        var module = ARROW.testParams["module"],
            yuiAddFunc = YUI.add;

        //initializing Arrow console log
        ARROW.consoleLog = "";

        //capturing console messages
        captureConsoleMessages();

        // capture module style tests
        YUI.add = function (name, fn, version, meta) {
            yuiAddFunc(name, fn, version, meta);

            if (module && (name !== module)) {
                return;
            }

            if (("test" === ARROW.scriptType) && (-1 !== name.indexOf("-tests"))) {
                //console.log("Found test module: " + name);
                ARROW.testBag.push(name);
            }
        };

        ARROW.onSeeded();
    }

    if (typeof YUI === "undefined") {
        if ((typeof process !== "undefined") && (typeof require !== "undefined")) {
            //console.log("requiring YUI");
            YUI = require("yui").YUI;

            //console.log("Injecting share lib seed (YUI global config)");
            var fs = require('fs');
            if (ARROW.shareLibServerSeed !== undefined) {
                try {
                    require(ARROW.shareLibServerSeed);
                } catch (e) {
                    if (console) {
                        console.error("share lib server side seed cannot be injected");
                        console.error(e);
                    }
                }
            }
            onYUIAvailable();
        } else {
            //console.log("Injecting YUI");
            if (ARROW.useYUISandbox) {  // no need to inject yui seed into page
                loadScript(ARROW.libUrls, onYUIAvailable);
            } else {   // force inject yui-seed no matter if the page has yui
                loadScript([].concat(ARROW.appSeed).concat(ARROW.libUrls).join(), onYUIAvailable);
            }
        }
    } else if (version_lt(YUI.version, '3.4.0')) {
        //console.log("Found old YUI");
        if (ARROW.useYUISandbox) {  // no need to inject yui seed into page
            loadScript(ARROW.libUrls, onYUIAvailable);
        } else {   // force inject yui-seed no matter if the page has yui
            loadScript([].concat(ARROW.appSeed).concat(ARROW.libUrls).join(), onYUIAvailable);
        }

    } else {
        //console.log("YUI Version :" + YUI.version);
        loadScript(ARROW.libUrls, onYUIAvailable);
    }
})();

