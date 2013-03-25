

var path = require('path');
global.appRoot = path.join(__dirname, '../../..');
var fs = require('fs'),
	arrowRoot = global.appRoot,
	servermanager = require(arrowRoot + '/arrow_server/arrowservermanager.js');

servermanager.startArrowServer(function (started) {
	servermanager.getArrowServerStatus(function (res) {
		console.log(res);
		// stop server
		servermanager.stopArrowServer(false);
		var exec = require('child_process').exec;
		exec('ps aux|grep arrow_server/server.js | grep -v \'grep\'',
			function (error, stdout, stderr) {
				console.log(stdout);
			});

	});
});
