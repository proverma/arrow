/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/31/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testunitwithScanPath = function(test){

    var test31 = fs.readFileSync("data/actual_op/test31.txt", "utf-8")
    var expected_test31 = fs.readFileSync("data/expected_op/expected_test31.txt", "utf-8")

    test.equal(test31,expected_test31,"The expected output for config.js should be "+expected_test31+ " but it is " +test31);
    test.done();
};