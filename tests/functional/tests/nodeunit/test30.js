/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/30/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testunitwithScanPath = function(test){

    var test30 = fs.readFileSync("data/actual_op/test30.txt", "utf-8")
    var expected_test30 = fs.readFileSync("data/expected_op/expected_test30.txt", "utf-8")

    test.equal(test30,expected_test30,"The expected output for config.js should be "+expected_test30+ " but it is " +test30);
    test.done();
};