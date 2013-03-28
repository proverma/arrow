/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var isCommonJS = (typeof process !== "undefined") && (typeof require !== "undefined") || false;
var seed = isCommonJS ? require('../interface/engine-seed').containerSeed : window.containerSeed

function mochaTddSeed(config) {
	this.config = config || {}
	seed.call(this, config);
}

mochaTddSeed.prototype = Object.create(seed.prototype);
//mochaTddSeed.prototype.__proto__ = seed.prototype

mochaTddSeed.prototype.generateServerSideSeed = function (cb) {

	var Mocha = require('mocha');
	mocha = new Mocha;
	mocha.ui('tdd');
	mocha.addFile(ARROW.testfile);
	mocha.loadFiles();
	cb();

}

mochaTddSeed.prototype.generateClientSideSeed = function (cb) {

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
		mocha.setup('tdd');
		cb();
	});
}

new mochaTddSeed().run();

