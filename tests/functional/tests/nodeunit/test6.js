/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_testDescriptor2 = function(test){

    var test6 = fs.readFileSync("data/actual_op/test6.txt", "utf-8")
    var expected_test6 = fs.readFileSync("data/expected_op/expected_test6.txt", "utf-8")

    test.equal(test6,expected_test6,"The output of arrow test_descriptor.json --group=smoke is not correct");
    test.done();
};