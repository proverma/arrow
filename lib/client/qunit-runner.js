/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

//window.qunitReport = null;
//window.arrowGetTestReport = function() {
//    return window.qunitReport;
//};
if ((typeof process !== "undefined") && (typeof require !== "undefined")) {

} else {
    env = window;
}

setTimeout(function () {
    var current_test_assertions = [],
        module = "default",
        report = {
            "passed": 0,
            "failed": 0,
            "total": 0,
            "type": "report",
            "name": "QUnit Test Results",
            "default": {
                "passed": 0,
                "failed": 0,
                "total": 0,
                "type": "testsuite",
                "name": "default"
            }
        };

    QUnit.moduleStart(function (context) {
        module = context.name;
        report[module] = {
            "passed": 0,
            "failed": 0,
            "total": 0,
            "type": "testsuite",
            "name": module
        };
    });

    QUnit.testDone(function (result) {
        var name = module + ': ' + result.name,
            i,
            message;

        if (result.failed) {
            console.log('Assertion Failed: ' + name);

            message = "";
            for (i = 0; i < current_test_assertions.length; i += 1) {
                message += current_test_assertions[i] + " ";
            }
            console.log(message);

            report["failed"] += 1;
            report[module]["failed"] += 1;

            report[module][result.name] = {
                "result": "fail",
                "name": result.name,
                "type": "test",
                "message": message
            };
        } else {
            report["passed"] += 1;
            report[module]["passed"] += 1;

            report[module][result.name] = {
                "result": "pass",
                "name": result.name,
                "type": "test",
                "message": "Test passed."
            };
        }

        report["total"] += 1;
        report[module]["total"] += 1;
        current_test_assertions = [];
    });

    QUnit.log(function (details) {
        var response;

        if (details.result) {
            return;
        }

        response = details.message || '';

        if (typeof details.expected !== 'undefined') {
            if (response) {
                response += ', ';
            }

            response += 'expected: ' + details.expected + ', but was: ' + details.actual;
        }

        current_test_assertions.push('Failed assertion: ' + response);
    });

    QUnit.done(function (result) {
        console.log('Took ' + result.runtime + 'ms to run ' + result.total + ' tests. ' + result.passed + ' passed, ' + result.failed + ' failed.');
//        window.qunitReport = JSON.stringify(report);
        ARROW.testReport = JSON.stringify(report);
    });

    QUnit.start();
}, 0);

