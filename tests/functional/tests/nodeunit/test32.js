/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/32/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testunitwithScanPath = function(test){

    var test32 = fs.readFileSync("data/actual_op/test32.txt", "utf-8")
    var expected_test32 = fs.readFileSync("data/expected_op/expected_test32.txt", "utf-8")

    test.equal(test32,expected_test32,"The expected output for config.js should be "+expected_test32+ " but it is " +test32);
    test.done();
};