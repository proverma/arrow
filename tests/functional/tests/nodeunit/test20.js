/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testfail_Controller = function(test){

    var test20 = fs.readFileSync("data/actual_op/test20.txt", "utf-8")
    var expected_test20 = fs.readFileSync("data/expected_op/expected_test20.txt", "utf-8")

    test.equal(test20,expected_test20,"The expected output for config.js should be "+expected_test20+ " but it is " +test20);
    test.done();
};