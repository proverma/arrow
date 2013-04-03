/*
 * Copyright (c) 2012-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('engine-mocha-client-tests', function (Y, NAME) {

	if (!global.ARROW || !global.ARROW.testLibs) {
		global.ARROW = {};
		global.ARROW.onSeeded = function () {
			console.log("seeded");
		}
		global.ARROW.shareLibServerSeed = "server seed";
		global.ARROW.consoleLog = "";
		global.ARROW.testLibs = [__dirname + "/test-data.js"];
		global.ARROW.testfile = __dirname + "/test-data.js";
	}

	var path = require('path'),
		curDir,
		arrowRoot = path.join(__dirname, '../../../..'),

		suite = new Y.Test.Suite(NAME),
		A = Y.Assert;

	var EventEmitter = require('events').EventEmitter
	function mockrunner(suite){
		var self = this;
		this.suite = suite;
	}
	mockrunner.prototype.__proto__ = EventEmitter.prototype;

	var mrunner = new mockrunner();

	setTimeout(mrunner.emit("suite"),1000);

	suite.add(new Y.Test.Case({
		'setUp':function () {
			curDir = process.cwd();
			process.chdir(arrowRoot);
			require("module")._cache = {};
			window = {};
			mocha={};
			mocha.reporter = function(reporter){}
			mocha.run = function(){
				return mrunner;
			}
			mocha.setup = function(){
			}
		},
		'tearDown':function () {
			process.chdir(curDir);
			delete window;
			delete document;
			delete mocha;
		},

		'test new mocha runner':function () {
			require(arrowRoot + '/lib/engine/interface/engine-runner');

			require(arrowRoot + '/lib/engine/mocha/mocha-runner');

			setTimeout(mrunner.emit("suite",{title:"test"}),1000);
			setTimeout(mrunner.emit("test end",{title:"test",state:"passed"}),1000);
			setTimeout(mrunner.emit("test end",{title:"test",pending:true}),1000);
			setTimeout(mrunner.emit("test end",{title:"test",err:{message:"err message"}}),1000);
			setTimeout(mrunner.emit("suite end",{title:"test"}),1000);
			setTimeout(mrunner.emit("end",{title:"test"}),1000);

		},
		'test new mocha seed':function () {

			document = {};
			document.createElement = function (type) {
				return {onload:function(){}};
			}
			document.body = {};
			document.body.appendChild = function (type) {
				type.onload();
			}

			require(arrowRoot + '/lib/engine/interface/engine-seed');

			require(arrowRoot + '/lib/engine/mocha/mocha-seed');

			document.createElement = function (type) {
				return {readyState:"loaded"};
			}
			document.body.appendChild = function (type) {
				type.onreadystatechange();
			}
			require(arrowRoot + '/lib/engine/mocha/mocha-seed');

		}
	}));

	Y.Test.Runner.add(suite);
}, '0.0.1', {requires:['test']});

