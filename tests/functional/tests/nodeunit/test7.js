/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_testDescriptor3 = function(test){

    var test7 = fs.readFileSync("data/actual_op/test7.txt", "utf-8")
    var expected_test7 = fs.readFileSync("data/expected_op/expected_test7.txt", "utf-8")

    test.equal(test7,expected_test7,"The output of arrow test_descriptor.json --testName=int is not correct");
    test.done();
};