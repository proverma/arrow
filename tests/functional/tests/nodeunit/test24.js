/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testMartiniCtllerwithScanPath = function(test){

    var test24 = fs.readFileSync("data/actual_op/test24.txt", "utf-8")
    var expected_test24 = fs.readFileSync("data/expected_op/expected_test24.txt", "utf-8")

    test.equal(test24,expected_test24,"The expected output for config.js should be "+expected_test24+ " but it is " +test24);
    test.done();
};