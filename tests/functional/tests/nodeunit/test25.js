/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testMartiniCtllerwithScanPath = function(test){

    var test25 = fs.readFileSync("data/actual_op/test25.txt", "utf-8")
    var expected_test25 = fs.readFileSync("data/expected_op/expected_test25.txt", "utf-8")

	var contains= test25.toString().indexOf(expected_test25)!=-1;
	test.equal(contains,true,"The expected output "+test25+ " should contains " +expected_test25);
    test.done();
};