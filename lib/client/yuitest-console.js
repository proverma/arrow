/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/
/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI().use("io", "json-stringify", function (Y) {

    function postConsoleLog(log) {
        var msg = { "ua" : navigator.userAgent, "message" : log};
        Y.io("/arrow/event/console", {
            method : "POST",
            data : Y.JSON.stringify(msg)
        });
    }

    var postConsole = function () {
    };
    postConsole.log = postConsoleLog;
    postConsole.info = postConsoleLog;

    if (window.console) {
        window.console = postConsole;
    }
});
