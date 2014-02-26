/**
 * Created with JetBrains WebStorm.
 * User: payshah
 * Date: 7/26/12
 * Time: 1:47 PM
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');

exports.testfail_Controller = function(test){

    var test18 = fs.readFileSync("data/actual_op/test18.txt", "utf-8")
    var expected_test18 = fs.readFileSync("data/expected_op/expected_test18.txt", "utf-8")

    test.equal(test18,expected_test18,"The output for --context=environment:development is not correct");
    test.done();
};