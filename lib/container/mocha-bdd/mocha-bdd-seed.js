/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
function captureConsoleMessages() {

	try {
		if (console) {
			//Making sure we dont redefine console methods
			if (!console.oldLog) {

				//capturing console log
				console.oldLog = console.log;
				console.log = function (line) {
					ARROW.consoleLog += "[LOG] " + line + "\n";
					console.oldLog(line);
				};

				//capturing console info
				console.oldInfo = console.info;
				console.info = function (line) {
					ARROW.consoleLog += "[INFO] " + line + "\n";
					console.oldInfo(line);
				};

				//capturing console warn
				console.oldWarn = console.warn;
				console.warn = function (line) {
					ARROW.consoleLog += "[WARN] " + line + "\n";
					console.oldWarn(line);
				};

				//capturing console debug
				console.oldDebug = console.debug;
				console.debug = function (line) {
					ARROW.consoleLog += "[DEBUG] " + line + "\n";
					console.oldDebug(line);
				};

				//capturing console debug
				console.oldError = console.error;
				console.error = function (line) {
					ARROW.consoleLog += "[ERROR] " + line + "\n";
					console.oldError(line);
				};
			}
		}
	} catch (e) {

	}

}

if ((typeof process !== "undefined") && (typeof require !== "undefined")) {
	//server side
	YUI = require("yui").YUI;
	var Mocha = require('mocha');

	mocha = new Mocha;

	mocha.addFile(ARROW.testfile);
	mocha.loadFiles();

	ARROW.onSeeded();

} else {

	ARROW.consoleLog = "";

	captureConsoleMessages();

	function loadScript(url, callback) {
		var script = document.createElement("script");
		script.type = "text/javascript";

		if (script.readyState) { // IE
			script.onreadystatechange = function () {
				if (("loaded" === script.readyState) || ("complete" === script.readyState)) {
					script.onreadystatechange = null;
					callback();
				}
			};
		} else { // Others
			script.onload = function () {
				callback();
			};
		}

		script.src = url;
		document.body.appendChild(script);
	}

	function createDiv(text) {
		var div = document.createElement("div");
		div.innerHTML = text;
		document.body.appendChild(div);
	}

	createDiv();

	loadScript("../../../node_modules/mocha/mocha.js", function () {

		console.log("should be get mocha?");
		console.log(window.mocha);
		mocha.setup('bdd');
		ARROW.onSeeded();

	});


}

