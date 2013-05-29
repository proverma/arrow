/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
if(!global.appRoot)global.appRoot = require('path').join(__dirname, '../../..');

YUI.add('arrowservermanager-tests', function (Y) {

	var path = require('path');
	var fs = require('fs'),
		arrowRoot = global.appRoot,
		servermanager = require(arrowRoot + '/arrow_server/arrowservermanager.js'),
		suite = new Y.Test.Suite("arrow server manager test suite");

	function clearup() {
		try {
			fs.unlinkSync(path.join(arrowRoot,'tmp','arrow_server.status'));
		} catch (e) {
		}
	}

	suite.add(new Y.Test.Case({

		"Test get localhost ip":function () {

			Y.Assert.isTrue(/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.test(servermanager.getLocalhostIPAddress()));
			Y.Assert.isTrue(/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.test(servermanager.getAllIPAddressForArrowServer()));

		},
		"Test server host":function () {
			clearup();
			Y.Assert.isTrue(servermanager.getArrowServerHost() == undefined);

			servermanager.getArrowServerStatus(function (res) {
				Y.Assert.isFalse(res);
			});
		},

		"Test start/stop server":function () {

			var self = this;
			clearup();
			servermanager.startArrowServer(function (started) {
				self.resume(function () {
					Y.Assert.isTrue(started);
					Y.Assert.isTrue(servermanager.getArrowServerHost() !== undefined);
					servermanager.getArrowServerStatus(function (res) {
						self.resume(function(){
							Y.Assert.isTrue(res);
							// stop server
							servermanager.stopArrowServer(true);
							var exec = require('child_process').exec;
							exec('ps aux|grep arrow_server/server.js | grep -v \'grep\'',
								function (error, stdout, stderr) {
									self.resume(function(){
										console.log("stdout is:"+stdout);
										Y.Assert.isFalse(stdout.length > 0);
									});
								});
							self.wait(5000);
						})
					});
					self.wait(5000);
				})
			});
			self.wait(5000);
		},
		"Test get server status":function () {
			var self = this;
			fs.writeFileSync(path.join(arrowRoot,'tmp','arrow_server.status'),"http://10.10.10.10:10000");
			servermanager.getArrowServerStatus(function (res) {
				self.resume(function(){
					Y.Assert.isFalse(res);
					// stop server
					servermanager.startArrowServer(function (started) {
						self.resume(function () {
							Y.Assert.isTrue(started);
							Y.Assert.isTrue(servermanager.getArrowServerHost() !== undefined);
							servermanager.stopArrowServer(true);
							clearup();
						})
					});
					self.wait(5000);
				})
			});
			self.wait(5000);

		}
	}));

	Y.Test.Runner.add(suite);

}, '0.0.1', {requires:['test']});
 
