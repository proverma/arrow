/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/29/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testunitwithScanPath = function(test){

    var test29 = fs.readFileSync("data/actual_op/test29.txt", "utf-8")
    var expected_test29 = fs.readFileSync("data/expected_op/expected_test29.txt", "utf-8")

    test.equal(test29,expected_test29,"The expected output for config.js should be "+expected_test29+ " but it is " +test29);
    test.done();
};