/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
var isCommonJS = typeof window == "undefined" && typeof exports == "object";
var runner = isCommonJS ? require('../interface/engine-runner').containerRunner : window.containerRunner

function mochaRunner(config){
	this.config = config  || {}
	runner.call(this,config);
	this.mocharunner = null;
}

// cross-browser?
mochaRunner.prototype = Object.create(runner.prototype);
//mochaRunner.prototype.__proto__=runner.prototype

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
	});

	this.mocharunner.on('suite end', function(suite){
		var report = {
			"passed": passed,
			"failed": failed,
			"total": total,
			"type": "report",
			"name": "mocha Test Results"
		};
		cb(report);
	});
};

new mochaRunner(ARROW.engineConfig).run();