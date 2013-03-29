/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var isCommonJS = typeof window == "undefined" && typeof exports == "object";
var seed = isCommonJS ? require('../interface/engine-seed').containerSeed : window.containerSeed

function mochaSeed(config) {
	this.config = config || {};
	seed.call(this, config);
}

mochaSeed.prototype = Object.create(seed.prototype);
//mochaSeed.prototype.__proto__ = seed.prototype

mochaSeed.prototype.generateServerSideSeed = function (cb) {

	var Mocha = require('mocha');
	mocha = new Mocha(this.config);
	if(!this.config.ui){
		mocha.ui('bdd');// ui is necessary
	}
	ARROW.testLibs.forEach(function(item){
		mocha.addFile(item);
	});
	mocha.addFile(ARROW.testfile);
	mocha.loadFiles();
	cb();

}

mochaSeed.prototype.generateClientSideSeed = function (cb) {

	var self = this;

	function createDiv(text) {
		var div = document.createElement("div");
		div.id = text;
		div.innerHTML = text;
		document.body.appendChild(div);
	}

	createDiv("mocha");

	this.loadScript("http://ydn.zenfs.com/yahoo-arrow/container/mocha/mocha.js", function () {
		console.log("can we get mocha?");
		console.log(window.mocha);
		if(!self.config.ui){
			self.config.ui='bdd';  // ui is necessary
		}
		mocha.setup(self.config);
		cb();
	});
}

new mochaSeed(ARROW.engineConfig).run();

