/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var isCommonJS = typeof window == "undefined" && typeof exports == "object";
var runner = isCommonJS ? require('../interface/engine-runner').engineRunner : window.engineRunner

if (!jasmine && window.jasmine)jasmine = window.jasmine;

// add new arrow-jasmine reporter ,maybe better solutions

(function (jasmine, console) {
	if (!jasmine) {
		throw "jasmine library isn't loaded!";
	}

	var ArrowReporter = function () {
		if (!console || !console.log) {
			throw "console isn't present!";
		}
		this.status = this.statuses.stopped;
	};

	var proto = ArrowReporter.prototype;
	proto.statuses = {
		stopped:"stopped",
		running:"running",
		fail:"fail",
		success:"success"
	};

	proto.reportRunnerStarting = function (runner) {
		this.status = this.statuses.running;
		this.start_time = (new Date()).getTime();
		this.executed_specs = 0;
		this.passed_specs = 0;
		this.log("Starting...");
	};

	var module = "default",
		report = {
			"passed":0,
			"failed":0,
			"ignored":0,
			"total":0,
			"type":"report",
			"name":"Jasmine Test Results",
			"default":{
				"passed":0,
				"failed":0,
				"ignored":0,
				"total":0,
				"type":"testcase",
				"name":"default"
			}
		},
		cnt = 0;

	proto.reportRunnerResults = function (runner) {
		var failed = this.executed_specs - this.passed_specs;
		var spec_str = this.executed_specs + (this.executed_specs === 1 ? " spec, " : " specs, ");
		var fail_str = failed + (failed === 1 ? " failure in " : " failures in ");
		var dur = (new Date()).getTime() - this.start_time;

		this.log(spec_str + fail_str + (dur / 1000) + "s.");

		this.status = (failed > 0) ? this.statuses.fail : this.statuses.success;

		/* Print something that signals that testing is over so that headless browsers
		 like PhantomJs know when to terminate. */
		this.log("ConsoleReporter finished");
		// TODO: should move to collectReport

		report["passed"] += this.passed_specs;
		report["failed"] += failed;
		report["ignored"] += 0;
		report["total"] += this.executed_specs;

		ARROW.testReport = JSON.stringify(report);
	};


	proto.reportSpecStarting = function (spec) {
		this.executed_specs++;
	};

	proto.reportSpecResults = function (spec) {
		var desc = spec.description || "jasmine test cases",
			module = spec.suite.description;

		report[module]=report[module] ||
			{
			"passed":0,
			"failed":0,
			"ignored":0,
			"total":0,
			"type":"testcase",
			"name":module
		};
		if (spec.results().passed()) {
			this.passed_specs++;
			report[module]["passed"] += 1;
			report[module][desc] = {
				"result":"pass",
				"name":desc,
				"type":"test",
				"message":"Test passed."
			};

		} else {
			var items = spec.results().getItems()
			var trace = "";
			for (var i = 0; i < items.length; i++) {
				trace += items[i].trace.stack || items[i].trace;
			}
			report[module]["failed"] += 1;
			report[module][desc] = {
				"result":"fail",
				"name":desc,
				"type":"test",
				"message":trace || "test failed"
			};
		}

	};

	proto.reportSuiteResults = function (suite) {
		if (!suite.parentSuite) {
			return;
		}
		var results = suite.results();
		var failed = results.totalCount - results.passedCount;
		this.log(suite.getFullName() + ": " + results.passedCount + " of " + results.totalCount + " passed.");

//		module = suite.getFullName() || "suite" + (++cnt)
//		report[module] = {
//			"passed":results.passedCount,
//			"failed":failed,
//			"ignored":0,
//			"total":results.totalCount,
//			"type":"testcase",
//			"name":module
//		};

	};

	proto.log = function (str) {
		console.log(str);
	};

	jasmine.ArrowReporter = ArrowReporter;
})(jasmine, console);


function jasmineRunner(config) {
	this.config = config || {}
	runner.call(this, config);
	this.mocharunner = null;
}

// cross-browser?
jasmineRunner.prototype = Object.create(runner.prototype);

jasmineRunner.prototype.setClientSideReporter = function (cb) {
	jasmine = window.jasmine;
	jasmine.getEnv().addReporter(new jasmine.ArrowReporter());
	cb();
};

jasmineRunner.prototype.setServerSideReporter = function (cb) {
	jasmine.getEnv().addReporter(new jasmine.ArrowReporter());
	cb();
};


jasmineRunner.prototype.runRunner = function (cb) {
	jasmine.getEnv().execute();
	cb();
};

jasmineRunner.prototype.collectReport = function (cb) {
	cb();
};

new jasmineRunner(ARROW.engineConfig).run();