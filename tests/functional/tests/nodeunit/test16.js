/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testfail_Controller = function(test){

    var test16 = fs.readFileSync("data/actual_op/test16.txt", "utf-8")
    var expected_test16 = fs.readFileSync("data/expected_op/expected_test16.txt", "utf-8")

    test.equal(test16,expected_test16,"The output failed controller is not consistent");
    test.done();
};