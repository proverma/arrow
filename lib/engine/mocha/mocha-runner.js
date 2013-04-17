/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var isCommonJS = typeof window === "undefined" && typeof exports === "object";
var runner = isCommonJS ? require('../interface/engine-runner').engineRunner : window.engineRunner;

var module = "default",
    report = {
        "passed": 0,
        "failed": 0,
        "ignored": 0,
        "total": 0,
        "type": "report",
        "name": "Mocha Test Results",
        "default": {
            "passed": 0,
            "failed": 0,
            "ignored": 0,
            "duration": 0,
            "total": 0,
            "type": "testcase",
            "name": "default"
        }
    },
    cnt = 0;
/**
 * @constructor
 * @param config mocha engine config
 */
function mochaRunner(config) {
    this.config = config || {};
    runner.call(this, config);
    this.mocharunner = null;
}

mochaRunner.prototype = Object.create(runner.prototype);

/**
 * mocha set client side reporter
 * @param cb
 */
mochaRunner.prototype.setClientSideReporter = function (cb) {
    var clientReport = this.config.reporter || "html";
    mocha.reporter(clientReport);
    cb();
};

/**
 * mocha set server side reporter
 * @param cb
 */
mochaRunner.prototype.setServerSideReporter = function (cb) {
    var serverReport = this.config.reporter || 'spec';
    mocha.reporter(serverReport);
    cb();
};

/**
 * call mocha runner
 * @param cb
 */
mochaRunner.prototype.runRunner = function (cb) {
    this.mocharunner = mocha.run();
    this.mocharunner.ignoreLeaks = true;
    cb();
};

/**
 * call mocha to collect report
 * just listen for emit-events and collect reports
 * @param cb
 */
mochaRunner.prototype.collectReport = function (cb) {

    this.mocharunner.on('suite', function (suite) {
        module = suite.title || "suite" + (++cnt);
        report[module] = {
            "passed": 0,
            "failed": 0,
            "ignored": 0,
            "duration": 0,
            "total": 0,
            "type": "testcase",
            "name": module
        };
    });

    this.mocharunner.on('test end', function (test) {
        console.log(test);
        test.title = test.title || "test case";
        if ('passed' === test.state) {
            report["passed"] += 1;
            report[module]["passed"] += 1;
            report[module][test.title] = {
                "result": "pass",
                "name": test.title,
                "type": "test",
                "message": "Test passed."
            };
        } else if (test.pending) {
            report["ignored"] += 1;
            report[module]["ignored"] += 1;
            report[module][test.title] = {
                "result": "skipped",
                "name": test.title,
                "type": "test",
                "message": "Test skipped."
            };
        } else {
            report["failed"] += 1;
            report[module]["failed"] += 1;
            report[module][test.title] = {
                "result": "fail",
                "name": test.title,
                "type": "test",
                "message": test.err.message || "test failed"
            };
        }
        report["total"] += 1;
        report[module]["total"] += 1;
    });

    this.mocharunner.on('suite end', function (suite) {
    });

    this.mocharunner.on('end', function (suite) {
        cb(report);
    });
};

new mochaRunner(ARROW.engineConfig).run();