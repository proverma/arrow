/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_testDescriptor9 = function(test){

    var test14 = fs.readFileSync("data/actual_op/test14.txt", "utf-8")
    var expected_test14 = fs.readFileSync("data/expected_op/expected_test14.txt", "utf-8")

    test.equal(test14,expected_test14,"The output of arrow **/*_descriptor.json --report=true is not correct");
    test.done();
};