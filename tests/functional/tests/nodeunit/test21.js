/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testunitwithScanPath = function(test){

    var test21 = fs.readFileSync("data/actual_op/test21.txt", "utf-8")
    var expected_test21 = fs.readFileSync("data/expected_op/expected_test21.txt", "utf-8")

    test.equal(test21,expected_test21,"The expected output for config.js should be "+expected_test21+ " but it is " +test21);
    test.done();
};