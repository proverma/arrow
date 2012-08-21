/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/
/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI().use("io", "test", function (Y) {

    var retryCount = 0,
        reportInterval = window.setInterval(function () {
            console.log("Waiting for the test report");
            var YTest = window.YUITest,
                results;
            if (YTest && YTest.TestRunner._root && YTest.TestRunner._root.results &&
                    YTest.TestRunner._root.results.type === "report") {
                window.clearInterval(reportInterval);

                results = YTest.TestRunner._root.results;
                results.ua = navigator.userAgent;
                Y.io("/arrow/event/report", {
                    method : "POST",
                    data : YTest.TestRunner.getResults(YTest.ResultsFormat.JSON)
                });
            } else {
                retryCount = retryCount + 1;
                if (retryCount > 10) {
                    window.clearInterval(reportInterval);
                    console.log("Failed to collect the test report");
                }
            }
        }, 500);
});

