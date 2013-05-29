/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testfail_Controller = function(test){

    var test17 = fs.readFileSync("data/actual_op/test17.txt", "utf-8")
    var expected_test17 = fs.readFileSync("data/expected_op/expected_test17.txt", "utf-8")

    var contains= test17.toString().indexOf(expected_test17)!=-1;
    test.equal(contains,true,"The expected output "+test17+ " should contains " +expected_test17);

    test.done();
};