/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testArrow_testDescriptor5 = function(test){

    var test9 = fs.readFileSync("data/actual_op/test9.txt", "utf-8")
    var expected_test9 = fs.readFileSync("data/expected_op/expected_test9.txt", "utf-8")

    test.equal(test9,expected_test9,"The output of arrow test_descriptor.json --browser=firefox,phantomjs is not correct");
    test.done();
};