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
var isCommonJS = typeof window == "undefined" && typeof exports == "object";

function engineRunner(config) {
	this.config = config || {}
	if (!ARROW)ARROW = {};
}

engineRunner.prototype.setClientSideReporter = function (callback) {
	callback();
};

engineRunner.prototype.setServerSideReporter = function (callback) {
	callback();
};

engineRunner.prototype.collectReport = function (callback) {
	callback();
};


engineRunner.prototype.runRunner = function (callback) {
	callback();
}

engineRunner.prototype.run = function () {
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
	module.exports.engineRunner = engineRunner;
}else{
	window.engineRunner = engineRunner
}
