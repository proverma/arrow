/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var isCommonJS = typeof window == "undefined" && typeof exports == "object";
var seed = isCommonJS ? require('../interface/engine-seed').engineSeed : window.engineSeed

function jasmineSeed(config) {
	this.config = config || {};
	seed.call(this, config);
}

jasmineSeed.prototype = Object.create(seed.prototype);

jasmineSeed.prototype.generateServerSideSeed = function (cb) {

	// make it global
	jasmine = require('jasmine-node');
	cb();

}

jasmineSeed.prototype.generateClientSideSeed = function (cb) {

	var self = this;

	function loadjasmine() {
		self.loadScript("http://ydn.zenfs.com/yahoo-arrow/container/jasmine/vendor/jasmine-1.2.0/jasmine-html.js", function () {
				cb();
			}
		);
	}

	self.loadScript("http://ydn.zenfs.com/yahoo-arrow/container/jasmine/vendor/jasmine-1.2.0/jasmine.js", function () {
		console.log(window.jasmine);
		loadjasmine();
	});
}

new jasmineSeed(ARROW.engineConfig).run();

