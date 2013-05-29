/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/28/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testunitwithScanPath = function(test){

    var test28 = fs.readFileSync("data/actual_op/test28.txt", "utf-8")
    var expected_test28 = fs.readFileSync("data/expected_op/expected_test28.txt", "utf-8")

    test.equal(test28,expected_test28,"The expected output for config.js should be "+expected_test28+ " but it is " +test28);
    test.done();
};