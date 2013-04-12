/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var isCommonJS = typeof window == "undefined" && typeof exports == "object";
var seed = isCommonJS ? require('../interface/engine-seed').engineSeed : window.engineSeed

/**
 * @constructor
 * @param config
 */
function mochaSeed(config) {
	this.config = config || {};
	seed.call(this, config);
}

mochaSeed.prototype = Object.create(seed.prototype);

/**
 * mocha generate server side seed
 * just require node package and load the test file/libs
 * @param cb
 */
mochaSeed.prototype.generateServerSideSeed = function (cb) {

	var Mocha = require('mocha');
	mocha = new Mocha(this.config);

	var DEFAULT_UI = "bdd",
		DEFAULT_ASSERTION = "chai";

	// set up ui
	if (!this.config.ui) {
		mocha.ui(DEFAULT_UI);// ui is necessary
	}
	// load all files
	ARROW.testLibs.forEach(function (item) {
		mocha.addFile(item);
	});
	mocha.addFile(ARROW.testfile);
	mocha.loadFiles();

	// default have "should support" in server side
	require(DEFAULT_ASSERTION);
	if (this.config.require) {
		var mods = this.config.require;
		mods = Array.isArray(mods) ? mods : [mods];
		mods.forEach(function (item) {
			try {
				require(item);
			} catch (e) {
				console.error(e);
			}
		});
	}
	cb();
}

/**
 * mocha generate client side seed
 * for now load mocha.js from ydn.zenfs.com
 * @param cb
 */
mochaSeed.prototype.generateClientSideSeed = function (cb) {

	var self = this,
		MOCHA_LINK = "http://ydn.zenfs.com/yahoo-arrow/container/mocha/mocha.js",
		DEFAULT_UI = "bdd";

	// chai is default supported and we will use official url
	var DEFAULT_ASSERTION = {
		"chai":"http://chaijs.com/chai.js"
	}

	function createDiv(text) {
		var div = document.createElement("div");
		div.id = text;
		div.innerHTML = text;
		document.body.appendChild(div);
	}

	createDiv("mocha");

	// check the given item is good enough for load,for example:
	// if given require:"chai" ,we default load http://chaijs.com/chai.js
	// if given require:"should", we just load(require it) in server side
	// if given a url http://******/**.js we load it too.

	function onRequireReady() {
		// load mocha
		self.loadScript(MOCHA_LINK, function () {
			if (!self.config.ui) {
				self.config.ui = DEFAULT_UI;  // ui is necessary
			}
			var m_config = self.config,
				configs = Object.keys(m_config);
			for (var i = 0; i < configs.length; i++) {
				if (typeof mocha[configs[i]] !== "function")delete m_config[configs[i]];
			}
			mocha.setup(m_config);
			cb();
		});
	}

	// deal with require
	if (self.config.require) {

		var canBeLoadInClient = function (item) {
				var url = null;
				var assertions = Object.keys(DEFAULT_ASSERTION);
				for (var i = 0; i < assertions.length; i++) {
					if (assertions[i] == item || DEFAULT_ASSERTION[assertions[i]] == item)
						url = DEFAULT_ASSERTION[assertions[i]];
				}
				if (url !== null)return url;
				var ipreg = /^((http|https):\/\/)((.*?):(.*?)@)?(.*\.js$)/;
				if (ipreg.test(item))url = item;
				return url;
			},

			asyncForEach = function (array, fn, callback) {
				var completed = 0;

				if (array.length === 0) {
					callback(); // done immediately
				}
				var len = array.length;
				for (var i = 0; i < len; i++) {
					fn(array[i], function () {
						completed++;
						if (completed === array.length) {
							callback();
						}
					});
				}
			};

		var mods = self.config.require;
		mods = Array.isArray(mods) ? mods : [mods];

		asyncForEach(mods, function (el, callback) {
			var url = canBeLoadInClient(el);
			var loaded = false;
			if (url !== null) {
				self.loadScript(url, function () {
					loaded = true;
					callback();
				});
				// make sure run callback no matter if external source is loaded;
				setTimeout(function () {
					if (!loaded) {
						if (console)console.warn("please check if your require url: " + url + " is available");
						callback();
					}
				}, 5000);

			} else {
				callback();
			}
		}, function () {
			onRequireReady();
		});

	} else {
		onRequireReady();
	}
}

new mochaSeed(ARROW.engineConfig).run();

