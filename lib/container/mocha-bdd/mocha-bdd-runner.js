/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/
/*jslint undef: true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

if ((typeof process !== "undefined") && (typeof require !== "undefined")) {
	// server side
	mocha.reporter('spec');

}else{
	mocha.reporter('html');
}
	var runner = mocha.run();
	var passed=0;
	var failed=0;
	var pending=0;
	var total=0;

	runner.on('test end', function(test){

		if ('passed' == test.state) {
			passed++;
		}else if(test.pending){
			pending++;
		}else{
			failed++;
		}
	});

	runner.on('suite end', function(suite){
		var report = {
			"passed": passed,
			"failed": failed,
			"total": total,
			"type": "report",
			"name": "mocha Test Results"
		};
		ARROW.testReport = JSON.stringify(report);
	});