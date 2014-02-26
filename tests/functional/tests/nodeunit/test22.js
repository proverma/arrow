/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testfuncwithScanPath = function(test){

    var test22 = fs.readFileSync("data/actual_op/test22.txt", "utf-8")
    var expected_test22 = fs.readFileSync("data/expected_op/expected_test22.txt", "utf-8")

    test.equal(test22,expected_test22,"The expected output for config.js should be "+expected_test22+ " but it is " +test22);
    test.done();
};