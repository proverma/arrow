/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testunitwithScanPath = function(test){

    var test26 = fs.readFileSync("data/actual_op/test26.txt", "utf-8")
    var expected_test26 = fs.readFileSync("data/expected_op/expected_test26.txt", "utf-8")

    test.equal(test26,expected_test26,"The expected output for config.js should be "+expected_test26+ " but it is " +test26);
    test.done();
};