/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
var isCommonJS = (typeof process !== "undefined") && (typeof require !== "undefined") || false;
var runner = isCommonJS ? require('../interface/engine-runner').containerRunner : window.containerRunner

function mochaTddRunner(config){
	this.config = config || {}
	runner.call(this,config);
	this.mocharunner = null;
}

// cross-browser?
mochaTddRunner.prototype = Object.create(runner.prototype);
//mochaTddRunner.prototype.__proto__=runner.prototype

mochaTddRunner.prototype.setClientSideReporter = function (cb) {
	mocha.reporter('html');
	cb();
};

mochaTddRunner.prototype.setServerSideReporter = function (cb) {
	mocha.reporter('spec');
	cb();
};


mochaTddRunner.prototype.runRunner = function (cb) {
	this.mocharunner= mocha.run();
	cb();
};


mochaTddRunner.prototype.collectReport = function (cb) {

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

new mochaTddRunner().run();