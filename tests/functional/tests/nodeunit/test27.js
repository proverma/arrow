/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/27/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testunitwithScanPath = function(test){

    var test27 = fs.readFileSync("data/actual_op/test27.txt", "utf-8")
    var expected_test27 = fs.readFileSync("data/expected_op/expected_test27.txt", "utf-8")

    test.equal(test27,expected_test27,"The expected output for config.js should be "+expected_test27+ " but it is " +test27);
    test.done();
};