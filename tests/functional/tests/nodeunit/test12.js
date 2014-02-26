/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_testDescriptor7 = function(test){

    var test12 = fs.readFileSync("data/actual_op/test12.txt", "utf-8")
    var expected_test12 = fs.readFileSync("data/expected_op/expected_test12.txt", "utf-8")

    test.equal(test12,expected_test12,"The output of arrow test_descriptor.json --reportFolder=../../report --report=true is not correct");
    test.done();
};