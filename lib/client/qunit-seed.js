/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
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

if ((typeof process !== "undefined") && (typeof require !== "undefined")) {
    //server side
    QUnit = require('qunit');
    YUI = require("yui").YUI;
    QUnit.init();
    ARROW.onSeeded();

} else {

    window.arrowInitStatus = "no";
    window.arrowGetInitStatus = function () {
        return window.arrowInitStatus;
    };

    ARROW.consoleLog = "";
    captureConsoleMessages();

    window.$.getScript("http://code.jquery.com/qunit/qunit-git.js", function () {
        window.arrowInitStatus = "yes";
        QUnit.init();
        ARROW.onSeeded();
    });
}

