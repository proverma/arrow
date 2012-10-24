/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_testDescriptor6 = function(test){

    var test10 = fs.readFileSync("data/actual_op/test10.txt", "utf-8")
    var expected_test10 = fs.readFileSync("data/expected_op/expected_test10.txt", "utf-8")

    test.equal(test10,expected_test10,"The output of arrow test_descriptor.json --parallel=2 is not correct");
    test.done();
};