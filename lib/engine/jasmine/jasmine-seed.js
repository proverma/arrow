/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var isCommonJS = typeof window == "undefined" && typeof exports == "object";
var seed = isCommonJS ? require('../interface/engine-seed').containerSeed : window.containerSeed

function jasmineSeed(config) {
	this.config = config || {};
	seed.call(this, config);
}

jasmineSeed.prototype = Object.create(seed.prototype);

jasmineSeed.prototype.generateServerSideSeed = function (cb) {

	jasmine = require('jasmine-node');

	var coffee, isVerbose, jasmine, key, showColors, sys, _i, _len;
	for (_i = 0, _len = jasmine.length; _i < _len; _i++) {
		key = jasmine[_i];
		global[key] = jasmine[key];
	}
	cb();

}

jasmineSeed.prototype.generateClientSideSeed = function (cb) {

	var self = this;
	function loadjasmine(){
		self.loadScript("http://ydn.zenfs.com/yahoo-arrow/container/jasmine/vendor/jasmine-1.2.0/jasmine-html.js",function(){
				console.log("can we get jasmine?");
				console.log(window.jasmine);
				cb();
			}
		);
	}
	self.loadScript("http://ydn.zenfs.com/yahoo-arrow/container/jasmine/vendor/jasmine-1.2.0/jasmine.js",function(){
		loadjasmine();
	});
}

new jasmineSeed(ARROW.engineConfig).run();

