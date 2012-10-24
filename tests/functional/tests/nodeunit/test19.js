/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testfail_Controller = function(test){

    var test19 = fs.readFileSync("data/actual_op/test19.txt", "utf-8")
    var expected_test19 = fs.readFileSync("data/expected_op/expected_test19.txt", "utf-8")

    test.equal(test19,expected_test19,"The output for --browser=phantomjs should be "+expected_test19+ " but it is "+ test19);
    test.done();
};