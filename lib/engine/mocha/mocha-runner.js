/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
var isCommonJS = typeof window == "undefined" && typeof exports == "object";
var runner = isCommonJS ? require('../interface/engine-runner').engineRunner : window.engineRunner

function mochaRunner(config){
	this.config = config  || {}
	runner.call(this,config);
	this.mocharunner = null;
}

mochaRunner.prototype = Object.create(runner.prototype);

mochaRunner.prototype.setClientSideReporter = function (cb) {
	var clientReport=this.config.reporter || "html";
	mocha.reporter(clientReport);
	cb();
};

mochaRunner.prototype.setServerSideReporter = function (cb) {
	var serverReport=this.config.reporter || 'spec';
	mocha.reporter(serverReport);
	cb();
};


mochaRunner.prototype.runRunner = function (cb) {
	this.mocharunner= mocha.run();
	cb();
};


mochaRunner.prototype.collectReport = function (cb) {

	var passed=0;
	var failed=0;
	var pending=0;
	var total=0;

	this.mocharunner.on('test end', function(test){

		if ('passed' == test.state) {
			passed++;
		}else if(test.pending){
			pending++;
		}else{
			failed++;
		}
		total++;
	});

	this.mocharunner.on('end', function(suite){
		var report = {
			"passed": passed,
			"failed": failed,
			"ignored":pending,
			"total": total,
			"type": "report",
			"name": "mocha Test Results"
		};
		cb(report);
	});
};

new mochaRunner(ARROW.engineConfig).run();