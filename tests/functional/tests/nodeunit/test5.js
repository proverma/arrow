/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_testDescriptor1 = function(test){

    var test5 = fs.readFileSync("data/actual_op/test5.txt", "utf-8")
    var expected_test5 = fs.readFileSync("data/expected_op/expected_test5.txt", "utf-8")

    test.equal(test5,expected_test5,"The output of arrow test_descriptor.json is not correct");
    test.done();
};