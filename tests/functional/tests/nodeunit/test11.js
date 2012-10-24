/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_testDescriptor7 = function(test){

    var test11 = fs.readFileSync("data/actual_op/test11.txt", "utf-8")
    var expected_test11 = fs.readFileSync("data/expected_op/expected_test11.txt", "utf-8")

    test.equal(test11,expected_test11,"The output of arrow test_descriptor.json --browser=firefox-13.0 is not correct");
    test.done();
};