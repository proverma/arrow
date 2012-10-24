/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_testDescriptor8 = function(test){

    var test13 = fs.readFileSync("data/actual_op/test13.txt", "utf-8")
    var expected_test13 = fs.readFileSync("data/expected_op/expected_test13.txt", "utf-8")

    test.equal(test13,expected_test13,"The output of arrow **/*_descriptor.json  is not correct");
    test.done();
};