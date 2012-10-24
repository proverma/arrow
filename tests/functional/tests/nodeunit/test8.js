/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_testDescriptor4 = function(test){

    var test8 = fs.readFileSync("data/actual_op/test8.txt", "utf-8")
    var expected_test8 = fs.readFileSync("data/expected_op/expected_test8.txt", "utf-8")

    test.equal(test8,expected_test8,"The output of arrow test_descriptor.json --report=true is not correct");
    test.done();
};