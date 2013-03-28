/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/**
 * this is interface for container runer
 * users can extend other test container/engine if implement this interface
 */
var isCommonJS = (typeof process !== "undefined") && (typeof require !== "undefined") || false;

function containerRunner(config) {
	this.config = config || {}
	if (!ARROW)ARROW = {};
}

containerRunner.prototype.setClientSideReporter = function (callback) {
	callback();
};

containerRunner.prototype.setServerSideReporter = function (callback) {
	callback();
};

containerRunner.prototype.collectReport = function (callback) {
	callback();
};


containerRunner.prototype.runRunner = function (callback) {
	callback();
}

containerRunner.prototype.run = function () {
	var self=this;
	if (isCommonJS) {
		// server side
		self.setServerSideReporter(function(){
			self.runRunner(function () {
				self.collectReport(function(report){
					ARROW.testReport = JSON.stringify(report);
				});
			});
		});

	} else {
		// client side
		self.setClientSideReporter(function(){
			self.runRunner(function () {
				self.collectReport(function(report){
					ARROW.testReport = JSON.stringify(report);
				});
			});
		});
	}
}

if (isCommonJS) {
	module.exports.containerRunner = containerRunner;
}else{
	window.containerRunner = containerRunner
}
